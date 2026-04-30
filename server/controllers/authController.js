const User = require('../models/User')
const genToken = require('../utils/generateToken')

// POST /api/auth/register
const regUser = async (req, res) =>  {
  const { name, email, password, role } = req.body



  const userExists = await User.findOne({ email })
  if (userExists ) {

    return res.status(400).json({ message: 'Email already registered' })
  }

  const user = await User.create({ name, email, password, role })

  //to give jwt token to client/frontend
  res.status(201).json({

    _id: user._id,
    name: user.name,
    email: user.email,

    role: user.role,
    group: user.group || null,
    token: genToken(user._id, user.role)
  })
}

// POST /api/auth/login
const loginUser = async (req, res) => {
  const { email,  password } = req.body

  const user = await User.findOne({ email })
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    group: user.group || null,
    token: genToken(user._id, user.role)
  })
}

module.exports = { regUser, loginUser }