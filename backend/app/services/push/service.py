"""
🔔 Yasmin Push Notifications Service
Firebase Cloud Messaging (FCM v1) + OneSignal integration
"""
import os
import json
import asyncio
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
import aiohttp
from enum import Enum


class NotificationPriority(Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class NotificationChannel(Enum):
    FCM = "fcm"
    ONESIGNAL = "onesignal"
    WEB_PUSH = "web_push"


@dataclass
class PushNotification:
    title: str
    body: str
    tokens: List[str] = field(default_factory=list)
    topic: Optional[str] = None
    data: Dict = field(default_factory=dict)
    image_url: Optional[str] = None
    icon: Optional[str] = None
    sound: str = "default"
    badge: int = 1
    priority: str = NotificationPriority.HIGH.value
    channel_id: str = "default"
    click_action: Optional[str] = None
    ttl: int = 3600  # Time to live in seconds

    def to_fcm_payload(self) -> Dict:
        """Convert to FCM v1 API payload."""
        message = {
            "notification": {
                "title": self.title,
                "body": self.body,
            },
            "data": {k: str(v) for k, v in self.data.items()},
            "android": {
                "priority": self.priority,
                "notification": {
                    "channel_id": self.channel_id,
                    "sound": self.sound,
                }
            },
            "apns": {
                "payload": {
                    "aps": {
                        "sound": self.sound,
                        "badge": self.badge,
                    }
                }
            },
            "webpush": {
                "notification": {
                    "icon": self.icon,
                    "badge": self.badge,
                }
            }
        }

        if self.image_url:
            message["notification"]["image"] = self.image_url
        if self.click_action:
            message["data"]["click_action"] = self.click_action

        # Target
        if self.tokens:
            if len(self.tokens) == 1:
                message["token"] = self.tokens[0]
            else:
                message["tokens"] = self.tokens
        elif self.topic:
            message["topic"] = self.topic

        return {"message": message}

    def to_onesignal_payload(self) -> Dict:
        """Convert to OneSignal payload."""
        return {
            "app_id": os.getenv("ONESIGNAL_APP_ID"),
            "include_player_ids": self.tokens,
            "headings": {"en": self.title},
            "contents": {"en": self.body},
            "data": self.data,
            "priority": 10 if self.priority == "high" else 5,
            "ttl": self.ttl,
        }


@dataclass
class NotificationResult:
    success: bool
    message_id: Optional[str] = None
    provider: str = ""
    failed_tokens: List[str] = field(default_factory=list)
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


class PushNotificationService:
    """Push notification service with FCM v1 and OneSignal."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_service()
        return cls._instance

    def _init_service(self):
        self.fcm_project_id = os.getenv("FCM_PROJECT_ID")
        self.fcm_service_account = os.getenv("FCM_SERVICE_ACCOUNT_JSON")
        self.fcm_access_token = None
        self.fcm_token_expiry = None

        self.onesignal_app_id = os.getenv("ONESIGNAL_APP_ID")
        self.onesignal_api_key = os.getenv("ONESIGNAL_API_KEY")

        self.vapid_public_key = os.getenv("VAPID_PUBLIC_KEY")
        self.vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")

        self.device_tokens: Dict[str, Dict] = {}  # user_id -> {token, platform, updated_at}

    async def _get_fcm_access_token(self) -> str:
        """Get or refresh FCM access token."""
        import time

        if self.fcm_access_token and self.fcm_token_expiry and time.time() < self.fcm_token_expiry - 300:
            return self.fcm_access_token

        # Generate new token using service account
        import google.auth.transport.requests
        from google.oauth2 import service_account

        credentials = service_account.Credentials.from_service_account_info(
            json.loads(self.fcm_service_account),
            scopes=["https://www.googleapis.com/auth/firebase.messaging"]
        )

        request = google.auth.transport.requests.Request()
        credentials.refresh(request)

        self.fcm_access_token = credentials.token
        self.fcm_token_expiry = credentials.expiry.timestamp() if credentials.expiry else time.time() + 3600

        return self.fcm_access_token

    async def register_device(self, user_id: str, token: str, platform: str = "android"):
        """Register a device token."""
        self.device_tokens[user_id] = {
            "token": token,
            "platform": platform,
            "updated_at": datetime.utcnow().isoformat()
        }

    async def unregister_device(self, user_id: str):
        """Unregister a device."""
        if user_id in self.device_tokens:
            del self.device_tokens[user_id]

    async def send(self, notification: PushNotification, provider: NotificationChannel = NotificationChannel.FCM) -> NotificationResult:
        """Send push notification."""
        if provider == NotificationChannel.FCM:
            return await self._send_fcm(notification)
        elif provider == NotificationChannel.ONESIGNAL:
            return await self._send_onesignal(notification)
        else:
            return NotificationResult(success=False, error="Unknown provider")

    async def _send_fcm(self, notification: PushNotification) -> NotificationResult:
        """Send via FCM v1 API."""
        try:
            token = await self._get_fcm_access_token()
            url = f"https://fcm.googleapis.com/v1/projects/{self.fcm_project_id}/messages:send"

            payload = notification.to_fcm_payload()

            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return NotificationResult(
                            success=True,
                            message_id=data.get("name"),
                            provider="fcm"
                        )
                    else:
                        error_text = await resp.text()
                        return NotificationResult(
                            success=False,
                            error=f"FCM error {resp.status}: {error_text}",
                            provider="fcm"
                        )

        except Exception as e:
            return NotificationResult(success=False, error=str(e), provider="fcm")

    async def _send_onesignal(self, notification: PushNotification) -> NotificationResult:
        """Send via OneSignal."""
        try:
            url = "https://onesignal.com/api/v1/notifications"

            payload = notification.to_onesignal_payload()

            headers = {
                "Authorization": f"Basic {self.onesignal_api_key}",
                "Content-Type": "application/json"
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    data = await resp.json()

                    if resp.status == 200:
                        return NotificationResult(
                            success=True,
                            message_id=data.get("id"),
                            provider="onesignal",
                            failed_tokens=data.get("errors", {}).get("invalid_player_ids", [])
                        )
                    else:
                        return NotificationResult(
                            success=False,
                            error=f"OneSignal error: {data}",
                            provider="onesignal"
                        )

        except Exception as e:
            return NotificationResult(success=False, error=str(e), provider="onesignal")

    async def send_to_user(self, user_id: str, notification: PushNotification) -> NotificationResult:
        """Send notification to a specific user."""
        if user_id not in self.device_tokens:
            return NotificationResult(success=False, error="User has no registered device")

        device = self.device_tokens[user_id]
        notification.tokens = [device["token"]]

        return await self.send(notification)

    async def send_to_topic(self, topic: str, notification: PushNotification) -> NotificationResult:
        """Send notification to a topic."""
        notification.topic = topic
        return await self.send(notification)

    async def send_bulk(self, notifications: List[PushNotification]) -> List[NotificationResult]:
        """Send multiple notifications."""
        tasks = [self.send(n) for n in notifications]
        return await asyncio.gather(*tasks)

    async def create_topic(self, topic: str, tokens: List[str]):
        """Create a topic and subscribe tokens."""
        # FCM topic management
        url = f"https://iid.googleapis.com/iid/v1:batchAdd"

        payload = {
            "to": f"/topics/{topic}",
            "registration_tokens": tokens
        }

        token = await self._get_fcm_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                return resp.status == 200

    async def send_agent_notification(self, agent_id: str, status: str, message: str):
        """Send agent status notification."""
        notification = PushNotification(
            title=f"Agent {agent_id}",
            body=message,
            data={"agent_id": agent_id, "status": status, "type": "agent_update"},
            priority=NotificationPriority.HIGH.value
        )
        return await self.send_to_topic(f"agent_{agent_id}", notification)

    async def send_deployment_notification(self, project_name: str, status: str, url: str = None):
        """Send deployment status notification."""
        notification = PushNotification(
            title=f"Deployment: {project_name}",
            body=f"Status: {status}",
            data={"project": project_name, "status": status, "url": url or "", "type": "deployment"},
            priority=NotificationPriority.HIGH.value,
            click_action=url
        )
        return await self.send_to_topic(f"project_{project_name}", notification)


push = PushNotificationService()
