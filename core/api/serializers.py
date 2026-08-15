from django.tasks import task
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from core.models import Payment, Task, TaskState
from core.models import UserProfile

class TaskSerializer(serializers.ModelSerializer):
    giver = serializers.StringRelatedField(read_only=True)
    taker = serializers.StringRelatedField(read_only=True)

    payment_status = serializers.CharField(
        source="payment.status",
        read_only=True,
    )

    refund_upi_id = serializers.SerializerMethodField()
    earnings_upi_id = serializers.SerializerMethodField()

    class Meta:
            model = Task
            fields = [
                "id",
                "title",
                "task_type",
                "band",
                "mode",
                "deadline",
                "price",
                "details",
                "preferences",
                "location_hint",
                "availability_window",
                "bonus_tokens",
                "state",
                "giver",
                "taker",
                "submission_file",
                "submission_note",

                "revision_note",
                "revision_count",
                "payment_status",
                "refund_upi_id",
                "earnings_upi_id"
                ]
            
    def get_refund_upi_id(self, obj):
        if hasattr(obj.giver, "profile"):
           return obj.giver.profile.refund_upi_id
        return None


    def get_earnings_upi_id(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
         return obj.taker.profile.earnings_upi_id
        return None     

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="username", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "name"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "confirm_password"]

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")  # 🔥 THIS IS CRITICAL

        user = User.objects.create_user(
            username=validated_data.get("username"),
            email=validated_data.get("email"),
            password=validated_data.get("password"),
        )

        return user
        
class TaskListSerializer(serializers.ModelSerializer):
    task_type = serializers.StringRelatedField()
    band = serializers.StringRelatedField()
    mode = serializers.StringRelatedField()
    state = serializers.CharField(source="get_state_display", read_only=True)
    giver = serializers.StringRelatedField()
    taker = serializers.StringRelatedField()

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "task_type",
            "band",
            "mode",
            "price",
            "deadline",
            "state",
            "giver",
            "taker",
            "created_at",
        )
        read_only_fields = (
            "id",
            "title",
            "task_type",
            "band",
            "mode",
            "price",
            "deadline",
            "state",
            "giver",
            "taker",
            "created_at",
        )
        
        
        
        
    def create(self, validated_data):
        request = self.context["request"]

        task = Task.objects.create(
            giver=request.user,
            **validated_data
        )

        Payment.objects.create(
            task=task,
            payer=request.user,
            amount=task.price,
            status=Payment.Status.PENDING
        )

        return task
        
class TaskPublishSerializer(serializers.Serializer):

    def save(self, **kwargs):
        request = self.context["request"]
        task = self.context["task"]

        task.publish(request.user)

        return task


class TaskAcceptSerializer(serializers.Serializer):
    """
    Accept task using domain logic.
    """

    def save(self, **kwargs):
        task = self.context["task"]
        user = self.context["request"].user

        try:
            with transaction.atomic():
                task.accept(actor=user)

        except serializers.ValidationError as e:
            raise serializers.ValidationError(
                e.message_dict if hasattr(e, "message_dict") else str(e)
            )

        except PermissionDenied as e:
            raise PermissionDenied(str(e))

        return task 
    
class TaskSubmitSerializer(serializers.Serializer):
    submission_file = serializers.FileField(required=False)
    submission_note = serializers.CharField(required=False, allow_blank=True)

    def save(self, **kwargs):
        task = self.context["task"]
        user = self.context["request"].user
        request = self.context["request"]

        try:
            with transaction.atomic():

                task.submission_file = request.FILES.get(
                    "submission_file"
                )

                task.submission_note = request.data.get(
                    "submission_note",
                    ""
                )

                task.submit(actor=user)

                task.save(
                    update_fields=[
                        "submission_file",
                        "submission_note",
                        "state",
                        "submitted_at",
                        "updated_at",
                    ]
                )

        except serializers.ValidationError as e:
            raise serializers.ValidationError(str(e))

        except PermissionDenied as e:
            raise PermissionDenied(str(e))

        return task
   
   
class TaskCompleteSerializer(serializers.Serializer):

    def save(self, **kwargs):
        task = self.context["task"]
        user = self.context["request"].user

        try:
            with transaction.atomic():
                task.complete(actor=user)

        except serializers.ValidationError as e:
            raise serializers.ValidationError(str(e))

        except PermissionDenied as e:
            raise PermissionDenied(str(e))

        return task  
    
    
class TaskRevisionSerializer(serializers.Serializer):
    revision_note = serializers.CharField()

    def save(self, **kwargs):
        task = self.context["task"]
        user = self.context["request"].user

        if user != task.giver:
            raise PermissionDenied("Only the giver can request changes.")

        if task.state != TaskState.SUBMITTED:
            raise serializers.ValidationError(
                "Task must be submitted first."
            )

        if task.revision_count >= 2:
            raise serializers.ValidationError(
                "Maximum revision requests reached."
            )

        task.revision_note = self.validated_data["revision_note"]
        task.revision_count += 1
        task.reviewed_at = timezone.now()

        task.state = TaskState.ACCEPTED

        task.submission_file = None
        task.submission_note = ""
        task.submitted_at = None

        task.save(
            update_fields=[
                "state",
                "submission_file",
                "submission_note",
                "submitted_at", 
                "revision_note",
                "revision_count",
                "reviewed_at",
                "updated_at",
    ]
)
   
   
class TaskCancelSerializer(serializers.Serializer):
    """
    Cancel task using domain logic.
    """

    def save(self, **kwargs):
        task = self.context["task"]
        user = self.context["request"].user

        try:
            with transaction.atomic():
                task.cancel(actor=user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError(str(e))
        except PermissionDenied as e:
            raise PermissionDenied(str(e))

        return task  
    
    

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
    "upi_id",
    "earnings_upi_id",
    "earnings_upi_verified",
    "refund_upi_id",
    "refund_upi_verified",
]