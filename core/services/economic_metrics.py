from dataclasses import dataclass
from decimal import Decimal
from django.db.models import Sum, Count, Q, F
from django.db.models.functions import Coalesce
from django.utils import timezone

import importlib
_task_models = importlib.import_module("tasks.models")
TokenAccount = getattr(_task_models, "TokenAccount")
Task = getattr(_task_models, "Task")
TaskState = getattr(_task_models, "TaskState")


@dataclass(frozen=True)
class EconomySnapshot:
    timestamp: timezone.datetime

    total_tokens_in_system: Decimal
    total_available_tokens: Decimal
    total_locked_tokens: Decimal

    total_users: int
    users_with_zero_available: int
    users_with_zero_total: int

    active_tasks: int
    completed_tasks: int
    failed_tasks: int
    cancelled_tasks: int

    @property
    def zero_available_percentage(self) -> Decimal:
        if self.total_users == 0:
            return Decimal("0")
        return (Decimal(self.users_with_zero_available) / Decimal(self.total_users)) * 100

    @property
    def lock_ratio(self) -> Decimal:
        if self.total_tokens_in_system == 0:
            return Decimal("0")
        return (self.total_locked_tokens / self.total_tokens_in_system) * 100

    @property
    def completion_rate(self) -> Decimal:
        finished = self.completed_tasks + self.failed_tasks + self.cancelled_tasks
        if finished == 0:
            return Decimal("0")
        return (Decimal(self.completed_tasks) / Decimal(finished)) * 100


class EconomicMetricsService:
    """
    Read-only economic metrics service.
    NEVER mutates state.
    """

    def get_snapshot(self) -> EconomySnapshot:
        token_agg = TokenAccount.objects.aggregate(
            total_tokens=Coalesce(Sum(F("total_tokens")), Decimal("0")),
            total_locked=Coalesce(Sum(F("locked_tokens")), Decimal("0")),
            total_users=Count("id"),
            zero_available=Count(
                "id",
                filter=Q(total_tokens=F("locked_tokens"))
            ),
            zero_total=Count(
                "id",
                filter=Q(total_tokens=0)
            ),
        )

        total_available = token_agg["total_tokens"] - token_agg["total_locked"]

        task_agg = Task.objects.aggregate(
            active=Count(
                "id",
                filter=Q(
                    state__in=[
                        TaskState.OPEN,
                        TaskState.ACCEPTED,
                        TaskState.SUBMITTED,
                    ]
                ),
            ),
            completed=Count("id", filter=Q(state=TaskState.COMPLETED)),
            failed=Count("id", filter=Q(state=TaskState.FAILED)),
            cancelled=Count("id", filter=Q(state=TaskState.CANCELLED)),
        )

        return EconomySnapshot(
            timestamp=timezone.now(),

            total_tokens_in_system=token_agg["total_tokens"],
            total_available_tokens=total_available,
            total_locked_tokens=token_agg["total_locked"],

            total_users=token_agg["total_users"],
            users_with_zero_available=token_agg["zero_available"],
            users_with_zero_total=token_agg["zero_total"],

            active_tasks=task_agg["active"],
            completed_tasks=task_agg["completed"],
            failed_tasks=task_agg["failed"],
            cancelled_tasks=task_agg["cancelled"],
        )
