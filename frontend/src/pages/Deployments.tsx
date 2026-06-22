import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Rocket, Clock, CheckCircle2, XCircle, Loader2, GitBranch,
  ExternalLink, RefreshCw, Filter, Search, ChevronDown
} from 'lucide-react'

interface Deployment {
  id: string
  project_id: string
  project_name: string
  environment: string
  version: string
  status: 'pending' | 'running' | 'success' | 'failed'
  url: string
  started_at: string
  completed_at?: string
}

const statusConfig = {
  pending: { icon: Loader2, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', spin: true },
  running: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', spin: true },
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', spin: false },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', spin: false },
}

export default function Deployments() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEnv, setFilterEnv] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: deploymentsData } = useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/deployments')
      return res.json()
    }
  })

  const deployments: Deployment[] = deploymentsData?.deployments || [
    { id: 'd1', project_id: 'p1', project_name: 'E-Commerce App', environment: 'production', version: '2.1.0', status: 'success', url: 'https://shop.example.com', started_at: '2024-06-20T10:00:00Z', completed_at: '2024-06-20T10:05:00Z' },
    { id: 'd2', project_id: 'p2', project_name: 'Blog Platform', environment: 'staging', version: '1.5.0', status: 'running', url: 'https://blog-staging.example.com', started_at: '2024-06-22T08:00:00Z' },
    { id: 'd3', project_id: 'p3', project_name: 'Mobile Game', environment: 'production', version: '3.0.0', status: 'failed', url: '', started_at: '2024-06-21T15:00:00Z', completed_at: '2024-06-21T15:02:00Z' },
    { id: 'd4', project_id: 'p1', project_name: 'E-Commerce App', environment: 'staging', version: '2.2.0-beta', status: 'pending', url: '', started_at: '2024-06-22T09:00:00Z' },
  ]

  const filtered = deployments.filter(d => {
    const matchesSearch = d.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEnv = filterEnv === 'all' || d.environment === filterEnv
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesEnv && matchesStatus
  })

  const stats = {
    total: deployments.length,
    success: deployments.filter(d => d.status === 'success').length,
    failed: deployments.filter(d => d.status === 'failed').length,
    running: deployments.filter(d => d.status === 'running').length,
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.deployments')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage deployments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'bg-indigo-500' },
          { label: 'Success', value: stats.success, color: 'bg-green-500' },
          { label: 'Failed', value: stats.failed, color: 'bg-red-500' },
          { label: 'Running', value: stats.running, color: 'bg-blue-500' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder="Search deployments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none`}
          />
        </div>
        <select value={filterEnv} onChange={e => setFilterEnv(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
          <option value="all">All Environments</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Environment</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(d => {
              const status = statusConfig[d.status]
              const StatusIcon = status.icon
              return (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{d.project_name}</div>
                    <div className="text-xs text-gray-500">ID: {d.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{d.version}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.environment === 'production'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                    }`}>
                      {d.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${status.spin ? 'animate-spin' : ''}`} />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.started_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600 inline-flex">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
