import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import blogService from '../services/blogService'
import adminService from '../services/adminService'

export default function Landing() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ totalProjects: 0, totalStudents: 0, totalSupervisors: 0 })

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    blogService.getPosts().then(setPosts).catch(() => setPosts([]))
    adminService.getAnalytics().then((data) => {
      setStats({
        totalProjects: data?.totalProjects || 0,
        totalStudents: data?.totalStudents || 0,
        totalSupervisors: data?.totalSupervisors || 0,
      })
    }).catch(() => {
      setStats({ totalProjects: 0, totalStudents: 0, totalSupervisors: 0 })
    })
  }, [])

  const latestCommunity = useMemo(() => posts.filter((p) => !p.isIndustrialShowcase).slice(0, 3), [posts])
  const latestIndustrial = useMemo(() => posts.filter((p) => p.isIndustrialShowcase).slice(0, 3), [posts])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
        <span className="font-bold text-lg cursor-pointer" onClick={() => navigate('/')}>FYPFinder</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="rounded-md px-4 py-2 bg-white text-blue-700 hover:bg-gray-100"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="rounded-md px-4 py-2 bg-blue-600 text-white hover:bg-blue-800"
          >
            Register
          </button>
        </div>
      </nav>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Your FYP Supervisor at FAST-NUCES</h1>
          <p className="text-gray-700 text-lg mb-8">Browse projects, form your group, and get matched with the right supervisor</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
            >
              Register
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-gray-600 text-sm">Total Projects Posted</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-gray-600 text-sm">Total Students</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
              <p className="text-2xl font-bold text-gray-900">{stats.totalSupervisors}</p>
              <p className="text-gray-600 text-sm">Total Supervisors</p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">From the Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestCommunity.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <span className="rounded-full px-3 py-1 text-xs font-semibold inline-block bg-purple-100 text-purple-700 mb-2">{p.tag || 'Tips'}</span>
                <p className="font-semibold text-gray-900 mb-2">{p.title}</p>
                <p className="text-sm text-gray-600">{String(p.content || '').slice(0, 150)}{String(p.content || '').length > 150 ? '…' : ''}</p>
                <button
                  onClick={() => navigate(`/blog?post=${p._id}`)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Read More
                </button>
              </div>
            ))}
            {latestCommunity.length === 0 && (
              <p className="text-gray-500">No blog posts yet.</p>
            )}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Industrial Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestIndustrial.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <span className="rounded-full px-3 py-1 text-xs font-semibold inline-block bg-orange-100 text-orange-700 mb-2">Industrial Project</span>
                <p className="font-semibold text-gray-900 mb-2">{p.title}</p>
                <p className="text-sm text-gray-600">{String(p.content || '').slice(0, 150)}{String(p.content || '').length > 150 ? '…' : ''}</p>
                <button
                  onClick={() => navigate(`/blog?tag=${encodeURIComponent('Industrial Projects')}&post=${p._id}`)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                >
                  Read More
                </button>
              </div>
            ))}
            {latestIndustrial.length === 0 && (
              <p className="text-gray-500">No industrial projects yet.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact</h3>
            <p className="text-sm text-gray-700">FAST-NUCES Lahore, Block B, Faisal Town</p>
            <p className="text-sm text-gray-700">Email: fast@nu.edu.pk</p>
            <p className="text-sm text-gray-700">Phone: +92-42-111-128-128</p>
            <button
              onClick={() => navigate('/contact')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              Contact Us
            </button>
          </div>
          <div className="w-full">
            <iframe
              title="FAST-NUCES Lahore"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.0!2d74.3297!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zRkFTVC1OVUNFUyBMYWhvcmU!5e0!3m2!1sen!2s!4v1!5m2!1sen!2s"
              className="w-full h-56 rounded-lg border"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
