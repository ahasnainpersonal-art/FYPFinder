import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BrowseProjects from './pages/browseProjects'
import PostProject from './pages/PostProject'
import MyApplications from './pages/MyApplications'
import MyProjects from './pages/MyProjects'
import Applicants from './pages/Applicants'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Blog from './pages/Blog'
import CashFlow from './pages/CashFlow'
import Landing from './pages/Landing'
import Contact from './pages/Contact'
import Analytics from './pages/Analytics'

function App() {
  const { user } = useSelector((state) => state.auth)
  const wrap = (component) => user ? <Layout>{component}</Layout> : <Navigate to="/login" />
  const wrapPublicOrPrivate = (component) => user ? <Layout>{component}</Layout> : component

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={wrap(<Dashboard />)} />
        <Route path="/projects" element={wrap(<BrowseProjects />)} />
        <Route path="/post-project" element={wrap(<PostProject />)} />
        <Route path="/my-applications" element={wrap(<MyApplications />)} />
        <Route path="/my-projects" element={wrap(<MyProjects />)} />
        <Route path="/applicants/:projectId" element={wrap(<Applicants />)} />
        <Route path="/profile" element={wrap(<Profile />)} />
        <Route path="/profile/:userId" element={wrapPublicOrPrivate(<PublicProfile />)} />
        <Route path="/blog" element={wrapPublicOrPrivate(<Blog />)} />
        <Route path="/contact" element={wrapPublicOrPrivate(<Contact />)} />
        <Route path="/analytics" element={wrap(<Analytics />)} />
        <Route path="/cashflow" element={wrap(<CashFlow />)} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App