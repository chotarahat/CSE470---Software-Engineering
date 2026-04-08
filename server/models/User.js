const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'counselor', 'admin'],
    default: 'student',
  },
  twoFactorSecret: {
    type:String,
    select:false
  },
  isMFAEnabled:{
    type:Boolean,
    default:false
  },
  specialties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Category'
  }],
  shiftSchedule:{
    start:String,
    end:String
  },
  // Counselor-specific fields
  availability: {
    type: Boolean,
    default: true,
  },
  assignedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  // next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);