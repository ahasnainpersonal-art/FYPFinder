const mongoose = require('mongoose')

const redactMongoUri = (uri) => {
  try {
    const u = new URL(uri)
    if (u.username) u.username = '***'
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return '***'
  }
}

const connectdb = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set in the server environment')
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return { connected: true }
  } catch (error) {
    console.error('MongoDB connection failed.')
    console.error(`Reason: ${error?.message || 'Unknown error'}`)

    const name = String(error?.name || '')
    if (name.includes('ServerSelectionError') || name.includes('MongooseServerSelectionError')) {
      console.error('Common causes (MongoDB Atlas):')
      console.error('- Your IP is not whitelisted in Atlas → Network Access')
      console.error('- VPN / mobile hotspot changed your public IP')
      console.error('- Cluster is paused / not running')
      console.error('MONGO_URI (redacted):', redactMongoUri(process.env.MONGO_URI))
    }

    const exitOnFail =
      String(process.env.EXIT_ON_DB_FAIL || '').toLowerCase() === 'true' ||
      String(process.env.NODE_ENV || '').toLowerCase() === 'production'

    if (exitOnFail) {
      process.exit(1)
    }

    return { connected: false, error }
  }
}

module.exports = connectdb