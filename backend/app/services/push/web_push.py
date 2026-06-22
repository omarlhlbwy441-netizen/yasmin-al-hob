"""
🌐 Web Push Notifications Service
"""
import os
import json
from typing import Dict, List
from dataclasses import dataclass
from pywebpush import webpush, WebPushException


@dataclass
class WebPushSubscription:
    endpoint: str
    p256dh: str
    auth: str
    user_id: str


class WebPushService:
    """Web Push notification service using VAPID."""

    def __init__(self):
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
        self.vapid_claims = {
            "sub": f"mailto:{os.getenv('VAPID_EMAIL', 'admin@yasmin.ai')}"
        }
        self.subscriptions: Dict[str, WebPushSubscription] = {}

    def subscribe(self, user_id: str, subscription_info: Dict):
        """Subscribe a user to web push."""
        self.subscriptions[user_id] = WebPushSubscription(
            endpoint=subscription_info["endpoint"],
            p256dh=subscription_info["keys"]["p256dh"],
            auth=subscription_info["keys"]["auth"],
            user_id=user_id
        )

    def unsubscribe(self, user_id: str):
        """Unsubscribe a user."""
        if user_id in self.subscriptions:
            del self.subscriptions[user_id]

    async def send(self, user_id: str, title: str, body: str, icon: str = None, data: Dict = None):
        """Send web push notification."""
        if user_id not in self.subscriptions:
            return False

        sub = self.subscriptions[user_id]

        payload = {
            "notification": {
                "title": title,
                "body": body,
                "icon": icon or "/icon.png",
                "data": data or {}
            }
        }

        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims
            )
            return True
        except WebPushException as e:
            print(f"Web push error: {e}")
            return False


web_push = WebPushService()
