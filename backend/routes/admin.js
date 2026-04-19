const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [totalLeads, pendingLeads, contactedLeads, convertedLeads, totalUsers, todayLeads] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'Pending' }),
      Enquiry.countDocuments({ status: 'Contacted' }),
      Enquiry.countDocuments({ status: 'Converted' }),
      User.countDocuments({ role: 'student' }),
      Enquiry.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    // Course-wise breakdown
    const courseStats = await Enquiry.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent 5 leads
    const recentLeads = await Enquiry.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: { totalLeads, pendingLeads, contactedLeads, convertedLeads, totalUsers, todayLeads },
      courseStats,
      recentLeads
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/enquiries
// @desc    Get all enquiries with filters
// @access  Admin
router.get('/enquiries', async (req, res) => {
  try {
    const { status, course, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (course && course !== 'All') query.course = course;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      enquiries,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/admin/enquiries/:id/status
// @desc    Update enquiry status
// @access  Admin
router.patch('/enquiries/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['Pending', 'Contacted', 'Converted', 'Not Interested'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status, ...(notes && { notes }) },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, message: 'Status updated', enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/admin/enquiries/:id
// @desc    Delete enquiry
// @access  Admin
router.delete('/enquiries/:id', async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/enquiries/export/csv
// @desc    Export enquiries as CSV
// @access  Admin
router.get('/enquiries/export/csv', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    const csvHeader = 'Name,Phone,Email,Course,Status,Message,Date\n';
    const csvRows = enquiries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString('en-IN');
      const message = (e.message || '').replace(/,/g, ';').replace(/\n/g, ' ');
      return `"${e.name}","${e.phone}","${e.email}","${e.course}","${e.status}","${message}","${date}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ambipath-leads-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all registered students
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// @route   GET /api/admin/users/export/csv
// @desc    Export registered users as CSV
// @access  Admin
router.get('/users/export/csv', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ createdAt: -1 });

    const csvHeader = 'Name,Email,Phone,City,Stream,Education,Joined,Last Login\n';
    const csvRows = users.map(u => {
      const date = new Date(u.createdAt).toLocaleDateString('en-IN');
      const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN').replace(/,/g, '') : 'N/A';
      const city = (u.city || '').replace(/,/g, ';');
      return `"${u.name}","${u.email}","${u.phone || ''}","${city}","${u.stream || ''}","${u.education || ''}","${date}","${lastLogin}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ambipath-users-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// @route   GET /api/admin/logins
// @desc    Get users sorted by recent login activity
// @access  Admin
router.get('/logins', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'student', lastLogin: { $exists: true, $ne: null } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ lastLogin: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
