import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Bot, Play, Pause, RotateCcw, Trash2, MoreVertical,
  Cpu, Code, Palette, Server, TestTube, Workflow, X, Check,
  Activity, Clock, Zap
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  role: string
  status: 'running' | 'idle' | 'error' | 'paused'
  project_id: string
  capabilities: string[]
  last_active: string
  created_at: string
}

const agentRoles = [
  { value: 'frontend', label: 'Frontend', icon: Code, color: 'bg-blue-500' },
  { value: 'backend', label: 'Backend', icon: Server, color: 'bg-green-500' },
  { value: 'devops', label: 'DevOps', icon: Workflow, color: 'bg-orange-500' },
  { value: 'designer', label: 'Designer', icon: Palette, color: 'bg-pink-500' },
  { value: 'tester', label: 'QA Tester', icon: TestTube, color: 'bg-purple-500' },
  { value: 'orchestrator', label: 'Orchestrator', icon: Cpu, color: 'bg-indigo-500' },
]

const statusConfig = {
  running: { color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: 'Running' },
  idle: { color: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Idle' },
  error: { color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'Error' },
  paused: { color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Paused' },
}

export default function Agents() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', role: 'frontend', project_id: '' })
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set())

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/v1/agents')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (agent: typeof newAgent) => {
      const res = await fetch('/api/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      setShowCreateModal(false)
      setNewAgent({ name: '', role: 'frontend', project_id: '' })
    }
  })

  const runMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: string }) => {
      const res = await fetch(`/api/v1/agents/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: task })
      })
      return res.json()
    }
  })

  const handleRunAgent = (id: string) => {
    setRunningAgents(prev => new Set(prev).add(id))
    runMutation.mutate({ id, task: 'Execute assigned tasks' }, {
      onSettled: () => {
        setTimeout(() => {
          setRunningAgents(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        }, 3000)
      }
    })
  }

  const agents: Agent[] = agentsData?.agents || [
    { id: '1', name: 'Frontend Builder', role: 'frontend', status: 'running', project_id: 'p1', capabilities: ['react', 'vue', 'css'], last_active: '2m ago', created_at: '2024-01-01' },
    { id: '2', name: 'API Developer', role: 'backend', status: 'idle', project_id: 'p1', capabilities: ['node', 'python', 'sql'], last_active: '15m ago', created_at: '2024-01-01' },
    { id: '3', name: 'DevOps Master', role: 'devops', status: 'running', project_id: 'p2', capabilities: ['docker', 'k8s', 'ci/cd'], last_active: '1m ago', created_at: '2024-01-02' },
    { id: '4', name: 'UI Designer', role: 'designer', status: 'paused', project_id: 'p1', capabilities: ['figma', 'ui/ux'], last_active: '1h ago', created_at: '2024-01-03' },
    { id: '5', name: 'QA Tester', role: 'tester', status: 'idle', project_id: 'p2', capabilities: ['cypress', 'jest', 'selenium'], last_active: '30m ago', created_at: '2024-01-03' },
    { id: '6', name: 'Master Orchestrator', role: 'orchestrator', status: 'running', project_id: 'p3', capabilities: ['coordination', 'monitoring'], last_active: 'now', created_at: '2024-01-04' },
  ]

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || a.role === filterRole
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: agents.length,
    running: agents.filter(a => a.status === 'running').length,
    idle: agents.filter(a => a.status === 'idle').length,
    error: agents.filter(a => a.status === 'error').length,
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.agents')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your parallel AI agents
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('agent.create')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Bot, color: 'bg-indigo-500' },
          { label: 'Running', value: stats.running, icon: Activity, color: 'bg-green-500' },
          { label: 'Idle', value: stats.idle, icon: Clock, color: 'bg-gray-500' },
          { label: 'Error', value: stats.error, icon: Zap, color: 'bg-red-500' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All Roles</option>
          {agentRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="idle">Idle</option>
          <option value="error">Error</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAgents.map(agent => {
          const role = agentRoles.find(r => r.value === agent.role)
          const status = statusConfig[agent.status]
          const isRunning = runningAgents.has(agent.id)

          return (
            <div key={agent.id} className="card hover:shadow-lg transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${role?.color || 'bg-gray-500'} flex items-center justify-center text-white shadow-lg`}>
                      {role ? <role.icon className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{agent.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color} ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg">
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {agent.last_active}
                  </span>
                  <span>Project: {agent.project_id.slice(0, 8)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunAgent(agent.id)}
                    disabled={isRunning || agent.status === 'running'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isRunning ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run
                      </>
                    )}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Pause className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-16">
          <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No agents found</h3>
          <p className="text-gray-500 mb-4">Create your first AI agent</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('agent.create')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agent.name')}</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Agent name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('agent.role')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {agentRoles.map(role => (
                    <button
                      key={role.value}
                      onClick={() => setNewAgent({ ...newAgent, role: role.value })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-sm font-medium transition-all ${
                        newAgent.role === role.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <role.icon className="w-5 h-5" />
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => createMutation.mutate(newAgent)}
                disabled={!newAgent.name.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
