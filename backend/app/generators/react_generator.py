"""
⚛️ React Generator
"""
from typing import Dict, List
import json


class ReactGenerator:
    """Generate React applications with TypeScript."""

    @staticmethod
    def generate_project(name: str, config: Dict = None) -> Dict:
        """Generate a complete React project structure."""
        config = config or {}

        files = {
            "package.json": json.dumps({
                "name": name,
                "version": "1.0.0",
                "private": True,
                "dependencies": {
                    "react": "^18.3.0",
                    "react-dom": "^18.3.0",
                    "react-router-dom": "^6.23.0",
                    "@tanstack/react-query": "^5.40.0",
                    "zustand": "^4.5.0",
                    "tailwindcss": "^3.4.0",
                    "axios": "^1.7.0",
                    "socket.io-client": "^4.7.0",
                    "i18next": "^23.11.0",
                    "react-i18next": "^14.1.0"
                },
                "devDependencies": {
                    "@types/react": "^18.3.0",
                    "@types/react-dom": "^18.3.0",
                    "@vitejs/plugin-react": "^4.3.0",
                    "typescript": "^5.4.0",
                    "vite": "^5.2.0",
                    "vitest": "^1.6.0"
                },
                "scripts": {
                    "dev": "vite",
                    "build": "tsc && vite build",
                    "preview": "vite preview",
                    "test": "vitest"
                }
            }, indent=2),

            "src/main.tsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)""",

            "src/App.tsx": """import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Agents from './pages/Agents'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/agents' element={<Agents />} />
      </Routes>
    </Layout>
  )
}

export default App""",

            "src/components/Layout.tsx": """import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <div className='flex'>
        <Sidebar />
        <main className='flex-1 p-6'>{children}</main>
      </div>
    </div>
  )
}""",

            "src/components/Navbar.tsx": """import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4'>
      <div className='flex items-center justify-between'>
        <Link to='/' className='text-xl font-bold'>Yasmin</Link>
        <div className='space-x-4'>
          <Link to='/projects' className='hover:opacity-80'>Projects</Link>
          <Link to='/agents' className='hover:opacity-80'>Agents</Link>
        </div>
      </div>
    </nav>
  )
}""",

            "src/components/Sidebar.tsx": """export default function Sidebar() {
  return (
    <aside className='w-64 bg-white shadow-sm h-screen p-4'>
      <nav className='space-y-2'>
        <div className='p-2 hover:bg-gray-100 rounded cursor-pointer'>Dashboard</div>
        <div className='p-2 hover:bg-gray-100 rounded cursor-pointer'>Deployments</div>
        <div className='p-2 hover:bg-gray-100 rounded cursor-pointer'>Analytics</div>
        <div className='p-2 hover:bg-gray-100 rounded cursor-pointer'>Settings</div>
      </nav>
    </aside>
  )
}""",

            "src/pages/Home.tsx": """export default function Home() {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Welcome to Yasmin</h1>
      <p className='text-gray-600'>Build apps with parallel AI agents.</p>
    </div>
  )
}""",

            "src/pages/Projects.tsx": """import { useQuery } from '@tanstack/react-query'

export default function Projects() {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/v1/projects')
      return res.json()
    }
  })

  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>Projects</h1>
      <div className='grid grid-cols-3 gap-4'>
        {data?.projects?.map((p: any) => (
          <div key={p.id} className='bg-white p-4 rounded-lg shadow'>
            <h3 className='font-semibold'>{p.name}</h3>
            <p className='text-sm text-gray-500'>{p.type}</p>
          </div>
        ))}
      </div>
    </div>
  )
}""",

            "src/pages/Agents.tsx": """export default function Agents() {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-4'>AI Agents</h1>
      <p>Manage your parallel AI agents.</p>
    </div>
  )
}""",

            "src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
}""",

            "index.html": """<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8' />
  <link rel='icon' type='image/svg+xml' href='/vite.svg' />
  <meta name='viewport' content='width=device-width, initial-scale=1.0' />
  <title>Yasmin AI Builder</title>
</head>
<body>
  <div id='root'></div>
  <script type='module' src='/src/main.tsx'></script>
</body>
</html>""",

            "vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': 'http://localhost:8001'
    }
  }
})""",

            "tsconfig.json": json.dumps({
                "compilerOptions": {
                    "target": "ES2020",
                    "useDefineForClassFields": True,
                    "lib": ["ES2020", "DOM", "DOM.Iterable"],
                    "module": "ESNext",
                    "skipLibCheck": True,
                    "moduleResolution": "bundler",
                    "allowImportingTsExtensions": True,
                    "resolveJsonModule": True,
                    "isolatedModules": True,
                    "noEmit": True,
                    "jsx": "react-jsx",
                    "strict": True,
                    "noUnusedLocals": True,
                    "noUnusedParameters": True,
                    "noFallthroughCasesInSwitch": True
                },
                "include": ["src"],
                "references": [{"path": "./tsconfig.node.json"}]
            }, indent=2),

            "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}"""
        }

        return {
            "framework": "react",
            "version": "18.3",
            "language": "typescript",
            "files": [{"path": k, "content": v} for k, v in files.items()],
            "total_files": len(files),
            "dependencies": 10,
            "dev_dependencies": 6
        }


generator = ReactGenerator()
