
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import projectService from '../services/projectService'
import applicationService from '../services/applicationService'
import profileService from '../services/profileService'

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [newProjects, setNewProjects] = useState([])
  const [checkingProjects, setCheckingProjects] = useState(false)
  const [lastProjectCheckTime, setLastProjectCheckTime] = useState(
    localStorage.getItem('lastProjectCheckTime') ? new Date(localStorage.getItem('lastProjectCheckTime')) : null
  )

  const [recommendations, setRecommendations] = useState({ existingMatches: [], aiIdeas: [] })
  const [loadingRec, setLoadingRec] = useState(false)
  const [recMessage, setRecMessage] = useState('')

  useEffect(() => {
    if (user?.role === 'student') {
      projectService.getMyApplications().then(setData)
    } else if (user?.role === 'supervisor') {
      const fetchProjectsAndApplications = async () => {
        const myProjects = await projectService.getMyProjects()
        setData(myProjects)
        
        // Count total applications across all projects
        let totalCount = 0
        for (const project of myProjects) {
          try {
            const applicants = await applicationService.getForProject(project._id)
            totalCount += (applicants || []).length
          } catch {
            // Continue if fetch fails for a project
          }
        }
        setPendingApplicationsCount(totalCount)
      }
      fetchProjectsAndApplications()
    }
  }, [user])

  const statusColor = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-600'
  }

  const domainBadge = (domain) => {
    return (
      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
        {domain || 'Other'}
      </span>
    )
  }

  const handleApply = async (projectId) => {
    const pitch = window.prompt('Enter a short pitch for this project (required):')
    if (!pitch || !String(pitch).trim()) return
    try {
      await projectService.applyToProject(projectId, pitch)
      alert('Applied successfully!')
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to apply')
    }
  }

  const handleGetRecommendations = async () => {
    setLoadingRec(true)
    setRecMessage('')
    try {
        const recs = await profileService.getRecommendations()
        setRecommendations({
          existingMatches: recs?.existingMatches || [],
          aiIdeas: recs?.aiIdeas || [],
        })

        const noExisting = !recs?.existingMatches || recs.existingMatches.length === 0
        const noIdeas = !recs?.aiIdeas || recs.aiIdeas.length === 0
        if (noExisting && noIdeas) {
          setRecMessage('No recommendations available right now.')
        }
    } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Could not get recommendations'
        alert(message)
    }
    setLoadingRec(false)
    }

  const handleCheckNewProjects = async () => {
    setCheckingProjects(true)
    try {
      // Fetch all projects
      const allProjects = await projectService.getAllProjects()
      const userDomain = user?.domain || ''
      
      // Only show projects posted AFTER last check time
      const recentMatching = (allProjects || []).filter(p => {
        const postDate = new Date(p.createdAt)
        const matchesDomain = !userDomain || p.domain === userDomain
        // If never checked, show last 24 hours. Otherwise, show only since last check
        const isNew = lastProjectCheckTime ? postDate > lastProjectCheckTime : postDate > new Date(Date.now() - 24 * 60 * 60 * 1000)
        return matchesDomain && isNew
      })
      
      // Update last check time to now
      const now = new Date()
      setLastProjectCheckTime(now)
      localStorage.setItem('lastProjectCheckTime', now.toISOString())
      setNewProjects(recentMatching)
      
      if (recentMatching.length === 0) {
        alert('No new projects since your last check!')
      }
    } catch (err) {
      console.error('Failed to check new projects:', err)
      alert('Failed to check for new projects')
    }
    setCheckingProjects(false)
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-700 hover:bg-gray-200 rounded-full transition"
            aria-label="Notifications"
          >
            {/* Bell Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            
            {/* Red Badge/Dot */}
            {user?.role === 'supervisor' && pendingApplicationsCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
                {pendingApplicationsCount}
              </span>
            )}
            {user?.role === 'student' && newProjects.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
                {newProjects.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {user?.role === 'supervisor' && (
                <div className="p-4">
                  {pendingApplicationsCount > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        📋 You have {pendingApplicationsCount} applicants
                      </p>
                      <button
                        onClick={() => {
                          navigate('/my-projects')
                          setShowNotifications(false)
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        View My Projects
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No new applicants</p>
                  )}
                </div>
              )}
              
              {user?.role === 'student' && (
                <div className="p-4">
                  <button
                    onClick={handleCheckNewProjects}
                    disabled={checkingProjects}
                    className="w-full mb-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {checkingProjects ? '🔄 Checking...' : '🔍 Check New Projects'}
                  </button>
                  
                  {newProjects.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        ✨ {newProjects.length} new projects posted!
                      </p>
                      <div className="max-h-64 overflow-y-auto">
                        {newProjects.map((proj) => (
                          <div key={proj._id} className="mb-2 p-2 bg-blue-50 rounded border border-blue-200 text-xs">
                            <p className="font-medium text-gray-900">{proj.title}</p>
                            <p className="text-gray-600">{proj.domain}</p>
                            <button
                              onClick={() => navigate(`/applicants/${proj._id}`)}
                              className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                            >
                              View →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No new projects. Click button to check!</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {user?.role === 'student' && (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-3">My Applications</h2>
          {data.length === 0 && <p className="text-gray-500 text-center">No applications yet</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data.map((app) => (
              <div key={app._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <p className="font-medium text-sm md:text-base">{app.project?.title}</p>
                <p className="text-xs md:text-sm text-gray-500">{app.project?.domain}</p>
                <div className="mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h2 className="text-base md:text-lg font-semibold mb-3">AI Project Recommendations</h2>
            <button
              onClick={handleGetRecommendations}
              className="mb-4 bg-purple-600 text-white px-3 md:px-4 py-2 rounded hover:bg-purple-700 text-sm md:text-base"
            >
              {loadingRec ? 'Consulting AI...' : 'Get AI Recommendations'}
            </button>
            {recMessage && <p className="text-xs md:text-sm text-gray-600 mb-3">{recMessage}</p>}

            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                <h3 className="text-sm md:text-base font-semibold text-gray-800">Matched Projects on Platform</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 w-fit">Based on posted projects</span>
              </div>
              {(recommendations.existingMatches || []).map((rec, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm md:text-base text-gray-900">{rec.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs md:text-sm">
                      {domainBadge(rec.domain)}
                      <span className="text-sm text-gray-700">{rec.supervisorName}</span>
                      <span className="text-sm text-gray-600">{rec.supervisorEmail}</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-700 mt-2 italic">{rec.reason}</p>
                  </div>
                  <button
                    onClick={() => handleApply(rec.projectId)}
                    className="rounded-md px-3 md:px-4 py-2 bg-green-600 text-white hover:bg-green-700 text-xs md:text-sm whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
              {(recommendations.existingMatches || []).length === 0 && (
                <p className="text-xs md:text-sm text-gray-500">No matched projects found.</p>
              )}
            </div>

            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                <h3 className="text-sm md:text-base font-semibold text-gray-800">AI Generated Ideas</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 w-fit">Pure AI suggestions</span>
              </div>
              {(recommendations.aiIdeas || []).map((idea, i) => (
                <div key={i} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 mb-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <p className="font-semibold text-sm md:text-base text-gray-900">{idea.title}</p>
                    {domainBadge(idea.domain)}
                  </div>
                  <p className="text-xs md:text-sm text-gray-700 mt-2">{idea.description}</p>
                </div>
              ))}
              {(recommendations.aiIdeas || []).length === 0 && (
                <p className="text-xs md:text-sm text-gray-500">No AI ideas generated.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'supervisor' && (
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-3">My Posted Projects</h2>
          {data.length === 0 && <p className="text-gray-500 text-center">No projects posted yet</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <p className="font-medium text-sm md:text-base">{p.title}</p>
                <p className="text-xs md:text-sm text-gray-500">{p.domain} — Team of {p.teamSize}</p>
                <p className="text-xs md:text-sm mt-1">Status: <span className="font-medium">{p.status}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <p className="text-sm md:text-base text-gray-600">Admin panel coming up in the next phase.</p>
      )}
    </div>
  )
}