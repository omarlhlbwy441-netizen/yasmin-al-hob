import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, Users, Activity, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react'
import { useState } from 'react'

export default function Analytics() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'
  const [timeRange, setTimeRange] = useState('7d')

  const { data: analytics } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/dashboard?range=${timeRange}`)
      return res.json()
    }
  })

  const metrics = [
    { label: 'Total Requests', value: '1.2M', change: '+12.5%', up: true, icon: Zap },
    { label: 'Avg Response Time', value: '45ms', change: '-8.2%', up: false, icon: Clock },
    { label: 'Active Users', value: '2.4K', change: '+23.1%', up: true, icon: Users },
    { label: 'Error Rate', value: '0.02%', change: '-45%', up: false, icon: Activity },
  ]

  const chartData = [
    { day: 'Mon', requests: 4000, errors: 20 },
    { day: 'Tue', requests: 5200, errors: 15 },
    { day: 'Wed', requests: 4800, errors: 25 },
    { day: 'Thu', requests: 6100, errors: 10 },
    { day: 'Fri', requests: 5800, errors: 18 },
    { day: 'Sat', requests: 7200, errors: 12 },
    { day: 'Sun', requests: 6900, errors: 8 },
  ]

  const maxRequests = Math.max(...chartData.map(d => d.requests))

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.analytics')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time system analytics</p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <m.icon className="w-5 h-5 text-gray-400" />
              <span className={`flex items-center gap-1 text-xs font-medium ${m.up ? 'text-green-600' : 'text-red-600'}`}>
                {m.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {m.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</div>
            <div className="text-sm text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Request Volume</h3>
              <p className="text-sm text-gray-500">Requests per day</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2 h-48">
            {chartData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5">
                  <div
                    className="flex-1 bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600"
                    style={{ height: `${(d.requests / maxRequests) * 160}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Error Rate</h3>
              <p className="text-sm text-gray-500">Errors per day</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2 h-48">
            {chartData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5">
                  <div
                    className="flex-1 bg-red-400 rounded-t-sm transition-all hover:bg-red-500"
                    style={{ height: `${(d.errors / 30) * 160}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Performing Agents</h3>
        <div className="space-y-3">
          {[
            { name: 'Frontend Builder', tasks: 245, success: 98.5, avgTime: '2.3s' },
            { name: 'Backend API', tasks: 189, success: 99.2, avgTime: '1.8s' },
            { name: 'DevOps Agent', tasks: 156, success: 97.8, avgTime: '5.1s' },
            { name: 'UI Designer', tasks: 134, success: 96.5, avgTime: '3.2s' },
          ].map((agent, i) => (
            <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                <div className="text-xs text-gray-500">{agent.tasks} tasks completed</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{agent.success}%</div>
                <div className="text-xs text-gray-500">success rate</div>
              </div>
              <div className="text-right w-20">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{agent.avgTime}</div>
                <div className="text-xs text-gray-500">avg time</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
