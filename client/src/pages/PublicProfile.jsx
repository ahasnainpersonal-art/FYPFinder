import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import profileService from '../services/profileService'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loadedUserId: null, profile: null, error: '' })

  useEffect(() => {
    profileService
      .getPublicProfile(userId)
      .then((data) => {
        setState({ loadedUserId: userId, profile: data, error: '' })
      })
      .catch(() => setState({ loadedUserId: userId, profile: null, error: 'Failed to load profile.' }))
  }, [userId])

  const isLoading = state.loadedUserId !== userId

  if (isLoading) {
    return <p className="text-gray-600">Loading profile...</p>
  }

  if (state.error || !state.profile) {
    return (
      <div>
        <p className="text-red-600 text-sm">{state.error || 'Failed to load profile.'}</p>
        <button
          className="mt-3 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    )
  }

  const profile = state.profile

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm">No photo</span>
            )}
          </div>

          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-600">{profile.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{profile.role}</span>
              {profile.cgpa ? (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">CGPA: {profile.cgpa}</span>
              ) : null}
              {profile.preferredDomain ? (
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">{profile.preferredDomain}</span>
              ) : null}
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Bio</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {profile.skills?.length ? (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">{s}</span>
              ))}
            </div>
          </div>
        ) : null}

        {profile.github && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">GitHub</p>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {profile.github}
            </a>
          </div>
        )}

        {profile.researchInterests && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Research Interests</p>
            <p className="text-sm text-gray-700">{profile.researchInterests}</p>
          </div>
        )}
      </div>
    </div>
  )
}
