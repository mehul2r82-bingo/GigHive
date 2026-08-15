from django.core.management.base import BaseCommand
from core.services.deadline_processor import process_expired_tasks
from core.services.deadline_processor import auto_complete_submitted_tasks


class Command(BaseCommand):
    help = "Fail expired accepted tasks"

    def handle(self, *args, **kwargs):
        process_expired_tasks()
        auto_complete_submitted_tasks()
        self.stdout.write("Expired and submitted tasks processed")