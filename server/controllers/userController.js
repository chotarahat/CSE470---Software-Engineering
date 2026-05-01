const jwt = require('jsonwebtoken');
const User = require('../models/User');
const speakeasy=require('speakeasy');
const qrcode=require('qrcode');
const { logEvent } = require('../utils/logger');

const generateMFA=async (req,res)=>{
  try{
    const user=await User.findById(req.user._id);
    const secret= speakeasy.generateSecret({
      name:`Ventify (${user.email})`
    });
    user.twoFactorSecret=secret.base32;
    await user.save();
    
    qrcode.toDateURL(secret.otpauth_url,(err,date_url)=>{
      
      if (err) return res.status(500).json({message:"Error genarating QR code"});
      res.json({qrCodeUrl:date_url,secret: secret.base32});
    });
  }catch (error){
    res.status(500).json({message: error.message});
  }
};

const enableMFA = async (req,res) =>{
  try{
    const {token}=req.body;
    const user=await User.findById(req.user._id).secret('+twoFactorSecret');

    const verified=speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding:'base32',
      token:token
    });
    if (verified){
      user.isMFAEnabled=true;
      await user.save();
      await logEvent({ user: user._id, action: '2FA_ENABLED', status: 'SUCCESS', details: { email: user.email } });
      res.json({message:"MFA successfully enabled"});
    }else{
      await logEvent({ user: user._id, action: '2FA_ENABLED', status: 'FAILURE', details: { email: user.email } });
      res.status(400).json({message:"Invalid code. Try Again."});
    }
  } catch(error){
    res.status(500).json({message: error.message});
  }
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Only allow student self-registration; counselors/admins created by admin
    const allowedRole = role === 'counselor' || role === 'admin' ? 'student' : (role || 'student');

    const user = await User.create({ name, email, password, role: allowedRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');;
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if(['counselor','admin'].includes(user.role) && user.isMFAEnabled){
      return res.json({
        mfaRequired:true,
        userId:user._id,
        message:'2FA token required'
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      availability: user.availability,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const verifyMFALogin=async(req,res)=>{
  try{
    const{userID,token}=req.body;
    const user=await User.findById(userID).select('+twoFactorSecret');
    const verified=speakeasy.totp.verify({
      secret:user.twoFactorSecret,
      encoding:'base32',
      token:token
    });
    if (!verified){
      return res.status(400).json({message: "Invalid 2FA code"});
    }
    res.json({
      _id:user._id,
      name:user.name,
      email:user.email,
      role:user.role,
      token:generateToken(user._id),
    });
  }catch (error){
    res.status(500).json({message:error.message});
  }
  
};

// POST /api/users/reset-password (Project shortcut: Direct reset without email link)
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // 1. Find the user by their email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });

    // 2. Update the password (your User.js pre-save hook will automatically hash this!)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

// GET /api/users/counselors  (admin only)
const getAllCounselors = async (req, res) => {
  try {
    const counselors = await User.find({ role: 'counselor' }).select('-password').populate('assignedTickets', 'ticketId status');
    res.json(counselors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/counselors  (admin creates a counselor)
const createCounselor = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const counselor = await User.create({ name, email, password, role: 'counselor' });
    await logEvent({ 
      user: req.user._id, 
      action: 'COUNSELOR_CREATED', 
      status: 'SUCCESS', 
      details: { newCounselorEmail: email } 
    });
    res.status(201).json({
      _id: counselor._id,
      name: counselor.name,
      email: counselor.email,
      role: counselor.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/availability  (counselor toggles own availability)
const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.availability = !user.availability;
    await user.save();
    await logEvent({ 
      user: user._id, 
      action: 'SHIFT_TOGGLED', 
      status: 'SUCCESS', 
      details: { isNowAvailable: user.availability } 
    });
    res.json({ availability: user.availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, getAllCounselors, createCounselor, toggleAvailability,verifyMFALogin , generateMFA, enableMFA, resetPassword };