# Student Course Registration Portal

A beginner-friendly full-stack assessment project using React, Node.js, Express.js and MongoDB.

## Features
- Student registration and login
- Password hashing with bcrypt
- JWT authentication
- Browse, search and filter available courses
- Enrol in a course (blocks duplicate enrolment and full courses)
- View enrolled courses and cancel enrolment
- Updates available seats after enrolment/cancellation
- Responsive UI, loading states, form validation and friendly API errors

## Requirements
- Node.js LTS and npm
- MongoDB Community Server running locally OR a MongoDB Atlas connection string

## 1. Set up the backend
Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env`, then set `MONGO_URI`. For local MongoDB, the default example is suitable if MongoDB is running locally.

```bash
npm run seed
npm run dev
```

The API runs at `http://localhost:5000`.

## 2. Set up the frontend
Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Demo flow
1. Register a new student account.
2. Sign in.
3. Search/filter courses.
4. Press Enrol on a course.
5. Open My Courses to see the enrolment.
6. Cancel an enrolment and check the available seat count.

## API routes
- `POST /api/auth/register` — create student account
- `POST /api/auth/login` — sign in
- `GET /api/courses` — list/search/filter courses
- `POST /api/enrolments` — enrol in a course (JWT required)
- `GET /api/enrolments/me` — view own enrolments (JWT required)
- `DELETE /api/enrolments/:id` — cancel own enrolment (JWT required)

## Notes
- This is an educational assessment project, not a production-ready system.
- Keep `.env` private; never upload real secrets.
- Seed data is for demonstration. `npm run seed` adds sample courses.
