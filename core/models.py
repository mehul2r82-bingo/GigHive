from django.db import models, transaction
from django.conf import settings
from django.core.exceptions import ValidationError
from django.tasks import task
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied 
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

 
# --------------------------------------------------
# Verification
# --------------------------------------------------

class VerificationState(models.TextChoices):
    UNVERIFIED = "UNVERIFIED", _("Unverified")
    DECLARED = "DECLARED", _("Declared")
    VERIFIED = "VERIFIED", _("Verified")
    RESTRICTED = "RESTRICTED", _("Restricted")


class UserVerification(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification",
        primary_key=True
    )

    state = models.CharField(
        max_length=20,
        choices=VerificationState.choices,
        default=VerificationState.UNVERIFIED,
        db_index=True
    )
    
    upi_id = models.CharField(
    max_length=100,
    blank=True,
    default=""
)
    

    verified_at = models.DateTimeField(blank=True, null=True)

    restricted_reason = models.TextField(blank=True, null=True)
    restricted_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} [{self.state}]"


# --------------------------------------------------
# Token Account
# --------------------------------------------------

class TokenAccount(models.Model):
    """
    Core invariant:
    - locked_tokens <= total_tokens
    - available_tokens = total_tokens - locked_tokens
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="token_account",
    )

    total_tokens = models.PositiveSmallIntegerField(default=5)
    locked_tokens = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ===============================
    # Derived properties
    # ===============================
    @property
    def available_tokens(self):
        return self.total_tokens - self.locked_tokens

    # ===============================
    # Invariant enforcement
    # ===============================
    def assert_invariants(self):
        if self.total_tokens < 0:
            raise ValueError("Invariant violation: total_tokens < 0")

        if self.locked_tokens < 0:
            raise ValueError("Invariant violation: locked_tokens < 0")

        if self.locked_tokens > self.total_tokens:
            raise ValueError("Invariant violation: locked_tokens > total_tokens")

    



    created_at = models.DateTimeField(auto_now_add=True)
    # ===============================
    # Escrow operations
    # ===============================
    def lock(self, n=1):
        if n <= 0:
            raise ValueError("Lock amount must be positive")

        if self.available_tokens < n:
            raise ValueError("Insufficient available tokens")

        self.locked_tokens += n
        self.assert_invariants()
        self.save(update_fields=["locked_tokens"])

    def unlock(self, n=1):
        if n <= 0:
            raise ValueError("Unlock amount must be positive")

        if self.locked_tokens < n:
            raise ValueError("Insufficient locked tokens to unlock")

        self.locked_tokens -= n
        self.assert_invariants()
        self.save(update_fields=["locked_tokens"])

    def burn_locked(self, n=1):
        if n <= 0:
            raise ValueError("Burn amount must be positive")

        if self.locked_tokens < n:
            raise ValueError("Insufficient locked tokens to burn")

        self.locked_tokens -= n
        self.total_tokens -= n
        self.assert_invariants()
        self.save(update_fields=["locked_tokens", "total_tokens"])

    # ===============================
    # Balance operations (optional but useful)
    # ===============================
    def credit(self, n=1):
        if n <= 0:
            raise ValueError("Credit amount must be positive")

        self.total_tokens += n
        self.assert_invariants()

    def debit(self, n=1):
        if n <= 0:
            raise ValueError("Debit amount must be positive")

        if self.available_tokens < n:
            raise ValueError("Insufficient available tokens to debit")

        self.total_tokens -= n
        self.assert_invariants()


class UserProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    phone_number = models.CharField(max_length=20, blank=True, default="")
    phone_verified = models.BooleanField(default=False)

    upi_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    upi_verified = models.BooleanField(default=False)

    reputation_score = models.IntegerField(default=0)

    college_verified = models.BooleanField(default=False)

    college_email = models.EmailField(
        blank=True,
        null=True
    )

    student_id_image = models.ImageField(
        upload_to="college_ids/",
        blank=True,
        null=True
    )
    
    earnings_upi_id = models.CharField(
    max_length=100,
    blank=True,
    default=""
)

    earnings_upi_verified = models.BooleanField(
        default=False
    )

    refund_upi_id = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    refund_upi_verified = models.BooleanField(
        default=False
    )

# ===============================
# Task Events (audit log)
# ===============================
class TaskEvent(models.Model):
    task = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    event = models.CharField(max_length=32)
    from_state = models.CharField(max_length=32)
    to_state = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event} ({self.from_state} → {self.to_state})"
    
# ===============================
# Task System
# ===============================
class TaskType(models.Model):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=64)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class TaskState(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    PAYMENT_PENDING = "payment_pending", _("Payment Pending")
    OPEN = "OPEN", _("Open")
    ACCEPTED = "ACCEPTED", _("Accepted")
    SUBMITTED = "SUBMITTED", _("Submitted")
    COMPLETED = "COMPLETED", _("Completed")
    FAILED = "FAILED", _("Failed")
    CANCELLED = "CANCELLED", _("Cancelled")
    

TERMINAL_STATES = {
    TaskState.COMPLETED,
    TaskState.FAILED,
    TaskState.CANCELLED,
}
class TaskMode(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "Offline"
    HYBRID = "hybrid", "Hybrid"


class TaskBand(models.TextChoices):
    SHORT = "short", "Short"
    MEDIUM = "medium", "Medium"
    LONG = "long", "Long"


class PaymentStatus(models.TextChoices):
    PROCESSING = "PROCESSING", "Processing"
    COMPLETED = "COMPLETED", "Completed"
    REFUND_PENDING = "refund_pending", "Refund Pending"

class Task(models.Model):
    """
    Invariant-safe escrow task model.

    Rules encoded:
    - Giver + Taker both lock 1 token on accept
    - Failure burns taker's locked token
    - Giver cancellation burns giver's locked token
    - Taker cancellation burns taker's locked token
    - Bonus tokens are optional, paid by giver
    """
    class Meta:
     indexes = [
        models.Index(fields=["state"]),
        models.Index(fields=["giver"]),
        models.Index(fields=["taker"]),
        models.Index(fields=["deadline"]),
        models.Index(fields=["created_at"]),
        models.Index(fields=["state", "deadline"]),
    ]
        # ---------- Pricing Rules ----------

    MIN_PRICE_BY_BAND = {
        "short": 60,
        "medium": 120,
        "long": 250,
    }

    def clean(self):
        minimum = self.MIN_PRICE_BY_BAND.get(self.band)

        if minimum and self.price < minimum:
            raise ValidationError({
                "price": f"Minimum price for {self.band} tasks is {minimum}."
            })
    def save(self, *args, **kwargs):
     self.full_clean()
     super().save(*args, **kwargs)

       # ---------- State Guards ----------

    def _ensure_accepted(self):
        if self.state != TaskState.ACCEPTED:
            raise ValidationError("Action allowed only when task is ACCEPTED")

        if not self.taker_id:
            raise ValidationError("Accepted task must have a taker")

    # ---------- Authority Guards ----------

    def _ensure_actor(self, actor):
        if actor is None:
            raise ValidationError("Actor is required for this action")
    
    def _ensure_state(self, *allowed_states):
        """
        Ensure the task is in one of the allowed states.
        """
        if self.state not in allowed_states:
            allowed = ", ".join(str(s) for s in allowed_states)
            raise ValidationError(
                f"Invalid task state: {self.state}. Allowed: {allowed}"
            )
    def _ensure_has_token_account(self, actor):
        self._ensure_actor(actor)
        if not hasattr(actor, "token_account"):
            raise ValidationError("User must complete verification to use tasks")
    
    def _log_event(self, actor, event, from_state=None, to_state=None):
     """
    Temporary event logger.
    Later we will store this in a TaskEvent table.
    """
     print(f"[TASK EVENT] task={self.pk} actor={actor} {from_state} -> {to_state} ({event})")

    def _ensure_giver(self, actor):
        self._ensure_actor(actor)
        if actor.pk != self.giver_id:
            raise PermissionDenied("Only task giver can perform this action")

    def _ensure_taker(self, actor):
        self._ensure_actor(actor)
        if actor.pk != self.taker_id:
            raise PermissionDenied("Only assigned taker can perform this action")

    # ===============================
    # Core relations
    # ===============================
    giver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="given_tasks",
    )

    taker = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="taken_tasks",
    )
     # ---- Assignment / discovery ----
    title = models.CharField(max_length=200)

    task_type = models.ForeignKey(
        TaskType,
        on_delete=models.PROTECT,
        related_name="tasks",
    )

    band = models.CharField(
        max_length=16,
        choices=TaskBand.choices,
    )

    mode = models.CharField(
        max_length=16,
        choices=TaskMode.choices,
    )

    deadline = models.DateTimeField()

    price = models.PositiveIntegerField(
        help_text="Single committed price set by giver"
    )

    details = models.TextField(
        help_text="What needs to be done (clear description)"
    )

    
    preferences = models.TextField(
        blank=True,
        help_text="Optional constraints / style / preferences",
    )
     # ---- Offline / hybrid only ----
    location_hint = models.CharField(
        max_length=128,
        blank=True,
    )

    availability_window = models.CharField(
        max_length=128,
        blank=True,
    )
    bonus_tokens = models.PositiveIntegerField(
    default=0,
    help_text="Optional bonus tokens offered by giver",
)

    state = models.CharField(
    max_length=20,
    choices=TaskState.choices,
    default=TaskState.PAYMENT_PENDING

)
    revision_count = models.PositiveSmallIntegerField(default=0)

    revision_note = models.TextField(
        blank=True,
        default=""
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True
    )
    
    
    
    submission_file = models.FileField(
    upload_to="submissions/",
    blank=True,
    null=True,
)

    submission_note = models.TextField(
        blank=True,
        default=""
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True
    )


    # ===============================
    # Timestamps
    # ===============================
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)

    # ===============================
    # Guards
    # ===============================
    
    
    def clean(self):
        # Giver and taker cannot be same
        if self.taker and self.taker == self.giver:
            raise ValidationError("Giver and taker cannot be the same")
        if self.state in [TaskState.DRAFT, TaskState.OPEN] and self.taker:
         raise ValidationError("Taker cannot be assigned before acceptance")

        # Immutability after publish
        if self.pk and self.published_at:
            original = Task.objects.get(pk=self.pk)

            IMMUTABLE_FIELDS = [
                "title",
                "task_type",
                "mode",
                "band",
                "price",
                "details",
                "preferences",
                "deadline",
            ]

            for field in IMMUTABLE_FIELDS:
                if getattr(self, field) != getattr(original, field):
                    raise ValidationError(
                        {field: f"{field} cannot be changed after publish"}
                    )


    # ===============================
# Domain transitions
# ===============================

    @transaction.atomic
    def publish(self, giver):
        task = Task.objects.select_for_update().get(pk=self.pk)

        if task.state != TaskState.DRAFT:
            raise ValidationError("Only draft tasks can be published")

        if giver != task.giver:
            raise PermissionDenied("Only giver can publish")

        REQUIRED_FIELDS = [
            "task_type",
            "band",
            "mode",
            "deadline",
            "price",
            "details",
        ]

        for field in REQUIRED_FIELDS:
            value = getattr(task, field)
            if value in (None, "", []):
                raise ValidationError(f"{field} is required before publishing")

        # enforce minimum price by band
        minimum = Task.MIN_PRICE_BY_BAND.get(task.band)

        if minimum and task.price < minimum:
            raise ValidationError(
                f"Minimum price for {task.band} tasks is {minimum}."
            )

        # move to OPEN state
        task.state = TaskState.OPEN
        task.published_at = timezone.now()
        task.save(update_fields=["state", "published_at", "updated_at"])

        # optional event log
        task._log_event(
            actor=giver,
            event="PUBLISH",
            from_state=TaskState.DRAFT,
            to_state=TaskState.OPEN,
        )

        return task

    
    @transaction.atomic
    def accept(self, actor):
        task = Task.objects.select_for_update().get(pk=self.pk)

        task._ensure_state(TaskState.OPEN)

        # Step 7 — require payout address
        if not actor.profile.earnings_upi_id:
         raise ValidationError("Add your Earnings UPI to receive payments")

        if actor == task.giver:
            raise ValidationError("Giver cannot accept own task")

        self._ensure_has_token_account(actor)      # taker
        self._ensure_has_token_account(self.giver) # giver

        if task.taker is not None:
            raise ValidationError("Task already accepted")

        giver_token = task.giver.token_account
        taker_token = actor.token_account

        giver_token.lock(1)
        taker_token.lock(1)

        giver_token.save()
        taker_token.save()

        task.taker = actor
        task.state = TaskState.ACCEPTED
        task.save(update_fields=["taker", "state", "updated_at"])

        self._log_event(
            actor=actor,
            event="ACCEPT",
            from_state=TaskState.OPEN,
            to_state=TaskState.ACCEPTED,
        )


    @transaction.atomic
    def submit(self, actor):

        self._ensure_state(TaskState.ACCEPTED)

        if actor != self.taker:
            raise PermissionDenied("Only taker can submit")

        self.state = TaskState.SUBMITTED
        self.submitted_at = timezone.now()

        # Clear previous revision request after resubmission
        self.revision_note = ""

        self.save(
            update_fields=[
                "state",
                "submitted_at",
                "revision_note",
                "updated_at",
            ]
        )

        self._log_event(
            actor=actor,
            event="SUBMIT",
            from_state=TaskState.ACCEPTED,
            to_state=TaskState.SUBMITTED,
        )

        return self


    @transaction.atomic
    def complete(self, actor):

        task = Task.objects.select_for_update().get(pk=self.pk)

        if task.state != TaskState.SUBMITTED:
            raise ValidationError("Only submitted tasks can be completed")

        if actor != task.giver:
            raise PermissionDenied("Only giver can complete task")

        giver_token = task.giver.token_account
        taker_token = task.taker.token_account

        giver_token.unlock(1)
        taker_token.unlock(1)

        giver_token.save()
        taker_token.save()

        old_state = task.state
        task.state = TaskState.COMPLETED

        task.payment.status = Payment.Status.PENDING_VERIFICATION
        task.payment.save(update_fields=["status"])
        task.save(
    update_fields=[
        "state",
        "updated_at",
    ]
)
 

        task._log_event(
        actor=actor,
        event="COMPLETE",
        from_state=old_state,
        to_state=TaskState.COMPLETED,
    )

        # Telegram admin notification
        from .telegram import send_telegram_message

        transaction.on_commit(
            lambda: send_telegram_message(
                f"💰 GigHive — Payout Required\n\n"
                f"Task ID: #{task.id}\n"
                f"Task: {task.title}\n"
                f"Giver: {task.giver.username}\n"
                f"Taker: {task.taker.username}\n"
                f"Amount: ₹{task.payment.amount}\n\n"
                f"Action: Complete payout in Django Admin."
            )
        )
        
        return task

    

    @transaction.atomic
    def cancel(self, actor):
        task = Task.objects.select_for_update().get(pk=self.pk)
        prev_state = task.state

        if actor is None:
            raise ValidationError("Actor required")

        # Only OPEN or ACCEPTED tasks can be cancelled
        if task.state not in [TaskState.OPEN, TaskState.ACCEPTED]:
            raise ValidationError("Task cannot be cancelled in this state")

        # -------------------------
        # BEFORE ACCEPTANCE
        # -------------------------
        if task.state == TaskState.OPEN:
            if actor != task.giver:
                raise PermissionDenied(
                    "Only giver can cancel before acceptance"
                )

            task.state = TaskState.CANCELLED
            event = "cancelled_before_accept"

        # -------------------------
        # AFTER ACCEPTANCE
        # -------------------------
        else:
            if not task.taker:
                raise ValidationError("Accepted task missing taker")

            giver_token = task.giver.token_account
            taker_token = task.taker.token_account

            if actor == task.taker:
                # Taker cancels:
                # taker loses token, giver gets token back
                taker_token.burn_locked(1)
                giver_token.unlock(1)
                event = "taker_cancelled"

            elif actor == task.giver:
                # Giver cancels:
                # giver loses token, taker gets token back
                giver_token.burn_locked(1)
                taker_token.unlock(1)
                event = "giver_cancelled"

            else:
                raise PermissionDenied(
                    "Only giver or taker can cancel"
                )

            giver_token.save()
            taker_token.save()

            task.state = TaskState.CANCELLED

        # Save task state
        task.save(update_fields=["state", "updated_at"])

        # Payment refund belongs to the giver
        if hasattr(task, "payment"):
            task.payment.status = Payment.Status.REFUND_PENDING
            task.payment.save(update_fields=["status"])

        
            self._log_event(
        actor=actor,
        event=event,
        from_state=prev_state,
        to_state=TaskState.CANCELLED,
    )

    # Telegram admin notification
        from .telegram import send_telegram_message

        cancelled_by = (
            f"Giver ({task.giver.username})"
            if event in ["giver_cancelled", "cancelled_before_accept"]
            else f"Taker ({task.taker.username})"
        )

        transaction.on_commit(
            lambda: send_telegram_message(
                f"🔄 GigHive — Refund Required\n\n"
                f"Task ID: #{task.id}\n"
                f"Task: {task.title}\n"
                f"Cancelled by: {cancelled_by}\n"
                f"Giver: {task.giver.username}\n"
                f"Amount: ₹{task.payment.amount}\n\n"
                f"Action: Refund giver in Django Admin."
            )
        )

        return task
        




@transaction.atomic
def fail(self, actor=None):
    task = Task.objects.select_for_update().get(pk=self.pk)

    # Deadline failure is only valid while the task is still active.
    if task.state not in [TaskState.ACCEPTED, TaskState.SUBMITTED]:
        raise ValidationError(
            "Only accepted or submitted tasks can be failed."
        )

    if not task.taker:
        raise ValidationError("Task has no taker.")

    giver_token = task.giver.token_account
    taker_token = task.taker.token_account

    # Both commitment tokens should still be locked.
    if giver_token.locked_tokens < 1 or taker_token.locked_tokens < 1:
        raise ValidationError("Token invariant breach")

    # Taker failed to complete the task.
    taker_token.burn_locked(1)

    # Giver gets their commitment token back.
    giver_token.unlock(1)

    taker_token.save()
    giver_token.save()

    prev_state = task.state

    task.state = TaskState.FAILED
    task.save(update_fields=["state", "updated_at"])

    # The giver's original payment is now awaiting refund.
    if hasattr(task, "payment"):
        task.payment.mark_refund_pending()

    self._log_event(
        actor=actor,
        event="FAIL",
        from_state=prev_state,
        to_state=TaskState.FAILED,
    )

    return task


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        LOCKED = "locked", "Locked"
        PENDING_VERIFICATION = "pending_verification", "Pending Verification"

        RELEASED = "released", "Released"
        PAID_OUT = "paid_out", "Paid Out"

        REFUND_PENDING = "refund_pending", "Refund Pending"
        REFUNDED = "refunded", "Refunded"

        REJECTED = "rejected", "Rejected"

    task = models.OneToOneField(
        "Task",
        on_delete=models.CASCADE,
        related_name="payment",
    )

    payer = models.ForeignKey(User, on_delete=models.CASCADE)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    utr = models.CharField(max_length=100, blank=True, null=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )

    verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def mark_refund_pending(self):
        self.status = self.Status.REFUND_PENDING
        self.save(update_fields=["status"])


    def _log_event(self, *, actor, event, from_state, to_state):
      TaskEvent.objects.create(
        task=self,
        actor=actor,
        event=event,
        from_state=from_state,
        to_state=to_state,
        giver_total_tokens=self.giver.token_account.total_tokens,
        giver_locked_tokens=self.giver.token_account.locked_tokens,
        taker_total_tokens=self.taker.token_account.total_tokens if self.taker else None,
        taker_locked_tokens=self.taker.token_account.locked_tokens if self.taker else None,
    )
  

@receiver(post_save, sender=User)
def create_user_profile_and_token_account(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        TokenAccount.objects.create(
            user=instance,
            total_tokens=5,
            locked_tokens=0,
        )
   
     




