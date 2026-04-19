const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

const sendAdminAuthNotification = async (user, actionType) => {
  const transporter = createTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"Ambipath System" <${process.env.EMAIL_USER}>`,
      to: 'ambipath.counseling@gmail.com',
      subject: `🚨 User Activity: ${user.name} just ${actionType}!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: auto;">
          <h2 style="color: #1a56db; margin-top: 0;">User ${actionType}</h2>
          <p style="color: #555;">A user has just <strong>${actionType}</strong> on Ambipath.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%; color: #333;">Name:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${user.name}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${user.email}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Phone:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${user.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #333;">Time:</td><td style="padding: 10px; color: #555;">${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</td></tr>
          </table>
        </div>
      `
    });
  } catch (err) {
    console.error('Auth email notification failed:', err.message);
  }
};

// Helper: Generate JWT
const generateToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'ambipath_secret',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new student
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number';
      return res.status(400).json({ success: false, message: `${field} already registered` });
    }

    // Create user
    const user = await User.create({ name, email, phone, password });

    // Send email to admin asynchronously
    sendAdminAuthNotification(user, 'Registered');

    const token = generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Ambipath.',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user or admin
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'ambipath.counseling@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Ambipath2024';

    if (email === adminEmail && password === adminPassword) {
      const token = generateToken('admin', adminEmail, 'admin');
      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: { id: 'admin', name: 'Admin', email: adminEmail, role: 'admin' }
      });
    }

    // Find student user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Send email to admin asynchronously
    sendAdminAuthNotification(user, 'Logged In');

    const token = generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route   GET /api/auth/profile
// @desc    Get full profile of current user
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/auth/profile
// @desc    Update user profile (name, phone, bio, city, stream, education, avatar)
// @access  Private
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, phone, bio, city, stream, education, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (stream !== undefined) updateData.stream = stream;
    if (education !== undefined) updateData.education = education;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated successfully!', user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/auth/change-password
// @desc    Change user password
// @access  Private
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
