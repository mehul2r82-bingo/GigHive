import os
import requests
from django.contrib.auth.models import User
from core.models import Notification

ONESIGNAL_APP_ID = os.environ.get("ONESIGNAL_APP_ID", "79c845e7-3e31-4639-ab96-3b0abf909c78")
ONESIGNAL_REST_API_KEY = os.environ.get("ONESIGNAL_REST_API_KEY", "")

def send_user_notification(user, title, message, url=None):
    """
    1. Saves in-app Notification model record for the user.
    2. Sends targeted web push notification via OneSignal.
    """
    if not user:
        return None

    # 1. In-app database record
    notification = None
    try:
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            url=url or "",
            is_read=False
        )
    except Exception as e:
        print(f"[NOTIFICATION DB ERROR] {e}")

    # 2. OneSignal Push Notification
    try:
        headers = {
            "Authorization": f"Key {ONESIGNAL_REST_API_KEY}",
            "Content-Type": "application/json; charset=utf-8",
        }
        payload = {
            "app_id": ONESIGNAL_APP_ID,
            "include_aliases": {
                "external_id": [user.username]
            },
            "target_channel": "push",
            "headings": {"en": title},
            "contents": {"en": message},
        }
        if url:
            payload["url"] = url

        requests.post("https://api.onesignal.com/notifications", json=payload, headers=headers, timeout=4)
    except Exception as e:
        print(f"[ONESIGNAL PUSH ERROR] {e}")

    return notification


def broadcast_push_notification(title, message, url=None):
    """
    Broadcasts a push notification to all subscribed users on campus via OneSignal.
    """
    try:
        headers = {
            "Authorization": f"Key {ONESIGNAL_REST_API_KEY}",
            "Content-Type": "application/json; charset=utf-8",
        }
        payload = {
            "app_id": ONESIGNAL_APP_ID,
            "included_segments": ["Subscribed Users"],
            "headings": {"en": title},
            "contents": {"en": message},
        }
        if url:
            payload["url"] = url

        requests.post("https://api.onesignal.com/notifications", json=payload, headers=headers, timeout=4)
    except Exception as e:
        print(f"[ONESIGNAL BROADCAST ERROR] {e}")
