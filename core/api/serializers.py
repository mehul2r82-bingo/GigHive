import os
import re
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from core.models import Payment, Task, TaskState, Notification
from core.models import UserProfile

class TaskSerializer(serializers.ModelSerializer):
    giver = serializers.StringRelatedField(read_only=True)
    taker = serializers.StringRelatedField(read_only=True)

    def validate(self, attrs):
        title = attrs.get("title", "")
        attachment = attrs.get("attachment")
        restricted_patterns = [
            r'\bca[-_\s]*\d+\b', r'\bca\b',
            r'continuous\s*assessment', r'\bexam\b', r'\bmidterm\b', r'\bendterm\b'
        ]

        # Auto-sanitize title for academic safety and compliance
        if title:
            clean_title = title
            for p in restricted_patterns:
                clean_title = re.sub(p, "", clean_title, flags=re.IGNORECASE)
            clean_title = re.sub(r'\s+', ' ', clean_title).strip()
            attrs["title"] = clean_title if clean_title else "Coursework Task"

        # Auto-sanitize attachment filename to prevent sensitive keyword exposure in storage
        if attachment and hasattr(attachment, "name"):
            for p in restricted_patterns:
                if re.search(p, attachment.name, re.IGNORECASE):
                    ext = os.path.splitext(attachment.name)[1] or ".pdf"
                    attachment.name = f"coursework_doc_{timezone.now().strftime('%Y%m%d%H%M%S')}{ext}"
                    break

        return super().validate(attrs)

    payment_status = serializers.CharField(
        source="payment.status",
        read_only=True,
    )

    refund_upi_id = serializers.SerializerMethodField()
    earnings_upi_id = serializers.SerializerMethodField()
    giver_badge = serializers.SerializerMethodField()
    giver_streak = serializers.SerializerMethodField()
    taker_badge = serializers.SerializerMethodField()
    taker_streak = serializers.SerializerMethodField()

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
                "attachment",

                "revision_note",
                "revision_count",
                "payment_status",
                "refund_upi_id",
                "earnings_upi_id",
                "giver_badge",
                "giver_streak",
                "taker_badge",
                "taker_streak",
                ]
            
    def get_refund_upi_id(self, obj):
        if hasattr(obj.giver, "profile"):
           return obj.giver.profile.refund_upi_id
        return None

    def get_earnings_upi_id(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
         return obj.taker.profile.earnings_upi_id
        return None

    def get_giver_badge(self, obj):
        if obj.giver and hasattr(obj.giver, "profile"):
            return obj.giver.profile.badge_type
        return None

    def get_giver_streak(self, obj):
        if obj.giver and hasattr(obj.giver, "profile"):
            return obj.giver.profile.speed_streak
        return 0

    def get_taker_badge(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
            return obj.taker.profile.badge_type
        return None

    def get_taker_streak(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
            return obj.taker.profile.speed_streak
        return 0     

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="username", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "name"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    registration_number = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "confirm_password", "registration_number"]

    def validate_username(self, value):
        value = str(value).strip().replace(" ", "_")
        return value

    def validate_registration_number(self, value):
        value = str(value).strip()
        if not value:
            raise serializers.ValidationError("Registration number is required.")
        if not value.isdigit() or len(value) != 8:
            raise serializers.ValidationError("Registration number must be exactly 8 digits.")
        if UserProfile.objects.filter(registration_number__iexact=value).exists():
            raise serializers.ValidationError("An account with this student registration number already exists.")
        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        email = data.get("email", "").strip()
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")  # 🔥 THIS IS CRITICAL
        reg_no = validated_data.pop("registration_number").strip()

        user = User.objects.create_user(
            username=validated_data.get("username"),
            email=validated_data.get("email"),
            password=validated_data.get("password"),
        )

        # Update profile created by signal with the unique registration number
        if hasattr(user, "profile"):
            profile = user.profile
            profile.registration_number = reg_no
            profile.save(update_fields=["registration_number"])

        return user
        
class TaskListSerializer(serializers.ModelSerializer):
    task_type = serializers.StringRelatedField()
    band = serializers.StringRelatedField()
    mode = serializers.StringRelatedField()
    state = serializers.CharField(source="get_state_display", read_only=True)
    giver = serializers.StringRelatedField()
    taker = serializers.StringRelatedField()
    bonus_tokens = serializers.IntegerField(read_only=True)
    giver_badge = serializers.SerializerMethodField()
    giver_streak = serializers.SerializerMethodField()
    taker_badge = serializers.SerializerMethodField()
    taker_streak = serializers.SerializerMethodField()

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
            "bonus_tokens",
            "state",
            "giver",
            "taker",
            "giver_badge",
            "giver_streak",
            "taker_badge",
            "taker_streak",
            "attachment",
            "preferences",
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
            "bonus_tokens",
            "state",
            "giver",
            "taker",
            "giver_badge",
            "giver_streak",
            "taker_badge",
            "taker_streak",
            "attachment",
            "preferences",
            "created_at",
        )

    def get_giver_badge(self, obj):
        if obj.giver and hasattr(obj.giver, "profile"):
            return obj.giver.profile.badge_type
        return None

    def get_giver_streak(self, obj):
        if obj.giver and hasattr(obj.giver, "profile"):
            return obj.giver.profile.speed_streak
        return 0

    def get_taker_badge(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
            return obj.taker.profile.badge_type
        return None

    def get_taker_streak(self, obj):
        if obj.taker and hasattr(obj.taker, "profile"):
            return obj.taker.profile.speed_streak
        return 0
        
        
        
        
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

        except Exception as e:
            if hasattr(e, "messages") and e.messages:
                raise serializers.ValidationError(e.messages[0])
            if e.__class__.__name__ == "PermissionDenied":
                raise PermissionDenied(str(e))
            raise serializers.ValidationError(str(e))

        return task 
    
class TaskSubmitSerializer(serializers.Serializer):
    submission_file = serializers.FileField(required=False)
    submission_note = serializers.CharField(required=False, allow_blank=True)

    def validate_submission_file(self, file):
        if file and hasattr(file, "size") and file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 5 MB. Please compress your file.")
        return file

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
    username = serializers.CharField(source="user.username", read_only=True)
    is_gold_patron = serializers.BooleanField(read_only=True)
    badge_type = serializers.CharField(read_only=True)
    total_tokens = serializers.IntegerField(source="user.token_account.total_tokens", read_only=True, default=1)
    available_tokens = serializers.IntegerField(source="user.token_account.available_tokens", read_only=True, default=1)
    total_volume = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "registration_number",
            "college_verified",
            "upi_id",
            "earnings_upi_id",
            "earnings_upi_verified",
            "refund_upi_id",
            "refund_upi_verified",
            "tasks_posted_count",
            "tasks_completed_count",
            "speed_streak",
            "fast_tasks_counter",
            "is_gold_patron",
            "badge_type",
            "total_tokens",
            "available_tokens",
            "total_volume",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "url",
            "is_read",
            "created_at",
        ]