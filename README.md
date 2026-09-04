<div align="center">

<img src="public/images/school-crest.jpg" alt="STAR DreamWorks Schools Logo" width="120" />

# STAR DreamWorks Schools

**School Management & Learning Platform**

Pre-School, Nursery, Primary & High School — Ajah, Lagos, Nigeria

[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://www.stardreamworksschools.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)

</div>

---

## About

STAR DreamWorks Schools is a caring nursery, primary and secondary school located in Ajah, Lagos, Nigeria. This platform serves as the school's official website and management system, providing a public-facing site for admissions and information alongside secure portals for administrators, teachers, students and parents.

**Live site:** [www.stardreamworksschools.com](https://www.stardreamworksschools.com)

## Features

### Public Website
- **Home** — school overview, values, school life photos, contact info
- **About** — school story, core values, educational philosophy
- **Academics** — programmes across Creche, Kindergarten, Nursery, Primary and Secondary
- **Admissions** — online enquiry form for prospective parents
- **News & Events** — school announcements, events and updates
- **Gallery** — photo gallery of school life
- **Contact** — address, phone numbers, map, enquiry form

### Admin Portal
- Manage teachers, students, parents and class assignments
- Create and publish news, events and announcements
- Manage gallery uploads (via Cloudinary)
- Oversee grades and academic records
- Configure site settings (CMS content)

### Teacher Portal
- Manage assigned classes and subjects
- Create and grade assignments
- Post announcements and learning materials
- View student roster and grades

### Student Portal
- View and submit assignments
- Access learning materials
- Check grades and academic progress
- Read announcements

### Parent Portal
- View linked children's profiles
- Monitor grades and assignments
- Stay informed with announcements

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14.2 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 5.22 |
| **Authentication** | NextAuth v4 (Credentials, JWT sessions) |
| **Styling** | Tailwind CSS 3.4 |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Hosting** | Vercel |
| **Image uploads** | Cloudinary |
| **Database hosting** | Supabase (PostgreSQL) |

## Project Architecture

```
stardreamworksschool/
├── prisma/
│   ├── schema.prisma          # Database schema (22 models)
│   └── seed.ts                # Demo data seeder
├── public/
│   └── images/                # School crest, favicons, icons
├── src/
│   ├── app/
│   │   ├── (public pages)/    # Home, About, Academics, Admissions, Gallery, News, Contact
│   │   ├── dashboard/         # Admin, Teacher, Student, Parent portals
│   │   ├── login/             # Authentication page
│   │   ├── api/               # API routes (public + protected)
│   │   ├── layout.tsx         # Root layout with SEO metadata
│   │   ├── robots.ts          # robots.txt generator
│   │   └── sitemap.ts         # sitemap.xml generator
│   ├── components/
│   │   ├── public/            # Navbar, Footer, Logo, Map, etc.
│   │   ├── dashboard/         # Sidebar, Header, charts
│   │   └── JsonLd.tsx         # Schema.org structured data
│   ├── lib/
│   │   ├── auth-options.ts    # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── rate-limit.ts      # In-memory rate limiter
│   │   ├── school-contact.ts  # Verified school info
│   │   └── utils.ts           # Shared utilities
│   └── middleware.ts           # Auth guard, rate limiting, security headers
└── next.config.mjs            # Next.js config with security headers
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database (Supabase, Neon, or local)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (use `?pgbouncer=true` for Supabase pooler) |
| `NEXTAUTH_SECRET` | Random string for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL (`http://localhost:3000` locally) |

Optional variables for gallery uploads:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 3. Set up the database
```bash
npx prisma db push
npm run db:seed
```

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@stardreamworks.edu` | `admin123` |
| Teacher | `grace.okafor@stardreamworks.edu` | `teacher123` |
| Student | `amara.nwosu@stardreamworks.edu` | `student123` |
| Parent | `ngozi.nwosu@stardreamworks.edu` | `parent123` |

> Change all passwords before real-world use.

## Production Deployment

### Vercel Deployment

This project is deployed on **Vercel** with automatic deployments from the `main` branch.

**Environment variables to set in Vercel:**

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase transaction pooler (`:6543?pgbouncer=true`) |
| `DATABASE_URL_UNPOOLED` | Yes | Supabase direct connection for migrations |
| `NEXTAUTH_SECRET` | Yes | Strong random string |
| `NEXTAUTH_URL` | Yes | `https://www.stardreamworksschools.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | For gallery uploads |
| `CLOUDINARY_API_KEY` | Optional | For gallery uploads |
| `CLOUDINARY_API_SECRET` | Optional | For gallery uploads |

**Deploy:**
```bash
vercel --prod
```

### Database Setup (Supabase)
1. Create a Supabase project
2. Use the transaction pooler connection string for `DATABASE_URL`
3. Use the direct connection for `DATABASE_URL_UNPOOLED`
4. Push schema: `npx prisma db push`
5. Seed data: `npm run db:seed`

## SEO & Google Indexing

The site is configured for Google Search Console:

- **robots.txt** — allows crawling of public pages, blocks `/api/`, `/dashboard/`, `/login`
- **sitemap.xml** — auto-generated at `/sitemap.xml` with all public routes
- **Canonical URLs** — set on every public page using `www.stardreamworksschools.com`
- **Open Graph** — full OG metadata with images for social sharing
- **Twitter Cards** — summary_large_image cards
- **Structured Data** — Schema.org JSON-LD (School, WebSite, BreadcrumbList)
- **Favicon** — school crest as favicon, apple-touch-icon, and PWA icons
- **Meta tags** — unique title, description, keywords per page

### Google Search Console Setup
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://www.stardreamworksschools.com`
3. Verify ownership via DNS TXT record or HTML meta tag
4. Submit sitemap: `https://www.stardreamworksschools.com/sitemap.xml`

## Security

- **Authentication** — NextAuth with JWT sessions, bcrypt password hashing
- **Authorization** — role-based access control on every API route (ADMIN, TEACHER, STUDENT, PARENT)
- **Rate limiting** — login brute-force protection (10 attempts/15min/IP), admissions spam protection
- **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Input validation** — Zod schemas on all write endpoints
- **Information leakage** — no stack traces, no console.error in production, uniform error messages
- **Anti-XSS** — `isSafeUrl()` validation on all user-supplied links
- **Anti-spam** — honeypot field on admissions form

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Project Status

- **Production** — deployed and live at [www.stardreamworksschools.com](https://www.stardreamworksschools.com)
- **Google Indexing** — configured and ready for Search Console verification
- **Security audit** — OWASP Top 10:2025 hardening complete
- **Database** — Supabase PostgreSQL with 22 tables, seeded with demo data

---

<div align="center">

**STAR DreamWorks Schools** — *Your Dream Is Your Signature*

</div>
