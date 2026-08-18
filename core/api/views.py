from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from .serializers import RegisterSerializer
from rest_framework.permissions import IsAuthenticated

from core.models import Payment, Task, TaskState, TaskType
from .serializers import (
    TaskSerializer,
    TaskPublishSerializer,
    TaskAcceptSerializer,
    TaskSubmitSerializer,
    TaskCancelSerializer,
    UserProfileSerializer,
    TaskCompleteSerializer,
    TaskRevisionSerializer,
    
)

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
        except ValidationError as e:
            return Response(
                {"detail": str(e.detail[0])},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Task accepted successfully."},
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

        return Response(
            {"detail": "Task completed successfully."},
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
        return self.request.user.profile  
    
    

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
        token_account = request.user.token_account

        return Response({
            "available_tokens": token_account.available_tokens,
            "locked_tokens": token_account.locked_tokens,
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