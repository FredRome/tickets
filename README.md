# Ticketing System API

An API-first ticketing solution where customers can create and manage tickets and push them to queues. The system allows managing tickets with features like assignees, comments, and customer communications.

## Features

- User management with different roles (admin, agent, customer)
- Ticket creation and management
- Queue-based ticket organization
- Comment system with internal notes
- Ticket assignment to agents
- Ticket status tracking
- Priority-based ticketing
- Comprehensive API for all operations

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user and get token
- `GET /api/auth/me` - Get current user profile

### Tickets

- `GET /api/tickets` - Get all tickets (filtered by user role and query parameters)
- `GET /api/tickets/:id` - Get a specific ticket
- `POST /api/tickets` - Create a new ticket
- `PUT /api/tickets/:id` - Update a ticket
- `POST /api/tickets/:id/comments` - Add a comment to a ticket
- `PUT /api/tickets/:id/assign` - Assign ticket to an agent
- `PUT /api/tickets/:id/queue` - Move ticket to another queue

### Queues

- `GET /api/queues` - Get all queues
- `GET /api/queues/:id` - Get a specific queue
- `POST /api/queues` - Create a new queue (admin only)
- `PUT /api/queues/:id` - Update a queue (admin only)
- `DELETE /api/queues/:id` - Delete a queue (admin only)

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/ap-tickets
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=7d
   ```
4. Build the application:
   ```
   npm run build
   ```
5. Start the application:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT Authentication
- Mongoose