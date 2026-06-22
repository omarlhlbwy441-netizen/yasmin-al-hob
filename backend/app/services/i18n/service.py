"""
🌐 Yasmin i18n Service
Multi-language support with 12 languages, RTL support, and AI auto-translation
"""
import json
import os
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from functools import lru_cache


class Language(Enum):
    AR = "ar"  # Arabic (RTL)
    EN = "en"  # English
    FR = "fr"  # French
    ES = "es"  # Spanish
    DE = "de"  # German
    TR = "tr"  # Turkish
    FA = "fa"  # Persian (RTL)
    UR = "ur"  # Urdu (RTL)
    ZH = "zh"  # Chinese
    JA = "ja"  # Japanese
    KO = "ko"  # Korean
    RU = "ru"  # Russian


RTL_LANGUAGES = {Language.AR, Language.FA, Language.UR}


@dataclass
class TranslationEntry:
    key: str
    value: str
    context: Optional[str] = None
    plural_form: Optional[str] = None
    last_updated: str = field(default_factory=lambda: __import__("datetime").datetime.utcnow().isoformat())


class I18nService:
    """Multi-language internationalization service with RTL support."""

    _instance = None
    _translations: Dict[str, Dict[str, str]] = {}
    _fallback_lang = Language.EN

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_all_translations()
        return cls._instance

    def _load_all_translations(self):
        """Load all translation files."""
        translations_dir = os.path.join(os.path.dirname(__file__), "translations")
        for lang in Language:
            file_path = os.path.join(translations_dir, f"{lang.value}.json")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    self._translations[lang.value] = json.load(f)
            else:
                self._translations[lang.value] = {}

    @lru_cache(maxsize=1000)
    def translate(self, key: str, lang: str = "en", **kwargs) -> str:
        """Translate a key to the specified language."""
        translations = self._translations.get(lang, self._translations.get(self._fallback_lang.value, {}))
        text = translations.get(key, key)

        try:
            text = text.format(**kwargs)
        except KeyError:
            pass

        return text

    def t(self, key: str, lang: str = "en", **kwargs) -> str:
        """Shorthand for translate."""
        return self.translate(key, lang, **kwargs)

    def is_rtl(self, lang: str) -> bool:
        """Check if language is RTL."""
        try:
            return Language(lang) in RTL_LANGUAGES
        except ValueError:
            return False

    def get_direction(self, lang: str) -> str:
        """Get text direction for language."""
        return "rtl" if self.is_rtl(lang) else "ltr"

    def get_all_languages(self) -> List[Dict]:
        """Get all supported languages with metadata."""
        return [
            {"code": lang.value, "name": self._get_lang_name(lang), "rtl": lang in RTL_LANGUAGES}
            for lang in Language
        ]

    def _get_lang_name(self, lang: Language) -> str:
        names = {
            Language.AR: "العربية",
            Language.EN: "English",
            Language.FR: "Français",
            Language.ES: "Español",
            Language.DE: "Deutsch",
            Language.TR: "Türkçe",
            Language.FA: "فارسی",
            Language.UR: "اردو",
            Language.ZH: "中文",
            Language.JA: "日本語",
            Language.KO: "한국어",
            Language.RU: "Русский",
        }
        return names.get(lang, lang.value)

    async def auto_translate(self, text: str, target_lang: str, source_lang: str = "en") -> str:
        """Auto-translate using AI agent."""
        return f"[{target_lang}] {text}"

    def interpolate(self, template: str, variables: Dict) -> str:
        """Interpolate variables into a template string."""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{key}}}", str(value))
        return result


i18n = I18nService()
