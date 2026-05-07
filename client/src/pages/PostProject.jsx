import { useState } from 'react'
import projectService from '../services/projectService'

export default function PostProject() {
  const [form, setForm] = useState({ title: '', description: '', domain: 'Web', teamSize: 2, type: 'listed' })

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value }
    if (e.target.name === 'type' && e.target.value === 'industrial') {
      next.teamSize = 3
    }
    setForm(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await projectService.createProject(form)
      alert('Project posted!')
      setForm({ title: '', description: '', domain: 'Web', teamSize: 2, type: 'listed' })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post project')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Post a Project</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition space-y-4">
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        >
          <option value="listed">Listed</option>
          <option value="industrial">Industrial</option>
        </select>

        <input name="title" placeholder="Title" value={form.title}
          onChange={handleChange} className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" required />
        <textarea name="description" placeholder="Description" value={form.description}
          onChange={handleChange} className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" rows={4} required />
        <select name="domain" value={form.domain}
          onChange={handleChange} className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
          <option>AI</option>
          <option>Web</option>
          <option>Mobile</option>
          <option>Cybersecurity</option>
          <option>Other</option>
        </select>
        <input name="teamSize" type="number" placeholder="Team Size" value={form.teamSize}
          onChange={handleChange} disabled={form.type === 'industrial'}
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full disabled:bg-gray-100" />
        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm">
          Post Project
        </button>
      </form>
    </div>
  )
}
