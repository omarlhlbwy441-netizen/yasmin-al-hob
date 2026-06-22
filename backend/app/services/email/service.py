"""
📧 Yasmin Email Service
Multi-provider email service with SendGrid, Resend, and SMTP fallback
"""
import os
import json
import asyncio
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import aiohttp
import jinja2


class EmailProvider(Enum):
    SENDGRID = "sendgrid"
    RESEND = "resend"
    SMTP = "smtp"


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    content_type: str = "application/octet-stream"


@dataclass
class EmailMessage:
    to: Union[str, List[str]]
    subject: str
    body: str
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    html_body: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    attachments: List[EmailAttachment] = field(default_factory=list)
    template_id: Optional[str] = None
    template_data: Dict = field(default_factory=dict)
    metadata: Dict = field(default_factory=dict)
    track_opens: bool = True
    track_clicks: bool = True


@dataclass
class EmailResult:
    success: bool
    message_id: Optional[str] = None
    provider: str = ""
    error: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


class EmailService:
    """Multi-provider email service with failover."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_providers()
        return cls._instance

    def _init_providers(self):
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_pass = os.getenv("SMTP_PASS")
        self.default_from = os.getenv("EMAIL_FROM", "noreply@yasmin.ai")
        self.default_from_name = os.getenv("EMAIL_FROM_NAME", "Yasmin AI")

        # Template engine
        self.template_loader = jinja2.FileSystemLoader(
            os.path.join(os.path.dirname(__file__), "templates")
        )
        self.template_env = jinja2.Environment(loader=self.template_loader, autoescape=True)

        # Provider priority
        self.provider_priority = [
            EmailProvider.RESEND,
            EmailProvider.SENDGRID,
            EmailProvider.SMTP,
        ]

    def _get_template(self, template_name: str) -> jinja2.Template:
        """Load an email template."""
        return self.template_env.get_template(f"{template_name}.html")

    def render_template(self, template_name: str, data: Dict) -> str:
        """Render an email template with data."""
        template = self._get_template(template_name)
        return template.render(**data)

    async def send(self, message: EmailMessage) -> EmailResult:
        """Send email with automatic provider failover."""
        # Set defaults
        if not message.from_email:
            message.from_email = self.default_from
        if not message.from_name:
            message.from_name = self.default_from_name

        # Render template if specified
        if message.template_id:
            message.html_body = self.render_template(message.template_id, message.template_data)

        # Try providers in priority order
        for provider in self.provider_priority:
            try:
                if provider == EmailProvider.RESEND and self.resend_api_key:
                    return await self._send_resend(message)
                elif provider == EmailProvider.SENDGRID and self.sendgrid_api_key:
                    return await self._send_sendgrid(message)
                elif provider == EmailProvider.SMTP and self.smtp_user:
                    return await self._send_smtp(message)
            except Exception as e:
                print(f"Email provider {provider.value} failed: {e}")
                continue

        return EmailResult(success=False, error="All email providers failed")

    async def _send_resend(self, message: EmailMessage) -> EmailResult:
        """Send via Resend API."""
        url = "https://api.resend.com/emails"

        payload = {
            "from": f"{message.from_name} <{message.from_email}>",
            "to": message.to if isinstance(message.to, list) else [message.to],
            "subject": message.subject,
        }

        if message.html_body:
            payload["html"] = message.html_body
        else:
            payload["text"] = message.body

        if message.cc:
            payload["cc"] = message.cc
        if message.bcc:
            payload["bcc"] = message.bcc

        headers = {
            "Authorization": f"Bearer {self.resend_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return EmailResult(
                        success=True,
                        message_id=data.get("id"),
                        provider="resend"
                    )
                else:
                    error = await resp.text()
                    raise Exception(f"Resend error: {error}")

    async def _send_sendgrid(self, message: EmailMessage) -> EmailResult:
        """Send via SendGrid API."""
        url = "https://api.sendgrid.com/v3/mail/send"

        payload = {
            "personalizations": [{
                "to": [{"email": e} for e in (message.to if isinstance(message.to, list) else [message.to])],
            }],
            "from": {"email": message.from_email, "name": message.from_name},
            "subject": message.subject,
            "content": []
        }

        if message.html_body:
            payload["content"].append({"type": "text/html", "value": message.html_body})
        payload["content"].append({"type": "text/plain", "value": message.body})

        if message.cc:
            payload["personalizations"][0]["cc"] = [{"email": e} for e in message.cc]
        if message.bcc:
            payload["personalizations"][0]["bcc"] = [{"email": e} for e in message.bcc]

        # Tracking
        payload["tracking_settings"] = {
            "click_tracking": {"enable": message.track_clicks},
            "open_tracking": {"enable": message.track_opens}
        }

        headers = {
            "Authorization": f"Bearer {self.sendgrid_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                if resp.status in (200, 202):
                    message_id = resp.headers.get("X-Message-Id")
                    return EmailResult(
                        success=True,
                        message_id=message_id,
                        provider="sendgrid"
                    )
                else:
                    error = await resp.text()
                    raise Exception(f"SendGrid error: {error}")

    async def _send_smtp(self, message: EmailMessage) -> EmailResult:
        """Send via SMTP."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._send_smtp_sync, message)

    def _send_smtp_sync(self, message: EmailMessage) -> EmailResult:
        """Synchronous SMTP send."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = message.subject
        msg["From"] = f"{message.from_name} <{message.from_email}>"
        msg["To"] = ", ".join(message.to if isinstance(message.to, list) else [message.to])

        if message.cc:
            msg["Cc"] = ", ".join(message.cc)

        # Attachments
        if message.attachments:
            msg = MIMEMultipart("mixed")
            msg["Subject"] = message.subject
            msg["From"] = f"{message.from_name} <{message.from_email}>"
            msg["To"] = ", ".join(message.to if isinstance(message.to, list) else [message.to])

            alt_part = MIMEMultipart("alternative")
            alt_part.attach(MIMEText(message.body, "plain"))
            if message.html_body:
                alt_part.attach(MIMEText(message.html_body, "html"))
            msg.attach(alt_part)

            for attachment in message.attachments:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.content)
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {attachment.filename}"
                )
                msg.attach(part)
        else:
            msg.attach(MIMEText(message.body, "plain"))
            if message.html_body:
                msg.attach(MIMEText(message.html_body, "html"))

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_pass)
            server.send_message(msg)

        return EmailResult(success=True, provider="smtp")

    async def send_bulk(self, messages: List[EmailMessage]) -> List[EmailResult]:
        """Send multiple emails."""
        tasks = [self.send(msg) for msg in messages]
        return await asyncio.gather(*tasks)

    async def send_welcome(self, to_email: str, name: str, lang: str = "en") -> EmailResult:
        """Send welcome email."""
        message = EmailMessage(
            to=to_email,
            subject="Welcome to Yasmin!",
            body=f"Hi {name}, welcome to Yasmin AI platform!",
            template_id="welcome",
            template_data={"name": name, "lang": lang}
        )
        return await self.send(message)

    async def send_password_reset(self, to_email: str, reset_token: str) -> EmailResult:
        """Send password reset email."""
        reset_url = f"https://yasmin.ai/reset-password?token={reset_token}"
        message = EmailMessage(
            to=to_email,
            subject="Password Reset Request",
            body=f"Reset your password: {reset_url}",
            template_id="password_reset",
            template_data={"reset_url": reset_url}
        )
        return await self.send(message)

    async def send_deployment_notification(
        self, to_email: str, project_name: str, status: str, url: str
    ) -> EmailResult:
        """Send deployment notification."""
        message = EmailMessage(
            to=to_email,
            subject=f"Deployment {status}: {project_name}",
            body=f"Your project {project_name} has been {status}.
URL: {url}",
            template_id="deployment_notification",
            template_data={"project_name": project_name, "status": status, "url": url}
        )
        return await self.send(message)


email = EmailService()
