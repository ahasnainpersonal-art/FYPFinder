import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const getAuthHeader = () => {
  const raw = localStorage.getItem('user')
  const user = raw ? JSON.parse(raw) : null
  return { headers: { Authorization: `Bearer ${user?.token}` } }
}

export default function Analytics() {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState(null)
  const [domains, setDomains] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const fetchAll = async () => {
      try {
        const [statsRes, domainsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/analytics`, getAuthHeader()),
          axios.get(`${API_BASE}/api/admin/analytics/domains`, getAuthHeader()),
        ])

        if (cancelled) return
        setStats(statsRes.data)
        setDomains(domainsRes.data || {})
      } catch (err) {
        if (cancelled) return
        setStats(null)
        setDomains({})
        setError(err?.response?.data?.message || 'Failed to load analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/dashboard" />

  const totalApplications = stats?.totalApplications
  const approved = stats?.approved
  const approvalRate = !totalApplications
    ? null
    : Math.round(((approved || 0) / totalApplications) * 100)

  const domainData = useMemo(() => {
    const entries = Object.entries(domains || {})
      .map(([domain, count]) => ({ domain, count: Number(count || 0) }))
      .filter((row) => row.domain)
      .sort((a, b) => a.domain.localeCompare(b.domain))

    if (entries.length > 0) return entries

    // Fallback when API returns nothing yet
    const ordered = ['AI', 'Web', 'Mobile', 'Cybersecurity', 'Other']
    return ordered.map((d) => ({ domain: d, count: 0 }))
  }, [domains])

  const roleData = useMemo(() => {
    const students = stats?.totalStudents || 0
    const supervisors = stats?.totalSupervisors || 0
    return [
      { name: 'Students', value: students },
      { name: 'Supervisors', value: supervisors },
    ]
  }, [stats])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h1>

      {loading && (
        <p className="text-gray-600">Loading analytics…</p>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <p className="text-3xl font-bold">{stats?.totalUsers ?? '—'}</p>
          <p className="text-gray-600">Total Users</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <p className="text-3xl font-bold">{stats?.totalProjects ?? '—'}</p>
          <p className="text-gray-600">Total Projects</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <p className="text-3xl font-bold">{stats?.totalApplications ?? '—'}</p>
          <p className="text-gray-600">Total Applications</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <p className="text-3xl font-bold">{approvalRate === null ? '—' : `${approvalRate}%`}</p>
          <p className="text-gray-600">Approval Rate</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Projects by Domain</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={domainData}>
              <XAxis dataKey="domain" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">User Split</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={90} label>
                <Cell fill="#2563eb" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
