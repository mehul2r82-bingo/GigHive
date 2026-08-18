from django.db import migrations


def create_task_types(apps, schema_editor):
    TaskType = apps.get_model("core", "TaskType")

    task_types = [
        ("assignment", "Assignment", "Academic assignments and coursework"),
        ("presentation", "Presentation / PPT", "Presentations and PowerPoint work"),
        ("coding", "Coding", "Programming and development tasks"),
        ("video-editing", "Video Editing", "Video editing and related work"),
        ("design", "Canva / Design", "Graphic design and Canva work"),
        ("campus-work", "Club / Campus Work", "Campus, club and event tasks"),
        ("legacy", "Legacy Task", "General legacy task category"),
        ("research", "Research", "Research and information-gathering tasks"),
    ]

    for code, name, description in task_types:
        TaskType.objects.get_or_create(
            code=code,
            defaults={
                "name": name,
                "description": description,
                "is_active": True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_alter_userprofile_phone_number"),
    ]

    operations = [
        migrations.RunPython(create_task_types, migrations.RunPython.noop),
    ]