# E-commerce API

A robust, scalable RESTful API for e-commerce platforms built with Node.js, Express, TypeScript, and MongoDB. Features comprehensive user authentication, product management, shopping cart functionality, and more.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - OAuth integration (Google & Facebook)
  - Email verification
  - Password reset functionality
  - Role-based access control (Admin/User)
  - Token blacklisting for secure logout

- **Product Management**
  - Complete CRUD operations for products
  - Product variants support
  - Category and subcategory organization
  - Advanced search and filtering
  - Inventory tracking with activity logs
  - Product status management (active, inactive, discontinued)

- **Shopping Experience**
  - Persistent shopping cart
  - Wishlist functionality
  - Product reviews and ratings
  - Review moderation system
  - Guest checkout support

- **Order Management** *(In Development)*
  - Order creation and processing
  - Order status tracking
  - Payment integration ready

### Additional Features
- **Security**
  - Helmet.js for security headers
  - Rate limiting
  - Input validation with Zod
  - CORS enabled
  - Password hashing with bcrypt

- **Performance**
  - Database indexing
  - Pagination support
  - Optimized queries
  - Response caching ready

## 🛠 Tech Stack

- **Runtime:** Node.js (v18+)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT & Passport.js
- **Validation:** Zod
- **Email:** Nodemailer
- **File Upload:** Multer
- **Security:** Helmet, bcrypt, express-rate-limit
- **Logging:** Winston
- **Development:** Nodemon, tsx

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn package manager
- Gmail account for email services (or other SMTP)
- Google OAuth credentials (optional)
- Facebook OAuth credentials (optional)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ecommerce-api.git
cd ecommerce-api
```

### 2. Install dependencies
```bash
cd server
npm install
```

### 3. Environment Setup
Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce
DB_NAME=ecommerce

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourcompany.com

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Session Secret
SESSION_SECRET=your-session-secret

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173
```

### 4. Database Setup
```bash
# Make sure MongoDB is running
mongod

# The application will automatically create indexes on first run
```

### 5. Run the application
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/register` | Register new user | No |
| POST | `/users/login` | User login | No |
| POST | `/users/refresh-token` | Refresh access token | No |
| POST | `/users/logout` | Logout user | Yes |
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |
| PUT | `/users/change-password` | Change password | Yes |
| POST | `/users/forgot-password` | Request password reset | No |
| POST | `/users/reset-password` | Reset password | No |
| POST | `/users/verify-email` | Verify email address | No |
| GET | `/users/auth/google` | Google OAuth | No |
| GET | `/users/auth/google/callback` | Google OAuth callback | No |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | No |
| GET | `/products/:id` | Get product by ID | No |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |
| GET | `/products/:id/reviews` | Get product reviews | No |

### Category Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | No |
| GET | `/categories/:id` | Get category by ID | No |
| GET | `/categories/:id/products` | Get products by category | No |
| POST | `/categories` | Create category | Admin |
| PUT | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart` | Add item to cart | Yes |
| PUT | `/cart` | Update cart item | Yes |
| DELETE | `/cart/:productId` | Remove item from cart | Yes |
| DELETE | `/cart/:productId/reduce` | Reduce item quantity | Yes |
| DELETE | `/cart` | Clear cart | Yes |

### Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reviews` | Create review | Yes |
| PUT | `/reviews/:reviewId` | Update review | Yes |
| DELETE | `/reviews/:reviewId` | Delete review | Yes |
| POST | `/reviews/:reviewId/helpful` | Mark review helpful | Yes |
| POST | `/reviews/:reviewId/report` | Report review | Yes |

### Wishlist Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/wishlist` | Get wishlist | Yes |
| POST | `/wishlist` | Add to wishlist | Yes |
| DELETE | `/wishlist/:productId` | Remove from wishlist | Yes |
| DELETE | `/wishlist` | Clear wishlist | Yes |

### Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/search` | Search products | No |
| GET | `/search/suggestions` | Get search suggestions | No |

## 🗄 Database Schema

### Collections

1. **users** - User accounts and authentication
2. **products** - Product catalog with variants
3. **categories** - Product categories (hierarchical)
4. **carts** - Shopping carts
5. **reviews** - Product reviews and ratings
6. **wishlists** - User wishlists
7. **inventoryactivities** - Stock movement logs
8. **refreshtokens** - JWT refresh tokens
9. **blacklistedtokens** - Revoked tokens

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Project Structure

```
ecommerce/
├── server/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/     # Custom middlewares
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── validators/      # Request validators
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

## 🚢 Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/server.js --name ecommerce-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build Docker image
docker build -t ecommerce-api .

# Run container
docker run -p 3000:3000 --env-file .env ecommerce-api
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `EMAIL_HOST` | SMTP host | Yes |
| `EMAIL_USER` | SMTP username | Yes |
| `EMAIL_PASS` | SMTP password | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No |


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Kuldeep Singh - [GitHub](https://github.com/cygnus07)



