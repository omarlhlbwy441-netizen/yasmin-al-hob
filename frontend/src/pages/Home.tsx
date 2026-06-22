import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Bot, Rocket, Users, Activity, TrendingUp,
  Zap, Clock, AlertCircle, ChevronRight, Plus, ArrowUpRight
} from 'lucide-react'
import StatsCard from '../components/StatsCard'
import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string
  type: string
  status: string
  agents_count: number
  updated_at: string
}

interface Agent {
  id: string
  name: string
  role: string
  status: string
  last_active: string
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/analytics/dashboard')
      return res.json()
    }
  })

  const { data: recentProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects?limit=5')
      return res.json()
    }
  })

  const recentAgents: Agent[] = [
    { id: '1', name: 'Frontend Builder', role: 'frontend', status: 'running', last_active: '2m ago' },
    { id: '2', name: 'Backend API', role: 'backend', status: 'idle', last_active: '15m ago' },
    { id: '3', name: 'DevOps Agent', role: 'devops', status: 'running', last_active: '1m ago' },
    { id: '4', name: 'UI Designer', role: 'designer', status: 'idle', last_active: '1h ago' },
  ]

  const activities = [
    { id: 1, text: 'Project "E-Commerce App" deployed successfully', time: '2m ago', type: 'success' },
    { id: 2, text: 'Agent "Frontend Builder" completed task #245', time: '5m ago', type: 'info' },
    { id: 3, text: 'New agent "API Tester" created', time: '12m ago', type: 'success' },
    { id: 4, text: 'Deployment failed for "Blog Platform"', time: '18m ago', type: 'error' },
    { id: 5, text: 'User login from new device', time: '25m ago', type: 'warning' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'idle': return 'bg-gray-400'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('app.tagline')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {currentTime.toLocaleDateString(i18n.language, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={stats?.total_projects || 42}
          icon={FolderOpen}
          trend="12%"
          trendUp={true}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Active Agents"
          value={stats?.total_agents || 128}
          icon={Bot}
          trend="8%"
          trendUp={true}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Deployments"
          value={stats?.active_deployments || 15}
          icon={Rocket}
          trend="5%"
          trendUp={true}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatsCard
          title="Team Members"
          value={stats?.total_users || 256}
          icon={Users}
          trend="15%"
          trendUp={true}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
                  <p className="text-sm text-gray-500">Your latest projects</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/projects')}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {(recentProjects?.projects || []).map((project: Project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{project.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{project.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">{project.agents_count || 0} agents</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
            {(!recentProjects?.projects || recentProjects.projects.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No projects yet. Create your first project!</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Active Agents */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Active Agents</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {recentAgents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(agent.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{agent.name}</p>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                  </div>
                  <span className="text-xs text-gray-400">{agent.last_active}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => navigate('/agents')}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View all agents
              </button>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'error' ? 'bg-red-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">API Response</span>
                  <span className="font-medium text-green-600">45ms</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Agent Success</span>
                  <span className="font-medium text-blue-600">98.5%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '98.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Deployment Rate</span>
                  <span className="font-medium text-purple-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
