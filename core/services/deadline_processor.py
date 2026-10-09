from django.utils import timezone
from django.db import transaction
from core.models import Task, TaskState, Payment
from core.notifications import send_user_notification
from core.telegram import send_telegram_message
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


def process_expired_open_tasks():
    """
    Cancel OPEN tasks whose deadline has passed without any taker.
    - Moves task to CANCELLED.
    - If payment was verified/pending verification, sets status to REFUND_PENDING.
    - Sends in-app and push notification to the Giver.
    - Sends alert to Telegram admin to process the refund.
    - Syncs giver tokens.
    """
    now = timezone.now()
    expired_open_tasks = (
        Task.objects
        .select_related("giver")
        .filter(state=TaskState.OPEN, deadline__lt=now)
    )

    processed_count = 0
    for task in expired_open_tasks:
        try:
            with transaction.atomic():
                task = Task.objects.select_for_update().get(pk=task.pk)
                if task.state != TaskState.OPEN or (task.deadline and task.deadline >= timezone.now()):
                    continue

                prev_state = task.state
                task.state = TaskState.CANCELLED
                task.save(update_fields=["state", "updated_at"])

                # Handle escrow refund
                refund_amount = task.price
                has_paid = False
                if hasattr(task, "payment"):
                    payment = task.payment
                    refund_amount = payment.amount or task.price
                    if payment.status in [Payment.Status.RELEASED, Payment.Status.PENDING_VERIFICATION]:
                        payment.status = Payment.Status.REFUND_PENDING
                        payment.save(update_fields=["status"])
                        has_paid = True
                    elif payment.status == Payment.Status.PENDING:
                        payment.status = Payment.Status.REJECTED
                        payment.save(update_fields=["status"])

                task._log_event(
                    actor=None,
                    event="expired_unaccepted",
                    from_state=prev_state,
                    to_state=TaskState.CANCELLED,
                )

                # Send in-app and push notification to the Giver
                refund_note = (
                    f" Your escrow payment of ₹{refund_amount} has been queued for a full refund."
                    if has_paid
                    else ""
                )
                send_user_notification(
                    user=task.giver,
                    title="⏰ Gig Expired (Unclaimed)",
                    message=f"Your gig '{task.title}' was not claimed before the deadline.{refund_note}",
                    url="/my-tasks",
                )

                # Send Telegram alert to Admin
                if has_paid:
                    send_telegram_message(
                        f"⏰ GigHive — Unclaimed Gig Expired\n\n"
                        f"Task ID: #{task.id}\n"
                        f"Task: {task.title}\n"
                        f"Giver: {task.giver.username}\n"
                        f"Amount: ₹{refund_amount}\n\n"
                        f"Status: REFUND_PENDING\n"
                        f"Action: Refund giver in Django Admin."
                    )

                if hasattr(task.giver, "profile"):
                    task.giver.profile.sync_tokens()

                processed_count += 1
        except Exception as e:
            logger.error("Error expiring open task #%s: %s", task.id, e)

    return processed_count


def process_expired_accepted_tasks():
    """
    Fail ACCEPTED tasks whose deadline has passed without submission.
    - Calls task.fail():
        * Burns taker's locked token (penalty)
        * Unlocks giver's locked token
        * Sets state to FAILED
        * Sets payment to REFUND_PENDING
    - Sends in-app and push notification to Taker (penalty).
    - Sends in-app and push notification to Giver (refund).
    - Sends Telegram alert to Admin.
    - Syncs tokens for both users.
    """
    now = timezone.now()
    expired_tasks = (
        Task.objects
        .select_related("giver", "taker")
        .filter(state=TaskState.ACCEPTED, deadline__lt=now)
    )

    processed_count = 0
    for task in expired_tasks:
        try:
            with transaction.atomic():
                task = Task.objects.select_for_update().get(pk=task.pk)
                if task.state != TaskState.ACCEPTED or (task.deadline and task.deadline >= timezone.now()):
                    continue

                if not task.taker:
                    continue

                taker = task.taker
                giver = task.giver
                amount = getattr(task.payment, "amount", task.price) if hasattr(task, "payment") else task.price

                task.fail(actor=None)

                # Send in-app and push notification to Taker
                send_user_notification(
                    user=taker,
                    title="⚠️ Deadline Missed",
                    message=f"You missed the deadline for '{task.title}'. 1 Hive Cred has been forfeited.",
                    url="/my-tasks",
                )

                # Send in-app and push notification to Giver
                send_user_notification(
                    user=giver,
                    title="⏰ Solver Missed Deadline",
                    message=f"The solver missed the deadline for '{task.title}'. Your escrow payment of ₹{amount} is queued for a full refund.",
                    url="/my-tasks",
                )

                # Send Telegram alert to Admin
                send_telegram_message(
                    f"⏰ GigHive — Deadline Missed (Task Failed)\n\n"
                    f"Task ID: #{task.id}\n"
                    f"Task: {task.title}\n"
                    f"Giver: {giver.username}\n"
                    f"Taker: {taker.username}\n"
                    f"Amount: ₹{amount}\n\n"
                    f"Payment is now REFUND_PENDING.\n"
                    f"Action: Refund giver in Django Admin."
                )

                if hasattr(giver, "profile"):
                    giver.profile.sync_tokens()
                if hasattr(taker, "profile"):
                    taker.profile.sync_tokens()

                processed_count += 1
        except Exception as e:
            logger.error("Error failing accepted task #%s: %s", task.id, e)

    return processed_count


# Backward-compatible alias
process_expired_tasks = process_expired_accepted_tasks


def auto_complete_submitted_tasks():
    """
    Auto-complete submitted tasks if giver does not respond in 2 hours.
    Safe to run multiple times.
    """
    cutoff = timezone.now() - timedelta(hours=2)

    tasks = (
        Task.objects
        .select_related("giver", "taker")
        .filter(
            state=TaskState.SUBMITTED,
            submitted_at__lte=cutoff
        )
    )

    for task in tasks:
        try:
            with transaction.atomic():
                task = Task.objects.select_for_update().get(pk=task.pk)
                if task.state != TaskState.SUBMITTED:
                    continue

                giver_token = task.giver.token_account
                taker_token = task.taker.token_account

                giver_token.unlock(1)
                taker_token.unlock(1)

                giver_token.save()
                taker_token.save()

                prev_state = task.state
                task.state = TaskState.COMPLETED
                task.save(update_fields=["state", "updated_at"])

                task._log_event(
                    actor=None,
                    event="auto_complete",
                    from_state=prev_state,
                    to_state=TaskState.COMPLETED,
                )

                send_user_notification(
                    user=task.taker,
                    title="✅ Work Auto-Approved",
                    message=f"Your work for '{task.title}' was automatically approved after the 2-hour review window! Payment is queued for payout.",
                    url="/my-tasks",
                )
                send_user_notification(
                    user=task.giver,
                    title="✅ Task Completed",
                    message=f"Task '{task.title}' was automatically completed after the 2-hour review window.",
                    url="/my-tasks",
                )

                if hasattr(task.giver, "profile"):
                    task.giver.profile.sync_tokens()
                if hasattr(task.taker, "profile"):
                    task.taker.profile.sync_tokens()
        except Exception as e:
            logger.error("Error auto-completing task #%s: %s", task.id, e)


def check_and_expire_deadlines():
    """
    Master unified function:
    1. Expires unaccepted open tasks (refunds giver, sends notification).
    2. Fails overdue accepted tasks (penalizes taker, refunds giver, notifies both).
    3. Auto-completes submitted tasks past 2 hours.
    Safe, idempotent, and fast to run on any request or cron.
    """
    open_count = process_expired_open_tasks()
    accepted_count = process_expired_accepted_tasks()
    auto_complete_submitted_tasks()
    return open_count + accepted_count