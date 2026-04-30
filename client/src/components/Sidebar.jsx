import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

const studentLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Browse Projects', path: '/projects' },
  { label: 'My Applications', path: '/my-applications' },
  { label: 'Blog', path: '/blog' },
  { label: 'Profile', path: '/profile' },
  { label: 'Contact', path: '/contact' },
]

const supervisorLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Post Project', path: '/post-project' },
  { label: 'My Projects', path: '/my-projects' },
  { label: 'Blog', path: '/blog' },
  { label: 'Profile', path: '/profile' },
  { label: 'Contact', path: '/contact' },
]

const adminLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Cash Flow', path: '/cashflow' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
]

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()

  const links =
    user?.role === 'supervisor' ? supervisorLinks :
    user?.role === 'admin' ? adminLinks :
    studentLinks

  return (
    <aside className="w-48 min-h-screen bg-gray-800 text-white flex flex-col pt-6">
      {links.map((link) => (
        <button
          key={link.path}
          onClick={() => navigate(link.path)}
          className={`text-left px-6 py-3 text-sm hover:bg-gray-700 
            ${location.pathname === link.path ? 'bg-gray-700 font-semibold border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
        >
          {link.label}
        </button>
      ))}
    </aside>
  )
}