from django.contrib import admin
from django.tasks import task
from django.utils import timezone
from .models import Task, TokenAccount, UserProfile, Payment, PaymentStatus, TaskState

# =====================================================
# PAYMENT ACTIONS
# =====================================================

@admin.action(description="Verify giver payment")
def verify_giver_payment(modeladmin, request, queryset):
    for task in queryset:

        payment = task.payment

        payment.status = Payment.Status.RELEASED
        payment.verified = True 
        payment.save(update_fields=["status", "verified"])

        task.state = TaskState.OPEN
        task.published_at = timezone.now()
        task.save(update_fields=["state", "published_at"])


@admin.action(description="Reject giver payment")
def reject_giver_payment(modeladmin, request, queryset):
    rejected = 0
    skipped = 0

    for task in queryset:
        payment = task.payment

        if payment.status != Payment.Status.PENDING_VERIFICATION:
            skipped += 1
            continue

        payment.status = Payment.Status.REJECTED
        payment.verified = False
        payment.save(update_fields=["status", "verified"])

        rejected += 1

    if rejected:
        modeladmin.message_user(
            request,
            f"{rejected} Payment(s) not verified. Please check your payment details and try again."
        )

    if skipped:
        modeladmin.message_user(
            request,
            f"{skipped} payment(s) skipped because they were not pending verification.",
            level="WARNING",
        )




@admin.action(description="Mark payment as completed")
def mark_payment_completed(modeladmin, request, queryset):
    for payment in queryset:
        payment.status = Payment.Status.PAID_OUT
        payment.verified = True
        payment.save(update_fields=["status", "verified"])

        payment.status = Payment.Status.PAID_OUT
        payment.verified = True
        payment.save(update_fields=["status", "verified"])
        
@admin.action(description="Mark refund sent to giver")
def mark_refund_completed(modeladmin, request, queryset):

    updated = 0

    for payment in queryset:

        profile = getattr(payment.payer, "profile", None)

        if not profile or not profile.refund_upi_id:
            continue

        if payment.status != Payment.Status.REFUND_PENDING:
            continue

        payment.status = Payment.Status.REFUNDED
        payment.verified = True
        payment.save(update_fields=["status", "verified"])

        updated += 1

    modeladmin.message_user(
        request,
        f"{updated} refund(s) completed."
    )
        
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    def payment_status(self, obj):
     return obj.payment.status if hasattr(obj, "payment") else "-"
    payment_status.short_description = "Payment Status"
    
    list_display = ("id", "title", "giver", "state", "created_at", "payment_status")
    list_filter = ("state", "band", "mode")
    search_fields = ("title",)
    exclude = ("taker",)
    actions = [
        verify_giver_payment,
        reject_giver_payment,
    ]
    

    help_texts = {
        "price": "Minimum: Short = 60, Medium = 120, Long = 250"
    }

    # ✅ FORCE model validation before saving
    def save_model(self, request, obj, form, change):
        obj.full_clean()   # runs clean()
        super().save_model(request, obj, form, change)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):

    def taker(self, obj):
        return obj.task.taker.username if obj.task.taker else "-"
    taker.short_description = "Taker"

    def taker_earnings_upi(self, obj):
     if obj.task.taker and hasattr(obj.task.taker, "profile"):
        return obj.task.taker.profile.earnings_upi_id or "-"
     return "-"
    taker_earnings_upi.short_description = "Earnings UPI"
    
    def giver_refund_upi(self, obj):
     if hasattr(obj.payer, "profile"):
        return obj.payer.profile.refund_upi_id or "-"
     return "-"
    giver_refund_upi.short_description = "Refund UPI"
    
    def refund_reason(self, obj):
        task = obj.task
        if task.state == TaskState.FAILED:
            return "Task failed / expired"

        if task.state == TaskState.CANCELLED:
            return "Task cancelled"

        return "-"

    refund_reason.short_description = "Refund Reason"
    
    def refund_to(self, obj):
     if hasattr(obj.payer, "profile"):
        return obj.payer.profile.refund_upi_id or "-"
     return "-"

    refund_to.short_description = "Refund To"

    def task_payment_status(self, obj):
        return obj.status
    task_payment_status.short_description = "Task Payment"

    list_display = (
        "id",
        "task",
        "payer",
        "taker",
        "refund_reason",
        "taker_earnings_upi",
        "refund_to",
        "amount",
        "status",
        "verified",
        "created_at",
        "task_payment_status",
    )

    list_filter = (
        "status",
        "verified",
    )

    search_fields = (
        "payer__username",
        "task__title",
        "task__taker__username",
        "task__taker__profile__earnings_upi_id",
    )

    actions = [
        mark_payment_completed,
        mark_refund_completed,
    ]
    

admin.site.register(TokenAccount)
    

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "upi_id",
        "upi_verified",
        "phone_verified",
        "college_verified",
    )

    search_fields = (
        "user__username",
        "upi_id",
    )




