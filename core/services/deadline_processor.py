from django.utils import timezone
from django.db import transaction
from core.models import Task, TaskState
from datetime import timedelta

def process_expired_tasks():
    """
    Fail ACCEPTED tasks whose deadline has passed.
    Safe to run multiple times.
    """

    expired_tasks = (
        Task.objects
        .select_related("giver", "taker")
        .filter(state=TaskState.ACCEPTED, deadline__lt=timezone.now())
    )

    for task in expired_tasks:
        with transaction.atomic():

            task = Task.objects.select_for_update().get(pk=task.pk)

            if task.state != TaskState.ACCEPTED:
                continue

            if not task.taker:
                continue

            # burn taker token
            task.taker.token_account.burn_locked(1)

            # unlock giver token
            task.giver.token_account.unlock(1)

            previous_state = task.state
            task.state = TaskState.FAILED
            task.save(update_fields=["state"])

            task._log_event(
                actor=None,
                event="deadline_failed",
                from_state=previous_state,
                to_state=TaskState.FAILED,
            )
            
def auto_complete_submitted_tasks():
    """
    Auto-complete submitted tasks if giver does not respond in 2 hours.
    Safe to run multiple times.
    """

    from datetime import timedelta

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
            task.save(update_fields=["state"])

            task._log_event(
                actor=None,
                event="auto_complete",
                from_state=prev_state,
                to_state=TaskState.COMPLETED,
            )            