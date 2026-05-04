import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'

import { API_BASE } from '../config/api'

const TAGS = ['All', 'Tips', 'Experience', 'Announcement', 'News']

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  return { headers: { Authorization: `Bearer ${user?.token}` } }
}

const roleBadge = (role) => {
  if (role === 'admin') return 'bg-blue-100 text-blue-700'
  if (role === 'supervisor') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-700'
}

export default function Blog() {
  const { user } = useSelector((state) => state.auth)
  const [posts, setPosts] = useState([])
  const [selectedTag, setSelectedTag] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [form, setForm] = useState({ title: '', content: '', tag: 'Tips' })

  useEffect(() => {
    axios.get(`${API_BASE}/api/blog`).then((res) => setPosts(res.data))
  }, [])

  const filtered = useMemo(() => {
    return posts.filter((p) => selectedTag === 'All' || p.tag === selectedTag)
  }, [posts, selectedTag])

  const handleCreate = async (e) => {
    e.preventDefault()
    const res = await axios.post(`${API_BASE}/api/blog`, form, getAuthHeader())
    setPosts([res.data, ...posts])
    setForm({ title: '', content: '', tag: 'Tips' })
  }

  const handleToggleLike = async (postId) => {
    const res = await axios.post(`${API_BASE}/api/blog/${postId}/like`, {}, getAuthHeader())
    setPosts(posts.map((p) => (p._id === postId ? res.data : p)))
  }

  const handleAddComment = async (postId) => {
    const text = commentDrafts[postId]
    if (!text) return
    const res = await axios.post(`${API_BASE}/api/blog/${postId}/comment`, { text }, getAuthHeader())
    setPosts(posts.map((p) => (p._id === postId ? res.data : p)))
    setCommentDrafts({ ...commentDrafts, [postId]: '' })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Blog</h1>

      {user && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition mb-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">Write a Post</h2>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            required
          />
          <select
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          >
            <option value="Tips">Tips</option>
            <option value="Experience">Experience</option>
            <option value="Announcement">Announcement</option>
            <option value="News">News</option>
          </select>
          <textarea
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            rows={4}
            required
          ></textarea>
          <button type="submit" className="rounded-md px-4 py-2 bg-blue-700 text-white hover:bg-blue-800">
            Publish
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`rounded-md px-4 py-2 text-sm ${selectedTag === t ? 'bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-gray-500">No posts yet.</p>}

      <div className="space-y-4">
        {filtered.map((p) => {
          const preview = String(p.content || '').slice(0, 150)
          const showMore = String(p.content || '').length > 150
          const isExpanded = expandedId === p._id
          const liked = user?._id && Array.isArray(p.likedBy) && p.likedBy.some((id) => String(id) === String(user._id))

          return (
            <div
              key={p._id}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : p._id)}
                    className="text-left w-full"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500">By {p.author?.name}</span>
                      <span className={`px-2 py-1 rounded-full ${roleBadge(p.author?.role)}`}>{p.author?.role || 'user'}</span>
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">{p.tag}</span>
                    </div>
                    {!isExpanded && (
                      <p className="text-sm text-gray-700 mt-3">{preview}{showMore ? '…' : ''}</p>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.content}</p>

                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Comments ({p.comments?.length || 0})</p>
                        <div className="space-y-2">
                          {(p.comments || []).map((c, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-md p-3">
                              <p className="text-xs text-gray-500 mb-1">{c.name}</p>
                              <p className="text-sm text-gray-700">{c.text}</p>
                            </div>
                          ))}
                          {(p.comments || []).length === 0 && (
                            <p className="text-sm text-gray-500">No comments yet.</p>
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <input
                            value={commentDrafts[p._id] || ''}
                            onChange={(e) => setCommentDrafts({ ...commentDrafts, [p._id]: e.target.value })}
                            placeholder="Write a comment..."
                            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                          <button
                            onClick={() => handleAddComment(p._id)}
                            className="rounded-md px-4 py-2 bg-blue-700 text-white hover:bg-blue-800"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-sm">
                  <button
                    onClick={() => handleToggleLike(p._id)}
                    className="rounded-md px-3 py-2 bg-white border border-gray-300 hover:bg-gray-100"
                    title={liked ? 'Unlike' : 'Like'}
                  >
                    <span className="mr-2">{liked ? '♥' : '♡'}</span>
                    {p.likes || 0}
                  </button>
                  <span className="text-xs text-gray-500">Comments: {p.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}