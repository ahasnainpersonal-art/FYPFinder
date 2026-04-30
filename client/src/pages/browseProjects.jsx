import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import projectService from '../services/projectService'
import profileService from '../services/profileService'
import applicationService from '../services/applicationService'

export default function BrowseProjects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('All')
  const [pitchDrafts, setPitchDrafts] = useState({})
  const [proposalDrafts, setProposalDrafts] = useState({})
  const [proposalLoading, setProposalLoading] = useState({})
  const [group, setGroup] = useState(null)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    projectService.getAllProjects().then(setProjects)
  }, [])

  useEffect(() => {
    if (user?.role === 'student') {
      profileService.getMyGroup().then(setGroup).catch(() => setGroup(null))
    }
  }, [user?.role])

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchDomain = domain === 'All' || p.domain === domain
    return matchSearch && matchDomain
  })

  const handleApply = async (projectId) => {
    const proposal = proposalDrafts[projectId]
    const pitch = String(pitchDrafts[projectId] || proposal?.whyThisGroup || '').trim()
    if (!pitch) {
      alert('Please add a short pitch (or generate a proposal) before applying.')
      return
    }
    try {
      await projectService.applyToProject(projectId, pitch, proposal)
      alert('Applied successfully!')
      setPitchDrafts((prev) => ({ ...prev, [projectId]: '' }))
      setProposalDrafts((prev) => {
        const next = { ...prev }
        delete next[projectId]
        return next
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply')
    }
  }

  const handleGenerateProposal = async (projectId) => {
    if (!group) {
      alert('Please create/join a group first (Profile → My Group).')
      return
    }
    if (String(group.leader?._id) !== String(user?._id)) {
      alert('Only the group leader can generate proposals and apply.')
      return
    }
    setProposalLoading((prev) => ({ ...prev, [projectId]: true }))
    try {
      const proposal = await applicationService.generateProposal(projectId)
      setProposalDrafts((prev) => ({
        ...prev,
        [projectId]: {
          projectUnderstanding: proposal?.projectUnderstanding || '',
          proposedApproach: proposal?.proposedApproach || '',
          relevantSkills: proposal?.relevantSkills || '',
          timeline: proposal?.timeline || '',
          whyThisGroup: proposal?.whyThisGroup || '',
          memberDetails: Array.isArray(proposal?.memberDetails) ? proposal.memberDetails : [],
        },
      }))

      setPitchDrafts((prev) => ({ ...prev, [projectId]: String(proposal?.whyThisGroup || '') }))
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to generate proposal')
    }
    setProposalLoading((prev) => ({ ...prev, [projectId]: false }))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Browse Projects</h1>
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Search by title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <select value={domain} onChange={(e) => setDomain(e.target.value)}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All</option>
          <option>AI</option>
          <option>Web</option>
          <option>Mobile</option>
          <option>Cybersecurity</option>
          <option>Other</option>
        </select>
      </div>
      <div className="grid gap-4">
        {filtered.length === 0 && <p className="text-gray-500 text-center">No projects found</p>}
        {filtered.map((p) => (
          <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="text-gray-600 text-sm mb-1">{p.description}</p>
            <p className="text-sm">Domain: <span className="font-medium">{p.domain}</span></p>
            <p className="text-sm">Supervisor: <span className="font-medium">{p.supervisor?.name}</span></p>
            <p className="text-sm mb-3">Team Size: {p.teamSize}</p>
            {user?.role === 'student' && (
              <div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateProposal(p._id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition text-sm"
                    disabled={!!proposalLoading[p._id]}
                  >
                    {proposalLoading[p._id] ? 'Generating…' : 'Generate Proposal with AI'}
                  </button>

                  <button
                    onClick={() => handleApply(p._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    Apply Now
                  </button>
                </div>

                {proposalDrafts[p._id] && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-3">Group Application / Proposal</p>

                    <div className="grid gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Project Understanding</p>
                        <textarea
                          rows={3}
                          value={proposalDrafts[p._id].projectUnderstanding}
                          onChange={(e) =>
                            setProposalDrafts((prev) => ({
                              ...prev,
                              [p._id]: { ...prev[p._id], projectUnderstanding: e.target.value },
                            }))
                          }
                          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Proposed Approach</p>
                        <textarea
                          rows={3}
                          value={proposalDrafts[p._id].proposedApproach}
                          onChange={(e) =>
                            setProposalDrafts((prev) => ({
                              ...prev,
                              [p._id]: { ...prev[p._id], proposedApproach: e.target.value },
                            }))
                          }
                          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Relevant Skills</p>
                        <textarea
                          rows={3}
                          value={proposalDrafts[p._id].relevantSkills}
                          onChange={(e) =>
                            setProposalDrafts((prev) => ({
                              ...prev,
                              [p._id]: { ...prev[p._id], relevantSkills: e.target.value },
                            }))
                          }
                          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Timeline</p>
                        <textarea
                          rows={3}
                          value={proposalDrafts[p._id].timeline}
                          onChange={(e) =>
                            setProposalDrafts((prev) => ({
                              ...prev,
                              [p._id]: { ...prev[p._id], timeline: e.target.value },
                            }))
                          }
                          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Why This Group</p>
                        <textarea
                          rows={3}
                          value={proposalDrafts[p._id].whyThisGroup}
                          onChange={(e) => {
                            const value = e.target.value
                            setProposalDrafts((prev) => ({
                              ...prev,
                              [p._id]: { ...prev[p._id], whyThisGroup: value },
                            }))
                            setPitchDrafts((prev) => ({ ...prev, [p._id]: value }))
                          }}
                          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Member Details (auto-filled from profiles)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(proposalDrafts[p._id].memberDetails || []).map((m, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-md p-3">
                              <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                              <p className="text-xs text-gray-600">CGPA: {m.cgpa || '—'}</p>
                              <p className="text-xs text-gray-600 mt-1">Skills: {m.skills || '—'}</p>
                              {m.github ? (
                                <a className="text-xs text-blue-600 hover:underline" href={m.github} target="_blank" rel="noreferrer">GitHub</a>
                              ) : (
                                <p className="text-xs text-gray-500">GitHub: —</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <textarea
                    rows={2}
                    value={pitchDrafts[p._id] || ''}
                    onChange={(e) => setPitchDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))}
                    placeholder="Pitch (sent with application)"
                    className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}&title=${encodeURIComponent(p.title)}`
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Share on LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://wa.me/?text=${encodeURIComponent(`Check out this FYP project: ${p.title} - ${window.location.href}`)}`
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                    className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                  >
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}