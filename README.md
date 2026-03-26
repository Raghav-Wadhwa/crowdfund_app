# CrowFund MERN - Crowdfunding Platform

A beautiful, full-stack crowdfunding application built with the MERN stack (MongoDB, Express, React, Node.js).

## ✨ Features

- 🔐 User authentication (Register/Login with JWT)
- 📝 Create and manage crowdfunding campaigns
- 💰 Make donations to campaigns
- 📊 Track campaign progress and donations
- 🎨 Beautiful, modern, responsive UI
- 🔒 Secure JWT-based authentication
- 📱 Mobile-friendly design

## 📁 Project Structure

```
crowfund_mern/
├── backend/              # Express.js API server
│   ├── models/           # MongoDB schemas (User, Campaign, Donation)
│   ├── routes/           # API routes (auth, campaigns, donations)
│   ├── middleware/       # Custom middleware (JWT auth)
│   └── server.js         # Entry point
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React Context (Auth)
│   │   ├── utils/        # API utilities
│   │   └── App.jsx       # Main app component
│   └── package.json
├── BACKEND_EXPLANATION.md      # Detailed backend guide
├── FRONTEND_SETUP.md           # Detailed frontend guide
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool (fast dev server)
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Modern icons

## 📦 Installation

### Prerequisites
- **Node.js** v20+ installed
- **MongoDB** (local or MongoDB Atlas account)
- **npm** or **yarn** package manager

### Step 1: Clone the Repository

```bash
cd /path/to/your/projects
# Repository is already at: /Users/raghavwadhwa/Desktop/MERN/crowfund_mern
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/crowfund
PORT=5001
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EOF

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5001`

### Step 3: Frontend Setup

```bash
# In a NEW terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5001/api" > .env

# Start frontend development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`
- Health Check: `http://localhost:5001/api/health`

## 📚 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user | Yes |

### Campaigns (`/api/campaigns.list`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all campaigns | No |
| GET | `/:id` | Get single campaign | No |
| POST | `/` | Create campaign | Yes |
| PUT | `/:id` | Update campaign | Yes (creator only) |
| DELETE | `/:id` | Delete campaign | Yes (creator only) |

### Donations (`/api/donations`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create donation | Yes |
| GET | `/campaign/:id` | Get campaign donations | No |
| GET | `/my-donations` | Get user's donations | Yes |

## 🔐 Authentication

Protected routes require JWT token in the Authorization header:

```bash
# Example with curl
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5001/api/auth/me
```

Frontend automatically adds token to requests via Axios interceptor.

## 📖 Detailed Documentation

- **[BACKEND_EXPLANATION.md](./BACKEND_EXPLANATION.md)** - Complete backend architecture guide
- **[FRONTEND_SETUP.md](./FRONTEND_SETUP.md)** - Complete frontend setup and explanation

## 🎨 Features Overview

### For Users
- ✅ Register/Login with JWT authentication
- ✅ Browse all campaigns with search
- ✅ View campaign details and progress
- ✅ Create your own campaigns
- ✅ Personal dashboard
- ✅ Responsive design (mobile-friendly)

### For Developers
- ✅ Clean, organized code structure
- ✅ RESTful API design
- ✅ JWT-based authentication
- ✅ MongoDB with Mongoose ODM
- ✅ React Context for state management
- ✅ Modern React patterns (hooks)
- ✅ Tailwind CSS for styling
- ✅ Protected routes
- ✅ API interceptors
- ✅ Error handling
- ✅ Form validation

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:5001/api/health

# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Frontend
1. Open `http://localhost:5173`
2. Register a new account
3. Login
4. Create a campaign
5. View campaigns

## 🚧 Development Status

- [x] Backend API setup
- [x] User authentication (register, login, JWT)
- [x] Campaign CRUD operations
- [x] Donation system API
- [x] React frontend with Vite
- [x] Tailwind CSS styling
- [x] Authentication UI (login, register)
- [x] Campaign browsing and creation
- [x] Protected routes
- [x] Responsive design
- [ ] Donation UI implementation
- [ ] Image upload functionality
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] User profile editing
- [ ] Campaign edit/delete UI

## 🛣️ Roadmap

### Phase 1 (Completed) ✅
- Full backend API
- Frontend setup
- Authentication flow
- Campaign management

### Phase 2 (Next)
- Donation form UI
- Dashboard enhancements
- Campaign editing
- Image uploads

### Phase 3 (Future)
- Payment integration (Stripe)
- Email notifications
- Social sharing
- Comments/updates

## 🤝 Contributing

This is a learning project. Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or personal use.

## 👨‍💻 Author

Built with ❤️ as a learning project to master the MERN stack.

## 🙏 Acknowledgments

- MongoDB for the database
- Express.js for the backend framework
- React for the frontend
- Tailwind CSS for styling
- All the open-source contributors

---

## 🆘 Need Help?

Check the documentation:
- [Backend Guide](./BACKEND_EXPLANATION.md)
- [Frontend Guide](./FRONTEND_SETUP.md)

Or review the inline code comments - every file is documented!

---

**Happy Coding! 🚀**

