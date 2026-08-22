import os
import requests


def send_telegram_message(message):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not bot_token or not chat_id:
        print("Telegram credentials not configured.")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    response = requests.post(
        url,
        data={
            "chat_id": chat_id,
            "text": message,
        },
        timeout=10,
    )

    if response.ok:
        print("[TELEGRAM] Message sent successfully.")
        return True

    print("[TELEGRAM] Failed:", response.text)
    return False