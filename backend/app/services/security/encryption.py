"""
🔐 Encryption at Rest Service
Encrypt sensitive data before storing
"""
import os
import base64
from typing import Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend


class EncryptionService:
    """Encrypt and decrypt sensitive data."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_cipher()
        return cls._instance

    def _init_cipher(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Generate key if not provided (for dev only)
            key = Fernet.generate_key().decode()
            print(f"WARNING: Generated encryption key: {key}")

        self.cipher = Fernet(key.encode() if isinstance(key, str) else key)

    def encrypt(self, data: Union[str, bytes]) -> str:
        """Encrypt data."""
        if isinstance(data, str):
            data = data.encode()
        encrypted = self.cipher.encrypt(data)
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt data."""
        encrypted = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()

    def encrypt_dict(self, data: dict) -> str:
        """Encrypt a dictionary."""
        import json
        return self.encrypt(json.dumps(data))

    def decrypt_dict(self, encrypted_data: str) -> dict:
        """Decrypt to dictionary."""
        import json
        return json.loads(self.decrypt(encrypted_data))

    def hash_sensitive(self, data: str, salt: str = None) -> str:
        """One-way hash for sensitive data (like API keys)."""
        if salt is None:
            salt = os.urandom(32)
        else:
            salt = salt.encode() if isinstance(salt, str) else salt

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
            backend=default_backend()
        )

        key = base64.urlsafe_b64encode(kdf.derive(data.encode())).decode()
        return f"{base64.urlsafe_b64encode(salt).decode()}:{key}"

    def verify_hash(self, data: str, hashed: str) -> bool:
        """Verify data against hash."""
        salt_b64, _ = hashed.split(":")
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        return self.hash_sensitive(data, salt) == hashed


encryption = EncryptionService()
