const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  course: {
    type: String,
    required: [true, 'Course interest is required'],
    enum: [
      'After 10th',
      '10th Direct Admission',
      'After 12th - Science',
      'After 12th - Commerce',
      'After 12th - Arts',
      '12th Direct Admission',
      'Undergraduate Programs',
      'Postgraduate Programs',
      'Professional Courses',
      'Study Abroad',
      'Career Counseling',
      'Other'
    ]
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Converted', 'Not Interested'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: 'Website'
  }
}, { timestamps: true });

// Index for faster queries
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ email: 1 });
enquirySchema.index({ phone: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
