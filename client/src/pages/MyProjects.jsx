import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import projectService from '../services/projectService'
import applicationService from '../services/applicationService'

export default function MyProjects() {
  const [projects, setProjects] = useState([])
  const [applicantCounts, setApplicantCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProjectsAndApplicants = async () => {
      try {
        const myProjects = await projectService.getMyProjects()
        setProjects(myProjects)
        
        // Fetch applicant counts for each project
        const counts = {}
        for (const project of myProjects) {
          try {
            const applicants = await applicationService.getForProject(project._id)
            counts[project._id] = (applicants || []).length
          } catch {
            counts[project._id] = 0
          }
        }
        setApplicantCounts(counts)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjectsAndApplicants()
  }, [])

  return (
    <div>
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-6">My Projects</h1>
      {loading && <p className="text-gray-500 text-center">Loading projects...</p>}
      {!loading && projects.length === 0 && <p className="text-gray-500 text-center">No projects posted yet</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition relative">
            {/* Red badge for projects with applicants */}
            {applicantCounts[p._id] > 0 && (
              <div className="absolute top-3 right-3 flex items-center justify-center">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
                  {applicantCounts[p._id]}
                </span>
              </div>
            )}
            
            <p className="font-medium text-sm md:text-base pr-8">{p.title}</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">{p.domain} — Team of {p.teamSize}</p>
            <p className="text-xs md:text-sm mt-2">Status: <span className="font-medium">{p.status}</span></p>
            
            <button
              onClick={() => navigate(`/applicants/${p._id}`)}
              className="mt-4 w-full rounded-md px-3 md:px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 transition text-xs md:text-sm"
            >
              View Applicants ({applicantCounts[p._id] || 0})
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}