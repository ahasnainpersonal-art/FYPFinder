const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')

const connectdb = require('./config/db')

dotenv.config()

connectdb()

const app = express()

// Middleware
app.use(helmet())

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
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


const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))