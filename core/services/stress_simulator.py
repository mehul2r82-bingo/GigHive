import random
from dataclasses import dataclass
from typing import List

from django.contrib.auth import get_user_model
from django.db import transaction

from core.models import Task, TaskState


# ==============================
# Simulation config + result
# ==============================

@dataclass
class SimulationConfig:
    num_users: int = 10
    num_ticks: int = 50


@dataclass
class SimulationResult:
    violations: List[str]

    @property
    def is_healthy(self) -> bool:
        return len(self.violations) == 0


# ==============================
# Stress Simulator (MINIMAL)
# ==============================

class StressSimulator:
    """
    Minimal invariant stress simulator.

    Purpose:
    - Randomly exercise task lifecycle
    - Detect invariant violations
    - NOT predict economics
    """

    def __init__(self, config: SimulationConfig):
        self.config = config
        self.violations: List[str] = []
        self.users = []

    # ---------- public API ----------

    def run(self, cleanup: bool = True) -> SimulationResult:
        try:
            self._setup()
            for _ in range(self.config.num_ticks):
                self._tick()
            return SimulationResult(self.violations)
        finally:
            if cleanup:
                self._teardown()

    # ---------- setup / teardown ----------

    def _setup(self):
        User = get_user_model()

        for i in range(self.config.num_users):
            user = User.objects.create_user(
                username=f"sim_user_{i}",
                password="test123"
            )
            # TokenAccount is auto-created by signal
            self.users.append(user)

    def _teardown(self):
        Task.objects.filter(giver__username__startswith="sim_user_").delete()
        get_user_model().objects.filter(username__startswith="sim_user_").delete()

    # ---------- tick ----------

    def _tick(self):
        action = random.choice([
            self._create_task,
            self._accept_task,
            self._complete_task,
            self._fail_task,
            self._cancel_task,
        ])

        try:
            action()
        except Exception as e:
            # DO NOT crash — log and continue
            self.violations.append(str(e))

    # ---------- actions ----------

    def _create_task(self):
        giver = random.choice(self.users)

        Task.objects.create(
            title="Sim Task",
            description="stress test",
            giver=giver,
        )

    def _accept_task(self):
        task = Task.objects.filter(state=TaskState.OPEN).first()
        if not task:
            return

        taker = random.choice(self.users)
        if taker == task.giver:
            return

        task.accept(taker)

    def _complete_task(self):
        task = Task.objects.filter(state=TaskState.ACCEPTED).first()
        if not task:
            return

        task.complete()

    def _fail_task(self):
        task = Task.objects.filter(state=TaskState.ACCEPTED).first()
        if not task:
            return

        task.fail()

    def _cancel_task(self):
        # randomly cancel by giver or taker
        task = Task.objects.exclude(state__in=[
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.CANCELLED,
        ]).first()

        if not task:
            return

        if task.state == TaskState.OPEN:
            task.cancel_by_giver()
        elif task.state == TaskState.ACCEPTED:
            random.choice([
                task.cancel_by_giver,
                task.cancel_by_taker,
            ])()


