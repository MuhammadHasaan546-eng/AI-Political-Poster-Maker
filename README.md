<div align="center">

# 🎨 AI Political Poster Maker

### _Design election-winning posters in seconds — powered by AI._

Generate high-resolution **political campaign banners, event posters, and victory celebration graphics** from fully customizable, AI-assisted layouts. Drop in names, designations, party info, and photos — then export pixel-perfect **PNG & PDF** in one click.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br />

**[✨ Features](#-key-features)** · **[🏗️ Architecture](#-tech-stack--architecture)** · **[⚙️ Setup](#-getting-started--installation)** · **[🔌 API](#-api-endpoints)** · **[🔐 Admin](#-authentication--admin-panel)**

</div>

---

## 📖 Overview

**AI Political Poster Maker** is a full-stack, production-grade web application that turns raw campaign text and personal photos into professionally designed political posters. It pairs a **real-time canvas builder** with **Google Gemini-powered layout intelligence** to auto-suggest color palettes, motifs, typography, and composition for every occasion.

The backend renders final assets using a **headless Chrome pipeline** (`puppeteer-core`) so exports are crisp, high-resolution, and print-ready, while a **hybrid storage layer** seamless routes assets to Cloudinary or local disk.

> Built for campaign managers, party organizers, and print shops who need dozens of polished posters — fast.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🧠 AI-Powered Canvas Builder

- **Real-time preview** rendered directly on an HTML5 canvas.
- **Typography auto-alignment** with smart line-height & centering.
- **Photo uploading** with full **layer controls** (position, scale, shape, borders).
- AI layout suggestions via `POST /api/posters/analyze` — palette, motifs, fonts & placement.

### 🎭 Multi-Occasion Templates

- 🗳️ **Election Campaigns** (dual-portrait layouts)
- 🇧🇩 **Victory Day** / **Independence Day** tributes
- 🌙 **Eid Mubarak** & **Ramadan** greetings
- 🕊️ **Condolence** & **Congratulation** posters
- 📢 General political announcements & rallies

</td>
<td width="50%" valign="top">

### 🔐 Authentication System

- **JWT-based** register / login / logout.
- Secure **httpOnly cookie** sessions (7-day expiry).
- **Role-based access control** (`user` / `admin`).

### 🛠️ Admin Panel

- Full **template management** (create, edit, soft-delete, re-seed).
- **Live poster list** with status moderation.
- **User & system statistics** dashboard.
- **Generation logs** with latency & token telemetry.

### 📤 Export Options

- Fast **client-side rendering**.
- **High-resolution PNG** downloads.
- **Print-ready PDF** exports.

### 🗄️ Hybrid Storage System

- **Cloudinary** cloud storage integration.
- Automatic **fallback to local disk** (`/storage`) when credentials are absent.

</td>
</tr>
</table>

---

## 🏗️ Tech Stack & Architecture

### 🖥️ Frontend

| Technology                  | Purpose                             |
| --------------------------- | ----------------------------------- |
| **Next.js 16** (App Router) | SSR, routing, same-origin API proxy |
| **React 19**                | Component UI + React Compiler       |
| **TypeScript 5**            | End-to-end type safety              |
| **Tailwind CSS 4**          | Styling & design system             |
| **Motion**                  | Animations & transitions            |
| **React Hook Form + Zod**   | Form state & schema validation      |
| **Lucide React**            | Icon system                         |

### ⚙️ Backend

| Technology               | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| **Node.js + Express 5**  | REST API server                           |
| **TypeScript 5**         | Typed server code                         |
| **Zod**                  | Request validation & env schema           |
| **JWT (`jsonwebtoken`)** | Auth token issuance                       |
| **bcryptjs**             | Password hashing (10 rounds)              |
| **Multer**               | In-memory photo uploads                   |
| **Puppeteer-core**       | Headless Chrome render pipeline → PNG/PDF |
| **Morgan + CORS**        | Logging & cross-origin policy             |

### 🗄️ Database

| Technology                | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| **MongoDB Atlas / Local** | Primary datastore                                                     |
| **Mongoose 9**            | ODM with typed models (`User`, `Template`, `Poster`, `GenerationLog`) |
| **mongodb-memory-server** | Ephemeral dev DB (`DEV_IN_MEMORY_DB=true`)                            |

### 🤖 AI Integrations

| Technology                          | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| **Google Gemini (`@google/genai`)** | Layout reasoning, brief generation, palette/motif suggestions |
| **Imagen** (`GEMINI_IMAGE_MODEL`)   | Optional AI background image generation                       |

### ☁️ External APIs

| Service           | Purpose                            |
| ----------------- | ---------------------------------- |
| **Cloudinary**    | Cloud asset storage & CDN delivery |
| **MongoDB Atlas** | Managed database hosting           |

---

## 📂 Project Structure

```
AI Political Poster Maker/
├── Backend/                     # Express + TypeScript API
│   ├── src/
│   │   ├── config/              # env.ts (zod-validated), db.ts
│   │   ├── middleware/          # auth, requireAdmin, upload, errorHandler
│   │   ├── models/              # User, Template, Poster, GenerationLog
│   │   ├── routes/              # auth, templates, posters, upload, admin
│   │   ├── services/            # gemini, generation, layout, render, storage, motifs
│   │   ├── types/               # frozen domain contracts
│   │   ├── validations/         # zod schemas
│   │   ├── seed.ts              # CLI seeder (npm run seed)
│   │   └── index.ts             # bootstrap
│   └── storage/                 # local disk fallback root
│
└── frontend/                    # Next.js 16 App Router
    └── src/
        ├── app/                 # pages + /api/* proxy route handlers
        │   ├── builder/[templateId]/  # canvas builder
        │   ├── templates/       # template gallery
        │   ├── dashboard/       # user posters
        │   ├── admin/           # admin panel (templates/posters/stats/logs)
        │   ├── login/ · register/
        │   └── storage/[...path] # local asset proxy
        ├── components/          # UI, builder, admin, poster components
        ├── lib/                 # api-client, canvas, jwt-edge, server-proxy
        └── proxy.ts             # edge middleware guard
```

---

## 🔐 Authentication & Admin Panel

The app ships with a **pre-configured default administrator account**. Use these credentials to access the full admin panel at `/admin`:

| Field                 | Value                         |
| --------------------- | ----------------------------- |
| 📧 **Admin Email**    | `muhammadhassanweb@gmail.com` |
| 🔑 **Admin Password** | `123456789`                   |

> ⚠️ **Security Notice:** These defaults are provided for initial setup and evaluation. **Change the password immediately in any production deployment.**

### Role-Based Access

- **`user`** — Create posters, manage their own gallery.
- **`admin`** — Everything a user can do, **plus** template CRUD, poster moderation across all users, user stats, and generation logs.

### Admin Panel Capabilities

| Area                     | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| 🎛️ **Dashboard Stats**   | Template/poster/user counts, success rate, avg. latency, token usage   |
| 🧩 **Template Manager**  | Create, edit, soft-delete (`isActive`), and re-seed built-in templates |
| 🖼️ **Poster Moderation** | View the live poster list, filter by status, delete any poster         |
| 📊 **Generation Logs**   | Inspect recent generation runs with latency and error details          |
| 📐 **Layout Defaults**   | Fetch the baseline layout config to scaffold new templates             |

---

## ⚙️ Environment Variables Guide

Create a **`.env`** file in `Backend/` and a **`.env.local`** file in `frontend/` using the templates below.

### 🔧 Backend — `Backend/.env`

```dotenv
# ------------------------------------------------------------------
# Server
# ------------------------------------------------------------------
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
PUBLIC_BASE_URL=http://localhost:5000

# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/political_poster_db?retryWrites=true&w=majority
DEV_IN_MEMORY_DB=false          # true = ephemeral in-memory DB (dev only, data lost on restart)

# ------------------------------------------------------------------
# Authentication
# ------------------------------------------------------------------
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

# ------------------------------------------------------------------
# Google Gemini (AI layout reasoning)
# ------------------------------------------------------------------
GEMINI_API_KEY=your-gemini-api-key
GEMINI_PROJECT_ID=projects/98083573185
GEMINI_PROJECT_NUMBER=98083573185
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=imagen-3.0-generate-002

# ------------------------------------------------------------------
# Storage — Cloudinary (omit/blank to fall back to local disk)
# ------------------------------------------------------------------
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=nebula-posters
STORAGE_DIR=storage             # local fallback directory (Backend/storage)

# ------------------------------------------------------------------
# Render pipeline (headless Chrome → PNG/PDF)
# ------------------------------------------------------------------
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome
RENDER_CONCURRENCY=2
RENDER_TIMEOUT_MS=45000

# ------------------------------------------------------------------
# Generation limits
# ------------------------------------------------------------------
MAX_REGENERATIONS=3
MAX_UPLOAD_MB=8
```

> 💡 **Graceful degradation:** Missing credentials never crash the server. If `CLOUDINARY_*` is blank, assets write to `Backend/storage` and are served at `/storage`. If `GEMINI_API_KEY` is absent, AI suggestions are disabled but the app still runs.

### 🎨 Frontend — `frontend/.env.local`

```dotenv
# Base URL of the Express backend (used by the Next.js API proxy)
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Edge-middleware route guard — must match the backend JWT_SECRET
JWT_SECRET=replace-with-a-long-random-secret
```

> 🔎 The frontend exposes same-origin `/api/*` route handlers that **stream-proxy** to the Express backend, keeping the httpOnly auth cookie first-party. `JWT_SECRET` in the frontend is used only by the edge middleware to verify session cookies.

---

## 🚀 Getting Started & Installation

### 📋 Prerequisites

- **Node.js** ≥ 20 and **npm**
- **MongoDB** — a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Google Chrome / Chromium** installed (for the render pipeline)
- _(Optional)_ Cloudinary & Google Gemini API accounts

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/AI-Political-Poster-Maker.git
cd "AI-Political-Poster-Maker"
```

### 2️⃣ Install Dependencies

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3️⃣ Configure Environment

```bash
# From the project root
cp Backend/.env.example Backend/.env          # then edit values
cp frontend/.env.example frontend/.env.local  # then edit values
```

Fill in the values using the [Environment Variables Guide](#-environment-variables-guide) above.

### 4️⃣ Seed the Template Library

Populates the database with the built-in production templates (Victory Day, Condolence, Election Campaign, Eid, Independence Day):

```bash
cd Backend
npm run seed
```

> You can also re-seed from the admin panel via **`POST /api/admin/templates/seed`**.

### 5️⃣ Run the Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Backend API  →  http://localhost:5000
cd Backend
npm run dev
```

```bash
# Terminal 2 — Frontend app →  http://localhost:3000
cd frontend
npm run dev
```

Visit **http://localhost:3000** and log in with the [admin credentials](#-authentication--admin-panel).

### 🏭 Production Build

```bash
# Backend
cd Backend
npm run build && npm start

# Frontend
cd frontend
npm run build && npm start
```

### 📜 Available Scripts

| Location   | Command             | Description                             |
| ---------- | ------------------- | --------------------------------------- |
| `Backend`  | `npm run dev`       | Start API with hot reload (`tsx watch`) |
| `Backend`  | `npm run build`     | Compile TypeScript → `dist/`            |
| `Backend`  | `npm start`         | Run compiled production server          |
| `Backend`  | `npm run seed`      | Seed the template library               |
| `Backend`  | `npm run typecheck` | Type-check without emitting             |
| `frontend` | `npm run dev`       | Start Next.js dev server                |
| `frontend` | `npm run build`     | Build for production                    |
| `frontend` | `npm start`         | Serve the production build              |
| `frontend` | `npm run lint`      | Run ESLint                              |

### 🩺 Health Check

```bash
curl http://localhost:5000/health
```

```json
{
  "success": true,
  "status": "ok",
  "env": "development",
  "database": "connected",
  "storage": "cloudinary"
}
```

---

## 🔌 API Endpoints

All routes are prefixed with **`/api`**. Requests with 🔒 require a valid JWT (httpOnly cookie); 🛡️ requires the **admin** role.

### 🔑 Authentication — `/api/auth`

| Method | Endpoint             | Auth | Description                   |
| ------ | -------------------- | ---- | ----------------------------- |
| `POST` | `/api/auth/register` | —    | Register a new user           |
| `POST` | `/api/auth/login`    | —    | Log in and set session cookie |
| `POST` | `/api/auth/logout`   | —    | Clear the auth cookie         |
| `GET`  | `/api/auth/me`       | 🔒   | Get the current user profile  |

### 🧩 Templates — `/api/templates`

| Method | Endpoint             | Auth | Description                                      |
| ------ | -------------------- | ---- | ------------------------------------------------ |
| `GET`  | `/api/templates`     | —    | List active templates (filter: `?occasionType=`) |
| `GET`  | `/api/templates/:id` | —    | Get a single template                            |

### 🖼️ Posters — `/api/posters`

| Method   | Endpoint                      | Auth | Description                                    |
| -------- | ----------------------------- | ---- | ---------------------------------------------- |
| `POST`   | `/api/posters/analyze`        | —    | AI layout suggestions (palette, motifs, fonts) |
| `GET`    | `/api/posters`                | 🔒   | List the caller's posters (`?limit=&offset=`)  |
| `POST`   | `/api/posters`                | 🔒   | Create a poster job (renders in background)    |
| `GET`    | `/api/posters/:id`            | 🔒   | Poll poster status (owner or admin)            |
| `POST`   | `/api/posters/:id/regenerate` | 🔒   | Re-roll with optional overrides (max 3)        |
| `DELETE` | `/api/posters/:id`            | 🔒   | Delete a poster and its assets                 |

### 📤 Upload — `/api/upload`

| Method | Endpoint      | Auth | Description                                |
| ------ | ------------- | ---- | ------------------------------------------ |
| `POST` | `/api/upload` | 🔒   | Upload photo(s) → Cloudinary or local disk |

### 🛡️ Admin — `/api/admin`

| Method   | Endpoint                    | Auth | Description                                  |
| -------- | --------------------------- | ---- | -------------------------------------------- |
| `GET`    | `/api/admin/stats`          | 🛡️   | Templates/posters/users/logs statistics      |
| `GET`    | `/api/admin/templates`      | 🛡️   | List all templates                           |
| `POST`   | `/api/admin/templates/seed` | 🛡️   | Re-seed built-in templates                   |
| `POST`   | `/api/admin/templates`      | 🛡️   | Create a template                            |
| `GET`    | `/api/admin/templates/:id`  | 🛡️   | Get a template                               |
| `PATCH`  | `/api/admin/templates/:id`  | 🛡️   | Update a template                            |
| `DELETE` | `/api/admin/templates/:id`  | 🛡️   | Soft-delete a template                       |
| `GET`    | `/api/admin/posters`        | 🛡️   | List all posters (`?status=&limit=&offset=`) |
| `DELETE` | `/api/admin/posters/:id`    | 🛡️   | Moderatively delete any poster               |
| `GET`    | `/api/admin/logs`           | 🛡️   | Recent generation logs                       |
| `GET`    | `/api/admin/layout-default` | 🛡️   | Baseline layout config                       |

### 📦 Response Envelope

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

---

## 🧪 Data Models

| Model             | Key Fields                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **User**          | `name`, `email`, `passwordHash` (bcrypt), `role` (`user`/`admin`)                                            |
| **Template**      | `name`, `occasionType`, `thumbnailUrl`, `isActive`, `layoutConfig`                                           |
| **Poster**        | `userId`, `templateId`, `status`, form data, `photoUrls`, `generatedImageUrl`, `pdfUrl`, `regenerationCount` |
| **GenerationLog** | `posterId`, `success`, `latencyMs`, `tokenEstimate`, `errorMessage`                                          |

**Poster lifecycle:** `pending` → `generating` → `completed` | `failed`

**Occasion types:** `general`, `eid`, `ramadan`, `independence-day`, `victory-day`, `political-rally`, `election-campaign`, `condolence`, `congratulation`, `birthday`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m "feat: add amazing feature"`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a **Pull Request**.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Muhammad Hassan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨💻 Author

<div align="center">

**Muhammad Hassan**

_Full-Stack Software Engineer_

[![Email](https://img.shields.io/badge/Email-muhammadhassanweb@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:muhammadhassanweb@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/)

<br />

### ⭐ If this project helped you, please give it a star!

**Built with ❤️ using Next.js, Express, MongoDB, Cloudinary & Google Gemini.**

</div>
