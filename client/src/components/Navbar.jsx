import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'

export default function Navbar({ sidebarOpen, onToggleSidebar }) {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="bg-blue-700 text-white px-4 md:px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Hamburger button — mobile only */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden flex flex-col gap-1.5 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-5 bg-white transition-all ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-5 bg-white transition-all ${sidebarOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-5 bg-white transition-all ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
        {/* Logo */}
        <span
          className="font-bold text-lg md:text-xl cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          FYPFinder
        </span>
      </div>
      {/* User info — hide on very small screens */}
      {user && (
        <div className="hidden sm:flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          <span className="truncate">{user.name} ({user.role})</span>
          <button
            onClick={handleLogout}
            className="rounded-md px-3 md:px-4 py-2 bg-white text-blue-700 hover:bg-gray-100 text-xs md:text-sm"
          >
            Logout
          </button>
        </div>
      )}
      {/* Mobile logout button */}
      {user && (
        <button
          onClick={handleLogout}
          className="sm:hidden rounded-md px-2 py-1 bg-white text-blue-700 hover:bg-gray-100 text-xs"
        >
          Logout
        </button>
      )}
    </nav>
  )
}