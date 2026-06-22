import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Bot, 
  Rocket, 
  BarChart3, 
  MessageSquare, 
  Settings,
  ChevronRight
} from 'lucide-react'

export default function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.home') },
    { path: '/projects', icon: FolderOpen, label: t('nav.projects') },
    { path: '/agents', icon: Bot, label: t('nav.agents') },
    { path: '/deployments', icon: Rocket, label: t('nav.deployments') },
    { path: '/analytics', icon: BarChart3, label: t('nav.analytics') },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 shadow-sm h-[calc(100vh-4rem)] sticky top-16">
      <nav className="p-4 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            Y
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Yasmin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">user@yasmin.ai</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
