from django.core.management.base import BaseCommand
from core.services.deadline_processor import check_and_expire_deadlines


class Command(BaseCommand):
    help = "Expire unaccepted tasks and fail accepted tasks whose deadlines have expired."

    def handle(self, *args, **options):
        self.stdout.write("Checking and processing overdue task deadlines...")
        count = check_and_expire_deadlines()
        self.stdout.write(
            self.style.SUCCESS(
                f"Finished. {count} expired task(s) processed and notified."
            )
        )