# MfgCRM: Manufacturing BDA Sales Pipeline & Performance Tracker

MfgCRM is a production-ready, highly interactive full-stack sales customer relationship management (CRM) tool specifically designed for **Business Development Associates (BDAs)** and **Sales Managers** in manufacturing companies. It streamlines lead capturing, sales pipeline progression (via an interactive Kanban board), client communication history (logging calls, emails, and meetings), and business performance analytics.

---

## 🏗️ Architectural Overview & Design Decisions

### The MERN Stack Architecture
1. **Database (MongoDB)**: Used to store dynamic documents such as Leads, Communication logs, and Users. Leads and communications can vary heavily based on manufacturing specifications, custom blue-print attachments, or contract details, which makes MongoDB's flexible schema a natural fit.
2. **Backend (Express & Node.js in TypeScript)**: Houses the REST APIs and hosts a Socket.IO connection.
3. **Frontend (React in TypeScript)**: Organized using modern functional components, standard hooks, and Tailwind CSS.
4. **WebSocket Coordination (Socket.IO)**: Used to push real-time events. For example, if a Sales Manager updates a lead assignment or stage on their screen, the change instantly reflects on the active BDA's screen.
5. **Data Visualization (Recharts)**: Tailored widgets rendering lead pipeline funnel stages and sales distribution metrics.

---

## ✨ Features

- 🔐 **Authentication & RBAC**: Dual-role flow distinguishing **Sales Managers** (who have a high-level view of all leads and can see BDA performance charts) from **BDAs** (who can only see and manage their assigned leads).
- 📋 **Lead Pipeline (Kanban Board)**: Drag-and-drop mechanics to move leads across stages (`New Lead`, `Contacted`, `Proposal Sent`, `Negotiation`, `Deal Won`, `Deal Lost`).
- 📈 **Sales Tracking**: Real-time logging of deal values, ordering quantities, target manufacturing products (such as precision gears, custom castings, valves, hydraulic pumps), follow-up reminders, and priority statuses.
- 📞 **Client Communication Workflow Logs**: An interactive timeline panel inside each lead card allowing associates to log call notes, emails, and physical/virtual meetings to ensure no deal goes cold.
- 📊 **Performance Analytics**: 
  - Real-time conversion rates (Won vs. Lost closed opportunities).
  - Stage-by-stage pipeline distribution value tracking.
  - Category-based sales volume graphs.
  - **Manager Leaderboard**: Automatically ranks BDAs based on their total closed won sales revenue.

---

## 🛠️ Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/mfg_bda
JWT_SECRET=mfg_bda_super_secret_key
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Docker](https://www.docker.com/) (Optional, but useful to spin up a local MongoDB container)

### Step 1: Start MongoDB
If you have Docker, run this command in the project root:
```bash
docker-compose up -d
```
This launches a MongoDB container listening on port `27017`. Otherwise, make sure you have MongoDB running locally on your machine.

### Step 2: Set Up and Run the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with demo accounts and dummy sales data:
   ```bash
   npm run seed
   ```
   *Note: This creates Aditya (BDA), Vikram (BDA), and Sarah (Manager). Aditya's email is `aditya@gmail.com` and Sarah's is `manager@gmail.com`. Password for all accounts is `password123`.*
4. Start the development server:
   ```bash
   npm run dev
   ```
The backend API server will run at `http://localhost:5000`.

### Step 3: Set Up and Run the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
The React frontend application will boot up at `http://localhost:5173`. Open this URL in your web browser.
