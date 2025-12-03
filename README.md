# CrowFund MERN - Crowdfunding Platform

A full-stack crowdfunding application built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

- User authentication (Register/Login with JWT)
- Create and manage crowdfunding campaigns
- Make donations to campaigns
- Track campaign progress and donations
- Beautiful, responsive UI
- Secure payment processing ready

## 📁 Project Structure

```
crowfund_mern/
├── backend/          # Express.js API server
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware (auth, etc.)
│   └── server.js     # Entry point
├── frontend/         # React application (to be added)
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend (Coming Soon)
- React
- Tailwind CSS
- Axios

## 📦 Installation

### Prerequisites
- Node.js (v20+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/crowfund
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Campaigns
- `GET /api/campaigns` - Get all campaigns (with filters, pagination)
- `GET /api/campaigns/:id` - Get single campaign
- `POST /api/campaigns` - Create campaign (protected)
- `PUT /api/campaigns/:id` - Update campaign (protected, creator only)
- `DELETE /api/campaigns/:id` - Delete campaign (protected, creator only)

### Donations
- `POST /api/donations` - Create donation (protected)
- `GET /api/donations/campaign/:campaignId` - Get donations for campaign
- `GET /api/donations/my-donations` - Get user's donation history (protected)

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## 📖 Documentation

See [BACKEND_EXPLANATION.md](./BACKEND_EXPLANATION.md) for detailed backend architecture explanation.

## 🚧 Development Status

- [x] Backend API setup
- [x] User authentication
- [x] Campaign CRUD operations
- [x] Donation system
- [ ] Frontend React application
- [ ] Image upload functionality
- [ ] Payment integration
- [ ] Email notifications

## 📝 License

MIT

## 👨‍💻 Author

Built with ❤️ using the MERN stack

