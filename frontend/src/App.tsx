import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import Home from './pages/Home'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Agents from './pages/Agents'
import Deployments from './pages/Deployments'
import Analytics from './pages/Analytics'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const { i18n } = useTranslation()

  return (
    <div dir={i18n.language === 'ar' || i18n.language === 'fa' || i18n.language === 'ur' ? 'rtl' : 'ltr'}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/projects" element={<Layout><Projects /></Layout>} />
        <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
        <Route path="/agents" element={<Layout><Agents /></Layout>} />
        <Route path="/deployments" element={<Layout><Deployments /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="/chat" element={<Layout><Chat /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </div>
  )
}

export default App
