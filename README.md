# 🏡 Nestopia – Smart Rental Matching Platform

**Nestopia** is a full-stack rental housing platform that leverages **landlord/renter preferences** and **property features** to calculate compatibility scores, facilitate secure chats, and make renting a home seamless.

The system is built with **React (frontend)** and **FastAPI + PostgreSQL (backend)**. It allows renters and landlords to connect through personalized listings, intelligent matching, and an intuitive user experience.

---

## ✨ Features

### 👤 Authentication & User Management

* **Email & Password login** with hashed storage (bcrypt + JWT)
* **Google OAuth login**
* **Role-based accounts**: Renter or Landlord
* **Profile management**: name, bio, picture, phone, location
* Secure JWT tokens

### 🏘 Listings

* **Landlords**:

  * Create, edit, delete property listings
  * Add images, amenities, house rules, pets policy, and lease terms
* **Renters**:

  * Browse all available listings
  * **Save/favorite** listings
* **Detail pages** with property carousel, specs, landlord info, and availability

### 🤝 Compatibility Scoring

* Uses **renter preferences** (budget, bedrooms, amenities, pets, etc.) compared with:

  * **Landlord preferences**
  * **Property features**
* Produces a **compatibility score (%)**
* Partial mismatches subtract points (not zeroed out)

### 💬 Messaging

* Secure in-platform **chat system**:

  * Conversations between renters and landlords
  * Seen-ticks ✔️✔️
  * Edit and delete messages
  * Replies and reactions
  * Refreshes automatically

### 🎨 UI/UX

* **Responsive design**
* Pure **CSS styling** (no inline React CSS)
* **Grid layout** for listings
* Match score badge, save & share buttons
* Accessibility-friendly markup

### 🔒 Security

* JWT authentication
* CSRF/OAuth state handling
* Pydantic schema validation
* PostgreSQL with SQLAlchemy ORM

---

## 🛠 Tech Stack

### Frontend

* React.js + React Router
* Context API (Auth state management)
* Axios (API requests)
* CSS (global styles)
* React Icons

### Backend

* FastAPI (Python)
* PostgreSQL + SQLAlchemy ORM
* Alembic (DB migrations)
* Authlib (Google OAuth)
* python-jose (JWT tokens)

---

## 📂 Project Structure

```
Nestopia/
│
├── backend/
│   ├── app/
│   │   ├── routers/        # API routes
│   │   ├── crud/           # DB operations
│   │   ├── db/             # Models & session
│   │   ├── core/           # Security & config
│   │   ├── schemas/        # Pydantic schemas
│   │   └── main.py         # FastAPI entrypoint
│   ├── alembic/            # DB migrations
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Listings, Profile, Chat
│   │   └── index.css       # Global styles
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js ≥ 18
* Python ≥ 3.11
* PostgreSQL

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Apply DB migrations
alembic upgrade head

# Run backend
uvicorn app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:3000`

---

## 📊 Compatibility Score

The **compatibility score** compares renter needs vs landlord listings:

* ✅ Budget fit
* ✅ Bedrooms / Bathrooms
* ✅ Amenities overlap
* ✅ Pets allowed policy
* ✅ Lease length match
* ✅ Landlord tenant preferences

Even if some fields don’t match, a listing is not excluded — points are deducted instead of forcing a **0%** score.

---

## 📜 License

Nestopia is released under the **MIT License**.
See the `LICENSE` file for details.