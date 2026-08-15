def log_task_event(task, actor, event, from_state, to_state):
    print(
        f"[TASK EVENT] Task={task.id} | {event} | {from_state} -> {to_state}"
    )