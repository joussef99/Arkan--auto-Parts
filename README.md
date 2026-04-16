# Arkan Parts Management System

A desktop-first offline spare parts management system for auto shops in Libya, featuring RTL Arabic support and local SQLite storage.

## Run Locally

**Prerequisites:** Node.js

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set the `GEMINI_API_KEY` in [.env.local](frontend/.env.local) to your Gemini API key (if needed)
4. Run the frontend:
   ```bash
   npm start
   ```
   The frontend will run on http://localhost:3000 and proxy API calls to the backend.

### Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.
