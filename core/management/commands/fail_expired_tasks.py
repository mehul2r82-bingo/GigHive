from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Task, TaskState
from core.telegram import send_telegram_message


class Command(BaseCommand):
    help = "Fail accepted tasks whose deadlines have expired."

    def handle(self, *args, **options):
        now = timezone.now()

        expired_tasks = (
            Task.objects
            .filter(
                state=TaskState.ACCEPTED,
                deadline__lt=now,
            )
            .select_related(
                "giver",
                "taker",
                "payment",
            )
        )

        count = 0

        for task in expired_tasks:
            try:
                task.fail()

                amount = getattr(task.payment, "amount", "N/A")

                send_telegram_message(
                    f"⏰ GigHive — Deadline Failed\n\n"
                    f"Task ID: #{task.id}\n"
                    f"Task: {task.title}\n"
                    f"Taker: {task.taker.username}\n"
                    f"Amount: ₹{amount}\n\n"
                    f"Task deadline has expired.\n"
                    f"Payment is now REFUND_PENDING.\n\n"
                    f"Action required: Process refund in Django Admin."
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Task #{task.id} failed due to expired deadline."
                    )
                )

                count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Task #{task.id} could not be failed: {e}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished. {count} expired task(s) processed."
            )
        )