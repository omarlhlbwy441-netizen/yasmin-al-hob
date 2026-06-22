import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe, Moon, Sun, Bell, Shield, Key, User, Mail,
  ChevronRight, Check, Smartphone, Monitor
} from 'lucide-react'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const languages = [
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'ar', name: 'العربية', flag: 'AR' },
    { code: 'fr', name: 'Français', flag: 'FR' },
    { code: 'es', name: 'Español', flag: 'ES' },
    { code: 'de', name: 'Deutsch', flag: 'DE' },
    { code: 'tr', name: 'Türkçe', flag: 'TR' },
    { code: 'zh', name: '中文', flag: 'ZH' },
    { code: 'ja', name: '日本語', flag: 'JA' },
    { code: 'ko', name: '한국어', flag: 'KO' },
    { code: 'ru', name: 'Русский', flag: 'RU' },
  ]

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    document.documentElement.dir = ['ar', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr'
  }

  return (
    <div className="space-y-6 max-w-4xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account</p>
      </div>

      {/* Profile Section */}
      <div className="card overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
              Y
            </div>
            <div>
              <h2 className="text-xl font-bold">Yasmin User</h2>
              <p className="text-white/80">user@yasmin.ai</p>
              <p className="text-white/60 text-sm mt-1">Administrator</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" defaultValue="Yasmin User" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" defaultValue="user@yasmin.ai" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Language</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                i18n.language === lang.code
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {lang.flag}
              </span>
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-orange-500" />}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500">Switch between light and dark themes</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Push Notifications', desc: 'Receive push notifications', value: pushNotifications, set: setPushNotifications },
            { label: 'Email Alerts', desc: 'Get email for important events', value: emailAlerts, set: setEmailAlerts },
            { label: 'Agent Updates', desc: 'Notifications when agents complete tasks', value: notifications, set: setNotifications },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => item.set(!item.value)}
                className={`relative w-12 h-6 rounded-full transition-colors ${item.value ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
        </div>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">API Keys</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
