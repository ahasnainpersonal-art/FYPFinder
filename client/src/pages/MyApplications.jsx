import { useEffect, useState } from 'react'
import projectService from '../services/projectService'

export default function MyApplications() {
  const [applications, setApplications] = useState([])

  useEffect(() => {
    projectService.getMyApplications().then(setApplications)
  }, [])

  const statusColor = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700'
    if (status === 'rejected') return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h1>
      {applications.length === 0 && <p className="text-gray-500 text-center">You haven't applied to any projects yet</p>}
      {applications.map((app) => (
        <div key={app._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-3">
          <p className="font-medium">{app.project?.title}</p>
          <p className="text-sm text-gray-500 mb-2">{app.project?.domain}</p>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor(app.status)}`}>
            {app.status}
          </span>

          {app.group?.members?.length ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700">Group Members</p>
              <p className="text-sm text-gray-700">
                {app.group.members.map((m) => m.name).join(', ')}
              </p>
            </div>
          ) : null}

          {app.pitch ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-700">Pitch</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.pitch}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}