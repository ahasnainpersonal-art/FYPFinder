
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import projectService from '../services/projectService'

import profileService from '../services/profileService'

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const [data, setData] = useState([])

  const [recommendations, setRecommendations] = useState({ existingMatches: [], aiIdeas: [] })
  const [loadingRec, setLoadingRec] = useState(false)
  const [recMessage, setRecMessage] = useState('')

  useEffect(() => {
    if (user?.role === 'student') {
      projectService.getMyApplications().then(setData)
    } else if (user?.role === 'supervisor') {
      projectService.getMyProjects().then(setData)
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
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {user?.name}</h1>

      {user?.role === 'student' && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Applications</h2>
          {data.length === 0 && <p className="text-gray-500 text-center">No applications yet</p>}
          {data.map((app) => (
            <div key={app._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3">
              <p className="font-medium">{app.project?.title}</p>
              <p className="text-sm text-gray-500">{app.project?.domain}</p>
              <div className="mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">AI Project Recommendations</h2>
            <button
                onClick={handleGetRecommendations}
                className="mb-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
                {loadingRec ? 'Consulting AI...' : 'Get AI Recommendations'}
            </button>
            {recMessage && <p className="text-sm text-gray-600 mb-3">{recMessage}</p>}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-gray-800">Matched Projects on Platform</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Based on posted projects</span>
              </div>
              {(recommendations.existingMatches || []).map((rec, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{rec.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {domainBadge(rec.domain)}
                        <span className="text-sm text-gray-700">{rec.supervisorName}</span>
                        <span className="text-sm text-gray-600">{rec.supervisorEmail}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 italic">{rec.reason}</p>
                    </div>
                    <button
                      onClick={() => handleApply(rec.projectId)}
                      className="rounded-md px-4 py-2 bg-green-600 text-white hover:bg-green-700"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
              {(recommendations.existingMatches || []).length === 0 && (
                <p className="text-sm text-gray-500">No matched projects found.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-gray-800">AI Generated Ideas</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Pure AI suggestions — not posted on platform</span>
              </div>
              {(recommendations.aiIdeas || []).map((idea, i) => (
                <div key={i} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50 mb-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{idea.title}</p>
                    {domainBadge(idea.domain)}
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{idea.description}</p>
                </div>
              ))}
              {(recommendations.aiIdeas || []).length === 0 && (
                <p className="text-sm text-gray-500">No AI ideas generated.</p>
              )}
            </div>
            </div>
        </div>
      )}

      {user?.role === 'supervisor' && (
        <div>
          <h2 className="text-lg font-semibold mb-3">My Posted Projects</h2>
          {data.length === 0 && <p className="text-gray-500 text-center">No projects posted yet</p>}
          {data.map((p) => (
            <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3">
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-gray-500">{p.domain} — Team of {p.teamSize}</p>
              <p className="text-sm mt-1">Status: <span className="font-medium">{p.status}</span></p>
            </div>
          ))}
        </div>
      )}

      {user?.role === 'admin' && (
        <p className="text-gray-600">Admin panel coming up in the next phase.</p>
      )}
    </div>
  )
}