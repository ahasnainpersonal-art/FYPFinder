import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import projectService from '../services/projectService'
import applicationService from '../services/applicationService'

export default function Applicants() {
  const { projectId } = useParams()
  const [applicants, setApplicants] = useState([])
  const [mode, setMode] = useState('standard') // standard | industrial

  useEffect(() => {
    applicationService
      .getIndustrialForProject(projectId)
      .then((data) => {
        setApplicants(Array.isArray(data) ? data : [])
        setMode('industrial')
      })
      .catch(() => {
        projectService.getApplicants(projectId).then((data) => {
          setApplicants(Array.isArray(data) ? data : [])
          setMode('standard')
        }).catch(() => setApplicants([]))
      })
  }, [projectId])

  const handleStatus = async (appId, status) => {
    try {
      await projectService.updateStatus(appId, status)
      setApplicants(applicants.map(a =>
        a._id === appId ? { ...a, status } : a
      ))
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDownloadProposalPDF = (application) => {
    if (!application.proposalPDF) {
      alert('No PDF proposal available for this application')
      return
    }

    const linkSource = `data:application/pdf;base64,${application.proposalPDF}`
    const downloadLink = document.createElement('a')
    downloadLink.href = linkSource
    
    // Create a meaningful filename
    const groupLeaderName = application.group?.leader?.name || 'Group'
    const projectTitle = application.project?.title || application.proposedTitle || 'Proposal'
    downloadLink.download = `proposal_${groupLeaderName}_${projectTitle}.pdf`
    
    downloadLink.click()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Applicants</h1>
      {mode === 'industrial' && (
        <p className="text-sm text-gray-600 mb-4">Industrial Compare View (sorted by average CGPA)</p>
      )}
      {applicants.length === 0 && <p className="text-gray-500 text-center">No applicants yet</p>}
      {applicants.map((app) => (
        <div key={app._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Group Application</p>
              {mode === 'industrial' && typeof app.groupAvgCgpa === 'number' && (
                <p className="text-sm text-gray-700 mt-1">Average CGPA: <span className="font-semibold">{app.groupAvgCgpa}</span></p>
              )}

              <p className="text-sm text-gray-700 mt-3 font-semibold">Members</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {(app.group?.members || []).map((m) => (
                  <div key={m._id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      {String(m._id) === String(app.group?.leader?._id) && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Leader</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{m.email}</p>
                    {m.cgpa && <p className="text-xs text-gray-600 mt-1">CGPA: {m.cgpa}</p>}
                    {m.github && (
                      <a className="text-xs text-blue-600 hover:underline" href={m.github} target="_blank" rel="noreferrer">GitHub</a>
                    )}
                    {m.bio && <p className="text-xs text-gray-700 mt-2">{String(m.bio).slice(0, 140)}{String(m.bio).length > 140 ? '…' : ''}</p>}
                  </div>
                ))}
              </div>

              {app.pitch && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Pitch</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.pitch}</p>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-semibold ${
                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {app.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button onClick={() => handleStatus(app._id, 'approved')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm">
              Approve
            </button>
            <button onClick={() => handleStatus(app._id, 'rejected')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm">
              Reject
            </button>
            {app.proposalPDF && (
              <button onClick={() => handleDownloadProposalPDF(app)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm">
                Download Proposal PDF
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}