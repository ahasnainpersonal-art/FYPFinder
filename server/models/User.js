const mongoose =require('mongoose')
const bcrypt=   require('bcryptjs')


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },  
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{


        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['student','supervisor','admin'],
        default:'student'
    },
    skills: { type: String, default: '' },
    interests: { type: String, default: '' },
    preferredDomain: { type: String, default: 'any' },
    github: { type: String, default: '' },
    bio: { type: String, default: '' },
    cgpa: {
        type: String,
        enum: ['2.0-2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0'],
        default: '3.0-3.5'
    },
    photo: { type: String, default: '' },
    researchInterests: { type: String, default: '' },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null,
    }
},{
    timestamps:true
})  
//pass hashing 
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 10)
})

// comsparsion when login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)