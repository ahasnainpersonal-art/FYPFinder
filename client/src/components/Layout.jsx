import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}