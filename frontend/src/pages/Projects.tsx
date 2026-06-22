import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, MoreVertical, GitBranch, Clock,
  Users, Bot, Trash2, Edit3, X, Check, ChevronDown,
  LayoutGrid, List, FolderOpen
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  type: string
  status: string
  agents_count: number
  deployments_count: number
  created_at: string
  updated_at: string
}

const projectTypes = [
  { value: 'all', label: 'All Types', icon: FolderOpen },
  { value: 'web', label: 'Web App', icon: LayoutGrid },
  { value: 'mobile', label: 'Mobile', icon: FolderOpen },
  { value: 'game', label: 'Game', icon: FolderOpen },
  { value: 'api', label: 'API', icon: FolderOpen },
  { value: 'system', label: 'System', icon: FolderOpen },
]

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

export default function Projects() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isRTL = i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur'

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', type: 'web' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', description: '' })

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (project: typeof newProject) => {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowCreateModal(false)
      setNewProject({ name: '', description: '', type: 'web' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/v1/projects/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  })

  const filteredProjects = (projectsData?.projects || []).filter((p: Project) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || p.type === filterType
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreate = () => {
    if (newProject.name.trim()) {
      createMutation.mutate(newProject)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id)
    }
  }

  const typeColors: Record<string, string> = {
    web: 'bg-blue-500',
    mobile: 'bg-purple-500',
    game: 'bg-pink-500',
    api: 'bg-green-500',
    system: 'bg-orange-500',
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.projects')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor your projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('project.create')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all`}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {projectTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredProjects.length} projects
      </div>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project: Project) => (
            <div
              key={project.id}
              className="card hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${typeColors[project.type] || 'bg-gray-500'} flex items-center justify-center text-white shadow-lg`}>
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{project.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(project.id); setEditData({ name: project.name, description: project.description }) }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id) }}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors.draft}`}>
                    {project.status}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> {project.agents_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" /> {project.deployments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                  <span>ID: {project.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Agents</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProjects.map((project: Project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${typeColors[project.type] || 'bg-gray-500'} flex items-center justify-center text-white text-sm font-bold`}>
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{project.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors.draft}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.agents_count || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(project.updated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(project.id) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id) }} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No projects found</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('project.create')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project.name')}</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project.description')}</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  rows={3}
                  placeholder="Describe your project..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('project.type')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['web', 'mobile', 'game', 'api', 'system'].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewProject({ ...newProject, type })}
                      className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                        newProject.type === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProject.name.trim() || createMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
