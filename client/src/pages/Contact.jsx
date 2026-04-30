import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import contactService from '../services/contactService'

export default function Contact() {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [submissions, setSubmissions] = useState([])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await contactService.submit(form)
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    contactService.getAll().then((data) => setSubmissions(Array.isArray(data) ? data : [])).catch(() => setSubmissions([]))
  }, [user])

  return (
    <div>
      {!user && (
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              Register
            </button>
          </div>
        </nav>
      )}

      <div className={`max-w-3xl mx-auto ${user ? '' : 'p-6'}`}>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Contact</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit'}
          </button>

          {status === 'success' && (
            <p className="text-green-600 text-sm">Message sent successfully</p>
          )}
          {status === 'error' && (
            <p className="text-red-600 text-sm">Failed to submit. Try again.</p>
          )}
        </form>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Department Info</h2>
          <p className="text-sm text-gray-700">FAST-NUCES Lahore, Block B Faisal Town</p>
          <p className="text-sm text-gray-700">fast@nu.edu.pk</p>
          <p className="text-sm text-gray-700">+92-42-111-128-128</p>
        </div>

        {user?.role === 'admin' && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Submissions</h2>
            {submissions.length === 0 ? (
              <p className="text-sm text-gray-500">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => (
                  <div key={s._id} className="border border-gray-200 rounded-md p-3">
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{s.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <iframe
            title="FAST-NUCES Lahore"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.0!2d74.3297!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zRkFTVC1OVUNFUyBMYWhvcmU!5e0!3m2!1sen!2s!4v1!5m2!1sen!2s"
            className="w-full h-64 rounded-lg border"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}
