from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from .serializers import RegisterSerializer
from core.telegram import send_telegram_message
from django.http import JsonResponse
import secrets
import os
from rest_framework.permissions import IsAuthenticated, AllowAny

from core.models import Payment, Task, TaskState, TaskType, Notification
from .serializers import (
    TaskSerializer,
    TaskPublishSerializer,
    TaskAcceptSerializer,
    TaskSubmitSerializer,
    TaskCancelSerializer,
    UserProfileSerializer,
    TaskCompleteSerializer,
    TaskRevisionSerializer,
    NotificationSerializer,
)
from core.notifications import send_user_notification, broadcast_push_notification

class TaskListView(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        task = serializer.save(giver=self.request.user)

        Payment.objects.create(
            task=task,
            payer=self.request.user,
            amount=task.price,
            status=Payment.Status.PENDING
        )
        self.request.user.profile.sync_tokens()

    def get_queryset(self):
        return (
            Task.objects
            .filter(
                published_at__isnull=False,
                taker__isnull=True,
            )
            .select_related(
                "giver",
                "task_type",
            )
            .order_by("-created_at")
        )

class TaskDetailView(generics.RetrieveAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

# core/api/views.py
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [] 

class TaskPublishView(generics.GenericAPIView):
    serializer_class = TaskPublishSerializer
    permission_classes = [IsAuthenticated]  # keep open for testing; add auth later

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data={},
            context={
                "request": request,
                "task": task,
            },
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Task published successfully."},
            status=status.HTTP_200_OK,
        )
class TaskAcceptView(generics.GenericAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskAcceptSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data={},
            context={"request": request, "task": task}
        )

        serializer.is_valid(raise_exception=True)

        try:
            serializer.save()
            task.refresh_from_db()
            request.user.profile.sync_tokens()
            send_user_notification(
                user=task.giver,
                title="🤝 Task Accepted",
                message=f"@{request.user.username} accepted your task '{task.title}'.",
                url=f"/my-tasks"
            )
        except Exception as e:
            detail = (
                e.messages[0] if hasattr(e, "messages") and e.messages
                else (e.detail[0] if hasattr(e, "detail") and isinstance(e.detail, (list, tuple)) and e.detail
                else (str(e.detail) if hasattr(e, "detail")
                else str(e)))
            )
            return Response(
                {"detail": detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = request.user.profile
        account = getattr(request.user, "token_account", None)
        return Response(
            {
                "detail": "Task accepted successfully.",
                "total_tokens": account.total_tokens if account else 1,
                "badge_type": profile.badge_type,
                "total_volume": profile.total_volume,
            },
            status=status.HTTP_200_OK,
        )

        

class TaskSubmitView(generics.GenericAPIView):
    serializer_class = TaskSubmitSerializer
    queryset = Task.objects.all()

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request,
                "task": task,
            },
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        task.refresh_from_db()

        send_user_notification(
            user=task.giver,
            title="📤 Work Submitted",
            message=f"@{request.user.username} submitted work for '{task.title}'. Tap to review.",
            url=f"/my-tasks"
        )

        return Response(
            {"detail": "Task submitted for review."},
            status=status.HTTP_200_OK,
        )
        
 
class TaskCompleteView(generics.GenericAPIView):
    serializer_class = TaskCompleteSerializer
    queryset = Task.objects.all()

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data={},
            context={
                "request": request,
                "task": task,
            },
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        task.refresh_from_db()
        task.giver.profile.sync_tokens()
        if task.taker:
            task.taker.profile.sync_tokens()

        send_telegram_message(
            f"💰 GigHive — Payout Required\n\n"
            f"Task ID: #{task.id}\n"
            f"Task: {task.title}\n"
            f"Giver: {task.giver.username}\n"
            f"Taker: {task.taker.username}\n"
            f"Amount: ₹{task.payment.amount}\n\n"
            f"Task completed successfully.\n"
            f"Action required: Pay the tasker."
        )

        if task.taker:
            send_user_notification(
                user=task.taker,
                title="🎉 Work Approved!",
                message=f"@{task.giver.username} approved your work on '{task.title}'. Payout is queued!",
                url=f"/my-tasks"
            )
        send_user_notification(
            user=task.giver,
            title="✅ Task Completed",
            message=f"'{task.title}' has been successfully completed. Thanks for using GigHive!",
            url=f"/my-tasks"
        )

        profile = request.user.profile
        account = getattr(request.user, "token_account", None)
        return Response(
            {
                "detail": "Task completed successfully.",
                "total_tokens": account.total_tokens if account else 1,
                "badge_type": profile.badge_type,
                "total_volume": profile.total_volume,
            },
            status=status.HTTP_200_OK,
        )       


class TaskRevisionView(generics.GenericAPIView):
    serializer_class = TaskRevisionSerializer
    queryset = Task.objects.all()

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request,
                "task": task,
            },
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        task.refresh_from_db()

        if task.taker:
            send_user_notification(
                user=task.taker,
                title="⚠️ Changes Requested",
                message=f"Giver requested revisions on '{task.title}': {task.revision_note}",
                url=f"/my-tasks"
            )

        return Response(
            {"detail": "Revision request sent."},
            status=status.HTTP_200_OK,
        )        
        
class TaskCancelView(generics.GenericAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskCancelSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        serializer = self.get_serializer(
            data={},
            context={
                "request": request,
                "task": task,
            },
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()
        task.refresh_from_db()

        if request.user == task.giver and task.taker:
            send_user_notification(
                user=task.taker,
                title="❌ Task Cancelled",
                message=f"Giver cancelled '{task.title}'. Your token is safe.",
                url=f"/my-tasks"
            )
        elif request.user == task.taker:
            send_user_notification(
                user=task.giver,
                title="⚠️ Taker Dropped Task",
                message=f"Taker dropped '{task.title}'. The task has been reopened.",
                url=f"/my-tasks"
            )

        return Response(
            {"detail": "Task cancelled successfully."},
            status=status.HTTP_200_OK,
        )

class PaymentSubmitView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)

        payment = Payment.objects.get(task=task)

        payment.status = Payment.Status.PENDING_VERIFICATION
        payment.save()

        send_telegram_message(
            f"🔔 GigHive — Payment Verification Required\n\n"
            f"Task ID: #{task.id}\n"
            f"Task: {task.title}\n"
            f"Giver: {task.giver.username}\n"
            f"Amount: ₹{payment.amount}\n"
            f"UTR: {payment.utr or 'Not provided'}\n\n"
            f"Action required: Verify payment in Django Admin."
        )

        return Response({
            "message": "Payment submitted for verification"
        }, status=status.HTTP_200_OK)
        
class PaymentStatusView(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):

        task = get_object_or_404(Task, pk=task_id)
        payment = Payment.objects.get(task=task)

        return Response({
            "status": payment.status
        })

        
class PaymentVerifyView(generics.GenericAPIView):

    def post(self, request, task_id):

        task = get_object_or_404(Task, pk=task_id)
        payment = Payment.objects.get(task=task)
        if not request.user.is_staff:
            raise PermissionDenied("Only admins can verify payments")
        if payment.status != Payment.Status.PENDING_VERIFICATION:
            raise ValidationError("Payment not submitted yet")
        
        payment.verified = True
        payment.status = Payment.Status.RELEASED
        payment.save(update_fields=["verified", "status"])

        # publish the task after payment confirmation
        task.state = TaskState.OPEN
        task.published_at = timezone.now()
        task.save(update_fields=["state", "published_at", "updated_at"])

        # Notify giver
        send_user_notification(
            user=task.giver,
            title="✅ Payment Confirmed",
            message=f"Your task '{task.title}' is now live on the marketplace.",
            url=f"/task/{task.id}"
        )

        # Broadcast fresh gig alert to all students
        broadcast_push_notification(
            title="⚡ Fresh Gig Alert!",
            message=f"New task '{task.title}' (₹{task.price}) is live. Be the first to claim it!",
            url=f"/task/{task.id}"
        )

        return Response(
            {"detail": "Payment verified. Task is now open."},
            status=status.HTTP_200_OK,
        )
        
class PaymentPayoutView(generics.GenericAPIView):

    def post(self, request, task_id):

        task = get_object_or_404(Task, pk=task_id)
        payment = Payment.objects.get(task=task)

        if not request.user.is_staff:
            raise PermissionDenied("Only admins can release payouts")

        if task.state != TaskState.COMPLETED:
            raise ValidationError("Task not completed yet")

        if payment.status != Payment.Status.RELEASED:
            raise ValidationError("Payment not verified yet")

        payment.status = Payment.Status.PAID_OUT
        payment.save(update_fields=["status"])

        if task.taker:
            send_user_notification(
                user=task.taker,
                title="💰 Payment Released!",
                message=f"₹{payment.amount} for '{task.title}' has been transferred to your registered UPI ID.",
                url=f"/my-tasks"
            )
        send_user_notification(
            user=task.giver,
            title="✅ Payout Sent",
            message=f"Payout of ₹{payment.amount} has been processed for task '{task.title}'.",
            url=f"/my-tasks"
        )

        return Response(
            {"detail": "Payment released to tasker."},
            status=status.HTTP_200_OK
        )
        
class PaymentRefundView(generics.GenericAPIView):

    def post(self, request, task_id):

        task = get_object_or_404(Task, pk=task_id)
        payment = Payment.objects.get(task=task)

        if not request.user.is_staff:
            raise PermissionDenied("Only admins can issue refunds")

        if task.state != TaskState.FAILED:
            raise ValidationError("Task has not failed")

        payment.status = Payment.Status.REFUNDED
        payment.save(update_fields=["status"])

        return Response(
            {"detail": "Payment refunded to giver."},
            status=status.HTTP_200_OK
        )     
        
        
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile = self.request.user.profile
        profile.sync_tokens()
        return profile


class MyTasksView(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = []

    def get_queryset(self):
        return Task.objects.filter(
            Q(giver=self.request.user) |
            Q(taker=self.request.user)
        ).order_by("-created_at")          
        
        
class TokenAccountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request.user.profile.sync_tokens()
        token_account = request.user.token_account
        profile = request.user.profile

        from django.utils import timezone
        today = timezone.localdate()
        today_posted = Task.objects.filter(giver=request.user, created_at__date=today).exists()
        today_completed = Task.objects.filter(taker=request.user, state="COMPLETED", updated_at__date=today).exists()

        tokens = token_account.total_tokens
        if tokens <= 1:
            next_challenge = {
                "target_token": 2,
                "tier": "ACTIVE",
                "title": "First Action on Campus",
                "note": "Post your first gig or accept an open gig to earn your 2nd Hive Cred.",
                "reward": "+1 Hive Cred (Active Tier)",
                "action_url": "/create-task",
                "action_label": "Post a Gig",
            }
        elif tokens == 2:
            next_challenge = {
                "target_token": 3,
                "tier": "HUSTLER",
                "title": "Same-Day Dual Hustle",
                "note": "Same-Day Dual Challenge: Post any gig (just publish, no need to be finished today) AND accept & complete a gig on the SAME DAY.",
                "reward": "+1 Hive Cred (Hustler Tier)",
                "today_posted": today_posted,
                "today_completed": today_completed,
                "action_url": "/" if today_posted else "/create-task",
                "action_label": "Accept & Complete Gigs" if today_posted else "Post a Gig",
            }
        elif tokens == 3:
            next_challenge = {
                "target_token": 4,
                "tier": "RECRUITER",
                "title": "Campus Recruiter",
                "note": "Invite or refer a classmate who creates their first gig on GigHive.",
                "reward": "+1 Hive Cred (Recruiter Tier)",
                "action_url": "/",
                "action_label": "Invite Classmates",
            }
        elif tokens == 4:
            rem = max(0, 250 - profile.total_volume)
            next_challenge = {
                "target_token": 5,
                "tier": "MASTER",
                "title": "Campus Master Milestone (₹250)",
                "note": f"Reach ₹250 Total Campus Volume (Earned + Spent). You are at ₹{profile.total_volume}/₹250 (₹{rem} to go).",
                "reward": "5th Golden Cred + Free Homework Pass (₹100) + Bounty Booster (+₹50)",
                "action_url": "/",
                "action_label": "Trade Gigs",
            }
        else:
            next_challenge = {
                "target_token": 5,
                "tier": "MASTER",
                "title": "Master Tier Achieved 👑",
                "note": "You have unlocked all 5 Hive Creds and all elite campus perks are active!",
                "reward": "Free Homework Pass (₹100) & Bounty Booster (+₹50) Active",
                "action_url": "/leaderboard",
                "action_label": "View Leaderboard",
            }

        return Response({
            "total_tokens": token_account.total_tokens,
            "available_tokens": token_account.available_tokens,
            "locked_tokens": token_account.locked_tokens,
            "badge_type": profile.badge_type,
            "total_volume": profile.total_volume,
            "today_posted": today_posted,
            "today_completed": today_completed,
            "next_challenge": next_challenge,
        })        
        
class TaskTypeListView(generics.GenericAPIView):
    permission_classes = []

    def get(self, request):
        task_types = TaskType.objects.filter(
            is_active=True
        ).order_by("id")

        return Response([
            {
                "id": task_type.id,
                "name": task_type.name,
            }
            for task_type in task_types
        ])


class LeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from core.models import UserProfile

        profiles = list(
            UserProfile.objects.select_related("user", "user__token_account")
            .filter(user__is_active=True)
            .exclude(user__username="admin07")
        )

        for profile in profiles:
            profile.sync_tokens()

        profiles.sort(
            key=lambda p: (
                getattr(p.user.token_account, "total_tokens", 1) if hasattr(p.user, "token_account") else 1,
                p.tasks_completed_count + p.tasks_posted_count,
                p.total_volume,
            ),
            reverse=True
        )

        leaderboard = []
        for idx, profile in enumerate(profiles[:10], start=1):
            tokens = profile.user.token_account.total_tokens if hasattr(profile.user, "token_account") else 1
            badge = profile.badge_type

            if idx == 1 and badge in ["ROOKIE", "ACTIVE"]:
                badge = "MASTER"
                tokens = max(tokens, 5)

            reg = profile.registration_number or ""
            masked_reg = f"{reg[:4]}****" if len(reg) >= 4 else (reg if reg else "LPU Student")

            leaderboard.append({
                "rank": idx,
                "username": profile.user.username,
                "reg_no": masked_reg,
                "tokens": tokens,
                "badge_type": badge,
                "tasks_completed": profile.tasks_completed_count,
                "tasks_posted": profile.tasks_posted_count,
                "total_volume": profile.total_volume,
            })

        response = Response({
            "leaderboard": leaderboard,
            "speed_runners": leaderboard,
            "gold_patrons": leaderboard,
        })
        response["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"
        return response


def fail_expired_tasks_api(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    cron_secret = request.headers.get("X-Cron-Secret")

    if not cron_secret or not secrets.compare_digest(
        cron_secret,
        os.environ.get("CRON_SECRET", "")
    ):
        return JsonResponse({"error": "Unauthorized"}, status=401)

    now = timezone.now()

    expired_tasks = Task.objects.filter(
        state=TaskState.ACCEPTED,
        deadline__lt=now,
    )

    processed = 0

    for task in expired_tasks:
        try:
            task.fail()
            processed += 1

            send_telegram_message(
                f"⚠️ GigHive — Deadline Failure\n\n"
                f"Task ID: #{task.id}\n"
                f"Task: {task.title}\n"
                f"Taker: {task.taker.username}\n"
                f"Payment: Refund Pending\n\n"
                f"Action required: Refund the giver in Django Admin."
            )

        except Exception as e:
            print(f"[CRON] Failed task #{task.id}: {e}")

    return JsonResponse({
        "success": True,
        "processed": processed,
        "checked_at": now.isoformat(),
    })


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:30]
        serializer = NotificationSerializer(notifications, many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            "unread_count": unread_count,
            "notifications": serializer.data
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get("id")
        if notification_id:
            Notification.objects.filter(user=request.user, id=notification_id).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)

        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            "detail": "Marked as read",
            "unread_count": unread_count
        })