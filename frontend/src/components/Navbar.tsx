import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Menu, X, Bell, User } from 'lucide-react'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">Y</span>
              <span className="hidden sm:inline">{t('app.name')}</span>
            </Link>

            <div className="hidden md:flex gap-1">
              {[
                { path: '/', label: t('nav.home') },
                { path: '/projects', label: t('nav.projects') },
                { path: '/agents', label: t('nav.agents') },
                { path: '/deployments', label: t('nav.deployments') },
                { path: '/analytics', label: t('nav.analytics') },
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path) 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
            >
              {i18n.language === 'en' ? 'AR' : 'EN'}
            </button>

            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <Link to="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <User className="w-5 h-5" />
            </Link>

            <button
              className="md:hidden p-2 rounded-md hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-700 px-4 pb-4">
          {[
            { path: '/', label: t('nav.home') },
            { path: '/projects', label: t('nav.projects') },
            { path: '/agents', label: t('nav.agents') },
            { path: '/deployments', label: t('nav.deployments') },
            { path: '/analytics', label: t('nav.analytics') },
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
