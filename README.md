# Job Application Tracker (MERN)

Track every job application on a kanban board: Wishlist → Applied → Interview → Offer → Rejected.

## Status

- [x] Week 1: backend foundation (Express, MongoDB models, JWT auth)
- [ ] Week 2: application CRUD + React client
- [ ] Week 3: kanban board with drag-and-drop
- [ ] Week 4: search, stats, polish, deploy

## Run the server

```bash
cd server
npm install
cp .env.example .env     # then edit .env (see below)
npm run dev
```

Create a free cluster on MongoDB Atlas, copy its connection string into `MONGO_URI`,
and set `JWT_SECRET` to a long random string. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The server starts on http://localhost:5000. Check http://localhost:5000/api/health.

## Auth endpoints

| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `name`, `email`, `password` | Returns user + JWT |
| POST | `/api/auth/login` | `email`, `password` | Returns user + JWT |
| GET | `/api/auth/me` | none | Needs `Authorization: Bearer <token>` |

### Quick test with curl

```bash
curl -X POST localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tahir","email":"tahir@test.com","password":"secret123"}'

curl localhost:5000/api/auth/me -H "Authorization: Bearer <paste token here>"
```

## Project structure

```
server/
├── config/db.js              MongoDB connection
├── models/User.js            hashed passwords (bcrypt)
├── models/Application.js     job application schema
├── middleware/auth.js        verifies JWT, sets req.user
├── middleware/errorHandler.js
├── controllers/authController.js
├── routes/authRoutes.js
└── server.js
```

Never commit `.env`. It is already in `.gitignore`.
