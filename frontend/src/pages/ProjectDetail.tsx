import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, GitBranch, Bot, Rocket, Clock, Edit3,
  Play, Pause, Trash2, MoreVertical, CheckCircle2, XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProjectDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'

  // Mock project data
  const project = {
    id: id || 'unknown',
    name: 'E-Commerce Platform',
    description: 'A full-stack e-commerce solution with AI-powered recommendations and real-time inventory management.',
    type: 'web',
    status: 'active',
    created_at: '2024-01-15',
    updated_at: '2024-06-22',
    url: 'https://shop.yasmin.app',
    agents: [
      { id: 'a1', name: 'Frontend Builder', role: 'frontend', status: 'running' },
      { id: 'a2', name: 'API Developer', role: 'backend', status: 'idle' },
      { id: 'a3', name: 'DevOps Master', role: 'devops', status: 'running' },
    ],
    deployments: [
      { id: 'd1', version: '2.1.0', environment: 'production', status: 'success', date: '2024-06-20' },
      { id: 'd2', version: '2.0.5', environment: 'staging', status: 'success', date: '2024-06-18' },
    ]
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {project.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                }`}>
                  {project.status}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl">{project.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" /> {project.type}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Updated {project.updated_at}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Play className="w-4 h-4" /> Deploy
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
              <Edit3 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">Active Agents</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{project.agents.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Deployments</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{project.deployments.length}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">98.5%</div>
        </div>
      </div>

      {/* Agents */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Project Agents</h3>
        <div className="space-y-3">
          {project.agents.map(agent => (
            <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{agent.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  agent.status === 'running'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                }`}>
                  {agent.status}
                </span>
                <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                  <Play className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployments */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Deployment History</h3>
        <div className="space-y-3">
          {project.deployments.map(dep => (
            <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  dep.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {dep.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Version {dep.version}</div>
                  <div className="text-xs text-gray-500">{dep.environment} | {dep.date}</div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                dep.status === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30'
              }`}>
                {dep.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
