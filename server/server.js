const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')

const connectdb = require('./config/db')

dotenv.config()

const app = express()

// Middleware
app.use(helmet())

const defaultOrigins = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'https://frontend-production-82a4.up.railway.app',
]
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean)

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins

app.use(cors({
	origin: (origin, callback) => {
		// Allow non-browser requests (curl/postman) with no Origin
		if (!origin) return callback(null, true)
		if (allowedOrigins.includes(origin)) return callback(null, true)
		return callback(new Error(`CORS blocked for origin: ${origin}`))
	},
	credentials: true,
}))
app.use(express.json())

// Basic health check (useful to distinguish "server down" vs "DB down")
app.get('/api/health', (req, res) => {
	res.json({
		ok: true,
		port: Number(process.env.PORT || 5000),
		dbReady: mongoose.connection.readyState === 1,
	})
})

// If DB isn't connected, return 503 for API routes (instead of crashing & causing ERR_CONNECTION_REFUSED)
app.use('/api', (req, res, next) => {
	if (req.path === '/health') return next()
	if (mongoose.connection.readyState === 1) return next()
	return res.status(503).json({ message: 'Database not connected' })
})


//auth routues
const authRoutes = require('./routes/authRoutes')
app.use('/api/auth', authRoutes)

//app routes..project roujtes
const projectRoutes = require('./routes/projectRoutes')
const applicationRoutes = require('./routes/applicationRoutes')

app.use('/api/projects', projectRoutes)
app.use('/api/applications', applicationRoutes)

//profile api
const profileRoutes = require('./routes/profileRoutes')
app.use('/api/profile', profileRoutes)

//blog rotes
const blogRoutes = require('./routes/blogRoutes')
app.use('/api/blog', blogRoutes)

//contact
const contactRoutes = require('./routes/contactRoutes')
app.use('/api/contact', contactRoutes)


//admin things routes for those things
const adminRoutes = require('./routes/adminRoutes')
app.use('/api/admin', adminRoutes)

//groups
const groupRoutes = require('./routes/groupRoutes')
app.use('/api/groups', groupRoutes)

// users (student search for typeahead)
const userRoutes = require('./routes/userRoutes')
app.use('/api/users', userRoutes)


const PORT = process.env.PORT || 5000

const start = async () => {
	const result = await connectdb()
	if (!result?.connected) {
		console.warn('Starting API without a DB connection (requests will return 503 until MongoDB connects).')
	}
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start()