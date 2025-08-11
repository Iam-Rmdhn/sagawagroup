# 🚀 Sagawa Group - Company Profile Website

![Sagawa Grup Logo](vue-frontend/src/assets/img/sagawa_logo.svg)

[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=fff)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?logo=tailwind-css&logoColor=white)](#)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#)

Aplikasi web full-stack modern menggunakan Astro untuk frontend, Bun untuk backend API, dan AstraDB sebagai database. Project ini dibangun dengan fokus pada performa, developer experience, dan desain yang responsif.

## 🚀 Tech Stack

### Frontend

- **[Astro](https://astro.build/)** - Static Site Generator yang modern dan cepat
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide Icons](https://lucide.dev/)** - Beautiful & consistent icon pack
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Backend

- **[Bun](https://bun.sh/)** - Fast JavaScript runtime & package manager
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **Express-like API** - RESTful API architecture

### Database

- **[AstraDB](https://astra.datastax.com/)** - Serverless Cassandra database
- **Vector Search** - Built-in vector search capabilities

## 📁 Struktur Project

```
sagawagroup/
├── 📁 bun-api/                    # Backend API dengan Bun
│   ├── 📄 bun.lock               # Bun lockfile
│   ├── 📄 index.ts               # Entry point server
│   ├── 📄 package.json           # Dependencies backend
│   ├── 📄 README.md              # Backend documentation
│   ├── 📄 tsconfig.json          # TypeScript config
│   └── 📁 src/
│       ├── 📁 controllers/       # Request handlers
│       │   ├── 📄 auth.controller.ts
│       │   └── 📄 mitra.controller.ts
│       ├── 📁 lib/               # Database & external services
│       │   └── 📄 db.ts          # AstraDB connection
│       ├── 📁 models/            # Data models & schemas
│       │   └── 📄 user.model.ts
│       ├── 📁 routes/            # API route definitions
│       │   ├── 📄 auth.route.ts
│       │   └── 📄 mitra.route.ts
│       ├── 📁 services/          # Business logic
│       │   ├── 📄 auth.services.ts
│       │   └── 📄 mitra.services.ts
│       └── 📁 utils/             # Helper functions
│           ├── 📄 bankvalidator.ts
│           ├── 📄 email.ts
│           └── 📄 jwt.ts
│
├── 📁 vue-frontend/              # Frontend dengan Astro
│   ├── 📄 astro.config.mjs       # Konfigurasi Astro
│   ├── 📄 package.json           # Dependencies frontend
│   ├── 📄 README.md              # Frontend documentation
│   ├── 📄 tailwind.config.js     # Konfigurasi Tailwind
│   ├── 📄 tsconfig.json          # TypeScript config
│   ├── 📁 public/                # Static assets
│   │   └── 📄 favicon.svg
│   └── 📁 src/
│       ├── 📁 assets/            # Images & media
│       │   ├── 📄 astro.svg
│       │   ├── 📄 background.svg
│       │   └── 📁 img/
│       │       ├── 📄 heroes_img.png
│       │       ├── 📄 logo_s.svg
│       │       └── 📄 sagawa_logo.svg
│       ├── 📁 components/        # Reusable UI components
│       │   ├── 📄 Footer.astro
│       │   ├── 📄 Hero.astro
│       │   └── 📄 Navbar.astro
│       ├── 📁 layouts/           # Page layouts
│       │   └── 📄 Layout.astro
│       └── 📁 pages/             # Route pages
│           ├── 📄 about.astro
│           └── 📄 index.astro
│
└── 📄 README.md                  # Main project documentation
```

## 🛠️ Prerequisites

Pastikan Anda memiliki tools berikut terinstall:

- **[Bun](https://bun.sh/)** v1.0.0 atau lebih baru
- **[Node.js](https://nodejs.org/)** v18.0.0 atau lebih baru (untuk Astro)
- **[Git](https://git-scm.com/)**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/tsubametaa/sagawagroup.git
cd sagawagroup
```

### 2. Setup Backend (Bun API)

```bash
# Masuk ke folder backend
cd bun-api

# Install dependencies dengan Bun
bun install

# Setup environment variables
cp .env.example .env
# Edit .env dan tambahkan:
# - ASTRA_DB_APPLICATION_TOKEN=your_token
# - ASTRA_DB_API_ENDPOINT=your_endpoint
# - JWT_SECRET=your_jwt_secret
# - EMAIL_SERVICE_API_KEY=your_email_key

# Jalankan development server
bun run dev
```

Backend akan berjalan di `http://localhost:3000`

### 3. Setup Frontend (Astro)

```bash
# Buka terminal baru dan masuk ke folder frontend
cd vue-frontend

# Install dependencies
npm install
# atau
bun install

# Jalankan development server
npm run dev
# atau
bun run dev
```

Frontend akan berjalan di `http://localhost:4321`

## 🔧 Environment Variables

### Backend (.env)

```env
# AstraDB Configuration
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_token
ASTRA_DB_API_ENDPOINT=your_astra_db_endpoint
ASTRA_DB_KEYSPACE=your_keyspace

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Service
EMAIL_SERVICE_API_KEY=your_email_service_key
EMAIL_FROM=noreply@sagawagroup.com

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:4321
```

### Frontend (.env)

```env
# API Configuration
PUBLIC_API_URL=http://localhost:3000
PUBLIC_API_VERSION=v1

# Site Configuration
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_SITE_NAME=SagawaGroup
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register    # User registration
POST   /api/auth/login       # User login
POST   /api/auth/logout      # User logout
GET    /api/auth/profile     # Get user profile
PUT    /api/auth/profile     # Update user profile
```

### Mitra (Partner) Endpoints

```
GET    /api/mitra           # Get all partners
GET    /api/mitra/:id       # Get partner by ID
POST   /api/mitra           # Create new partner
PUT    /api/mitra/:id       # Update partner
DELETE /api/mitra/:id       # Delete partner
```

## 🎨 UI Components

### Available Components

- **Navbar** - Responsive navigation bar dengan mobile menu
- **Hero** - Hero section dengan background image dan CTA
- **Footer** - Footer dengan links dan informasi kontak

### Lucide Icons Usage

```astro
---
import { Menu, X, Mail, Phone } from 'lucide-astro';
---

<Menu size={24} />
<X size={24} />
<Mail size={16} />
<Phone size={16} />
```

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Mitra Table

```sql
CREATE TABLE mitra (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  bank_account TEXT,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🛠️ Development Commands

### Backend Commands

```bash
# Development server
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run tests
bun test

# Type checking
bun run type-check

# Linting
bun run lint
```

### Frontend Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run astro check

# Format code
npm run format
```

## 🚀 Deployment

### Backend Deployment

1. **Build for production:**

```bash
cd bun-api
bun run build
```

2. **Deploy ke cloud provider:**

- Railway
- Fly.io
- DigitalOcean App Platform
- Vercel (dengan Bun runtime)

### Frontend Deployment

1. **Build for production:**

```bash
cd vue-frontend
npm run build
```

2. **Deploy static files:**

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🧪 Testing

### Backend Testing

```bash
cd bun-api

# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test auth.test.ts
```

### Frontend Testing

```bash
cd vue-frontend

# Component testing dengan Vitest
npm run test

# E2E testing dengan Playwright
npm run test:e2e
```

## 🤝 Contributing

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

### Development Guidelines

- Gunakan TypeScript untuk type safety
- Follow ESLint dan Prettier configuration
- Tulis tests untuk fitur baru
- Update documentation jika diperlukan
- Gunakan conventional commits

## 📈 Performance

### Frontend Optimizations

- ⚡ **Astro Islands** - Partial hydration untuk komponen interaktif
- 🎯 **Tree Shaking** - Bundle size optimization
- 🖼️ **Image Optimization** - Automatic image compression dan lazy loading
- 📦 **Code Splitting** - Automatic route-based code splitting

### Backend Optimizations

- 🚀 **Bun Runtime** - 3x faster than Node.js
- 💾 **Connection Pooling** - Efficient database connections
- 🔄 **Response Caching** - Redis-based caching strategy
- 📊 **Query Optimization** - Efficient AstraDB queries

## 🔒 Security

- 🔐 JWT Authentication dengan secure cookies
- 🛡️ CORS protection
- 🔒 Password hashing dengan bcrypt
- 🚫 Rate limiting untuk API endpoints
- ✅ Input validation dan sanitization

## 📊 Monitoring & Analytics

### Available Integrations

- **Error Tracking**: Sentry
- **Analytics**: Google Analytics 4
- **Performance**: Web Vitals
- **Uptime Monitoring**: UptimeRobot
- **Logging**: Winston (Backend)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro Team](https://astro.build/) untuk framework yang amazing
- [Bun Team](https://bun.sh/) untuk JavaScript runtime yang super cepat
- [Tailwind CSS](https://tailwindcss.com/) untuk utility-first CSS
- [Lucide](https://lucide.dev/) untuk beautiful icons
- [DataStax](https://www.datastax.com/) untuk AstraDB

## 👥 Developer

- **Tsubame/Utaa** - _Backend Developer_ - [@tsubametaa](https://github.com/tsubametaa)
- **Ilham** - _Frontend Developer_ - [@Iam-Rmdhn](https://github.com/Iam-Rmdhn)
- **Farhan** - _Frontend Developer_ - [@Rasen22](https://github.com/Rasen22)

## 📞 Support

Jika Anda memiliki pertanyaan atau butuh bantuan:

- 📧 Email: support@sagawagroup.com
- 💬 Discord: [Join our community](https://discord.gg/sagawagroup)
- 📖 Documentation: [docs.sagawagroup.com](https://docs.sagawagroup.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/tsubametaa/sagawagroup/issues)

---
