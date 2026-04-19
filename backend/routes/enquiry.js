
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Enquiry = require('../models/Enquiry');
const { protect } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Enquiry API working 🚀"
  });
});

// Email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};



// Send notification emails
const sendNotificationEmails = async (enquiry) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    // Admin notification
    await transporter.sendMail({
      from: `"Ambipath Website" <${process.env.EMAIL_USER}>`,
      to: 'ambipath.counseling@gmail.com',
      subject: `🎓 New Enquiry from ${enquiry.name} - ${enquiry.course}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a56db; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">📩 New Admission Enquiry</h2>
            <p style="margin: 5px 0 0;">Ambipath Admissions & Career Counseling</p>
          </div>
          <div style="padding: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 35%;">Name:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${enquiry.name}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Phone:</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="tel:${enquiry.phone}">${enquiry.phone}</a></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${enquiry.email}">${enquiry.email}</a></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Course:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${enquiry.course}</td></tr>
              <tr><td style="padding: 10px; font-weight: bold; color: #555;">Message:</td><td style="padding: 10px;">${enquiry.message || 'No message'}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 6px; text-align: center;">
              <p style="margin: 0; color: #1a56db; font-weight: bold;">⚡ Contact this student within 24 hours for best conversion!</p>
            </div>
          </div>
        </div>
      `
    });

    // Student auto-response
    await transporter.sendMail({
      from: `"Ambipath Career Counseling" <${process.env.EMAIL_USER}>`,
      to: enquiry.email,
      subject: '✅ Your Enquiry Received - Ambipath Admissions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a56db; color: white; padding: 25px; text-align: center;">
            <h2 style="margin: 0;">Ambipath Admissions & Career Counseling</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Career Guidance & Admissions Support</p>
          </div>
          <div style="padding: 25px;">
            <h3 style="color: #1a56db;">Dear ${enquiry.name},</h3>
            <p>Thank you for reaching out to <strong>Ambipath Admissions & Career Counseling</strong>! We have received your enquiry for <strong>${enquiry.course}</strong>.</p>
            <p>Our expert counselors will contact you within <strong>24 hours</strong> to guide you through your career options.</p>
            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1a56db;">
              <h4 style="margin: 0 0 10px; color: #1a56db;">📞 Need immediate help?</h4>
              <p style="margin: 5px 0;">📱 Call/WhatsApp: <a href="tel:7408285931" style="color: #1a56db; font-weight: bold;">7408285931</a></p>
              <p style="margin: 5px 0;">📧 Email: <a href="mailto:ambipath.counseling@gmail.com" style="color: #1a56db;">ambipath.counseling@gmail.com</a></p>
              <p style="margin: 5px 0;">📸 Instagram: <a href="https://www.instagram.com/ambipath.education" style="color: #1a56db;">@ambipath.education</a></p>
            </div>
            <p style="color: #666; font-size: 14px;">We look forward to helping you find the perfect career path!</p>
          </div>
          <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 Ambipath Admissions & Career Counseling. All rights reserved.</p>
          </div>
        </div>
      `
    });
  } catch (emailErr) {
    console.error('Email notification failed (non-critical):', emailErr.message);
  }
};

// @route   POST /api/enquiry
// @desc    Submit new enquiry
// @access  Public
router.post('/', async (req, res) => {
  console.log("🔥 ENQUIRY HIT:", req.body);

  try {
    const { name, phone, email, course, message } = req.body;

    if (!name || !phone || !email || !course) {
      return res.status(400).json({ success: false, message: 'Name, phone, email and course are required' });
    }

    const enquiry = await Enquiry.create({ name, phone, email, course, message });
    console.log('✅ Enquiry saved to MongoDB:', enquiry._id);

    // Send emails in background (non-blocking)
    sendNotificationEmails(enquiry);

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Our counselor will contact you within 24 hours.',
      enquiryId: enquiry._id
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    console.error('❌ ENQUIRY ERROR:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @route   GET /api/enquiry/my
// @desc    Get user's own enquiries
// @access  Private (Student)
router.get('/my', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ email: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
