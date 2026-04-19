# 🎓 Ambipath Admissions & Career Counseling Platform

A complete full-stack web platform for managing student admissions, career counseling, and lead generation.

---

## 📁 Project Structure

```
ambipath/
├── backend/              ← Node.js + Express API
│   ├── models/
│   │   ├── User.js       ← Student user model
│   │   └── Enquiry.js    ← Lead/enquiry model
│   ├── routes/
│   │   ├── auth.js       ← Register, Login APIs
│   │   ├── enquiry.js    ← Enquiry submission API
│   │   └── admin.js      ← Admin dashboard APIs
│   ├── middleware/
│   │   └── auth.js       ← JWT auth middleware
│   ├── server.js         ← Main Express server
│   ├── package.json
│   └── .env.example      ← Environment variables template
│
└── frontend/
    └── index.html        ← Complete single-file React-less frontend
```

---

## 🚀 Setup Instructions

### Step 1: Setup MongoDB Atlas (Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write access
4. Whitelist your IP (or use 0.0.0.0/0 for all IPs)
5. Get your connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### Step 2: Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your actual values:
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/ambipath
JWT_SECRET=your_random_secret_key_here
ADMIN_EMAIL=ambipath.counseling@gmail.com
ADMIN_PASSWORD=Admin@Ambipath2024
EMAIL_USER=ambipath.counseling@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Setting up Gmail for Email Notifications:
1. Go to your Google Account → Security → 2-Step Verification (enable it)
2. Then go to Security → App Passwords
3. Create an App Password for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

```bash
npm run dev    # Development (with hot reload)
npm start      # Production
```

### Step 3: Open Frontend

Simply open `frontend/index.html` in your browser, OR:
- Use VS Code Live Server extension
- Use `python3 -m http.server 3000` in the frontend folder

---

## 🔐 Default Admin Login

```
Email:    ambipath.counseling@gmail.com
Password: Admin@Ambipath2024
```

(Change this in your .env file for security!)

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login (student or admin) |
| GET | `/api/auth/me` | Get current user (requires token) |

### Enquiry
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enquiry` | Submit new enquiry |
| GET | `/api/enquiry/my` | Get user's own enquiries |

### Admin (requires admin token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/enquiries` | All enquiries (with filters) |
| PATCH | `/api/admin/enquiries/:id/status` | Update status |
| DELETE | `/api/admin/enquiries/:id` | Delete lead |
| GET | `/api/admin/enquiries/export/csv` | Export as CSV |
| GET | `/api/admin/users` | All registered users |

---

## 🌐 Deployment

### Deploy Backend to Railway (Free)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub and push the backend folder
3. Add all environment variables in Railway dashboard
4. Your backend will be live at `https://your-app.railway.app`

### Deploy Backend to Render (Free)
1. Go to [render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables

### Deploy Frontend to Netlify (Free)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `frontend` folder
3. Update `API_BASE` in `index.html` to your deployed backend URL

### Deploy Frontend to GitHub Pages (Free)
1. Create a GitHub repo
2. Upload the `frontend/index.html` as `index.html`
3. Enable GitHub Pages in repo settings

---

## ✨ Features

### Student Features
- 🏠 Home page with hero section, services, course categories
- 📚 Complete courses explorer (10th, 12th, UG, PG, Study Abroad)
- 🎯 Career guidance with stream selector and aptitude quiz
- 📝 Enquiry form with instant submission
- 🔐 Register and login system
- 📞 Contact page with WhatsApp integration

### Admin Features
- 📊 Dashboard with live stats (total leads, pending, converted)
- 📋 Leads management table with search, filter by status/course
- ✏️ Update enquiry status (Pending → Contacted → Converted)
- 🗑️ Delete leads
- 📥 Export all leads as CSV
- 👥 View all registered students

### Technical Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 req/15 min)
- CORS configured
- Helmet security headers
- Email notifications on new enquiry (admin + auto-reply to student)
- WhatsApp click-to-chat button
- Fully responsive mobile-first design
- Form validation (frontend + backend)

---

## 🎨 Branding

- **Name:** Ambipath Admissions & Career Counseling
- **Tagline:** Career Guidance & Admissions Support
- **Phone:** 7408285931
- **Email:** ambipath.counseling@gmail.com
- **Instagram:** https://www.instagram.com/ambipath.education
- **Colors:** Blue (#1a56db) + White + Gold (#f59e0b)

---

## 📞 Support

For any issues, contact: ambipath.counseling@gmail.com

© 2024 Ambipath Admissions & Career Counseling
