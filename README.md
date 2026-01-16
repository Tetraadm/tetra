# Tetra HMS

> **Digital Safety Platform for Norwegian Enterprises**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

Tetra is a digital HMS (Health, Safety & Environment) platform that makes workplace safety management simple and accessible for Norwegian businesses. It features AI-powered assistance via Claude, document management, team organization, and comprehensive audit logging.

---

## ✨ Features

- **AI Assistant (Spør Tetra)** - Natural language Q&A powered by Claude 3.5 Haiku with context from company safety documents
- **Instruction Management** - Upload, organize, and distribute safety instructions with PDF text extraction
- **Team Organization** - Hierarchical team structure with role-based access (Admin, Team Leader, Employee)
- **Real-time Alerts** - Create and distribute safety alerts to specific teams
- **Read Confirmations** - Track which employees have read and confirmed safety documents
- **Audit Logging** - Comprehensive activity logging for compliance
- **Multi-tenant** - Full tenant isolation with Row Level Security (RLS)
- **Norwegian UI** - All user-facing text in Norwegian Bokmål

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 3.4, Custom CSS Variables |
| **Backend** | Next.js API Routes (Node.js runtime) |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Auth** | Supabase Auth (Magic Link + Microsoft Azure SSO) |
| **Storage** | Supabase Storage (document uploads) |
| **AI** | Anthropic Claude 3.5 Haiku |
| **Rate Limiting** | Upstash Redis (with in-memory fallback) |
| **Email** | Resend (transactional emails) |
| **Deployment** | Vercel |

---

## 📋 Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **Supabase Project** with database configured
- **Anthropic API Key** for AI features
- **Resend Account** (optional, for email invitations)
- **Upstash Redis** (optional, falls back to in-memory)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Tetraadm/tetra.git
cd tetra
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # If example exists, otherwise create manually
```

See [Environment Variables](#-environment-variables) section for all required variables.

### 4. Set up the database

Run the SQL migrations in order in Supabase SQL Editor:

```
supabase/sql/01_schema.sql
supabase/sql/02_seed.sql
...
supabase/sql/23_document_profile_email_trigger.sql
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never expose to client) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Base URL for invite links |
| `RESEND_API_KEY` | - | Resend API key for email invitations |
| `RESEND_FROM_EMAIL` | `Tetra HMS <onboarding@resend.dev>` | Sender email for invitations |
| `UPSTASH_REDIS_REST_URL` | - | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | - | Upstash Redis token |
| `AI_RATE_LIMIT` | `20` | Max AI requests per window |
| `AI_RATE_WINDOW_SECONDS` | `60` | Rate limit window (seconds) |
| `UPLOAD_RATE_LIMIT` | `10` | Max uploads per window |
| `UPLOAD_RATE_WINDOW_SECONDS` | `60` | Upload rate limit window |
| `INVITE_RATE_LIMIT` | `10` | Max invitations per window |
| `INVITE_RATE_WINDOW_SECONDS` | `3600` | Invite rate limit window (1 hour) |
| `MAX_UPLOAD_MB` | `10` | Maximum file upload size in MB |
| `AI_MIN_RELEVANCE_SCORE` | `0.35` | Minimum relevance score for AI answers |

### Example `.env.local`

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI (required)
ANTHROPIC_API_KEY=sk-ant-api03-...

# App URL (required for production)
NEXT_PUBLIC_APP_URL=https://tetra.onl

# Email (optional - for invitation emails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Tetra HMS <no-reply@tetra.onl>

# Redis (optional - falls back to in-memory)
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 📝 Usage

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run spellcheck` | Run spell checker on source files |

### User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access: manage users, teams, instructions, alerts, view logs |
| **Team Leader** | View team members, instructions, manage team alerts |
| **Employee** | View assigned instructions, confirm reads, ask AI questions |

---

## 📁 Project Structure

```
tetra/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin dashboard
│   │   ├── employee/           # Employee dashboard
│   │   ├── leader/             # Team leader dashboard
│   │   ├── login/              # Authentication page
│   │   ├── invite/[token]/     # Invitation acceptance flow
│   │   ├── auth/               # Auth callback handlers
│   │   ├── post-auth/          # Post-login routing
│   │   └── api/                # API routes
│   │       ├── ask/            # AI Q&A endpoint
│   │       ├── upload/         # File upload endpoint
│   │       ├── invite/         # Invitation endpoint
│   │       └── ...
│   ├── components/             # Shared React components
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # Supabase client setup
│   │   ├── ratelimit.ts        # Rate limiting logic
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── ...
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── sql/                    # Database migrations (01-23)
├── public/                     # Static assets
├── docs/                       # Documentation
└── types/                      # Additional type definitions
```

---

## 🗄 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Tenant organizations |
| `teams` | Teams within organizations |
| `profiles` | User profiles (extends auth.users) |
| `instructions` | Safety documents and instructions |
| `instruction_teams` | M:N mapping of instructions to teams |
| `instruction_reads` | Read confirmation tracking |
| `folders` | Document organization folders |
| `alerts` | Safety alerts and notifications |
| `alert_teams` | M:N mapping of alerts to teams |
| `invites` | User invitation tokens |
| `audit_logs` | Activity audit trail |
| `ask_tetra_logs` | AI Q&A history |
| `ai_unanswered_questions` | Questions AI couldn't answer |

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Tenant isolation** - users can only access data within their organization
- **Role-based access** - policies enforce Admin/TeamLeader/Employee permissions
- **Soft delete** - `deleted_at` column for GDPR compliance
- **Audit logging** - all mutations are logged

---

## 🔌 API Documentation

### `POST /api/ask`

AI-powered Q&A endpoint.

**Request:**
```json
{
  "question": "Hvordan håndterer vi brannfare?"
}
```

**Response:**
```json
{
  "answer": "Basert på dokumentet [Brannrutiner]: ...",
  "source": {
    "instruction_id": "uuid",
    "title": "Brannrutiner",
    "updated_at": "2026-01-15T10:00:00Z",
    "open_url_or_route": "/employee?instruction=uuid"
  }
}
```

### `POST /api/upload`

Upload instruction documents (Admin only).

**Request:** `multipart/form-data`
- `file`: PDF, TXT, PNG, or JPG (max 10MB)
- `title`: Document title
- `orgId`: Organization UUID
- `severity`: `low` | `medium` | `critical`
- `status`: `draft` | `published`
- `folderId`: (optional) Folder UUID
- `teamIds`: JSON array of team UUIDs
- `allTeams`: `true` | `false`

### `POST /api/invite`

Send user invitation (Admin/TeamLeader only).

**Request:**
```json
{
  "email": "user@example.com",
  "role": "employee",
  "team_id": "uuid"
}
```

---

## 🔐 Authentication & Roles

### Authentication Methods

1. **Magic Link (OTP)** - Email-based passwordless login
2. **Microsoft Azure SSO** - OAuth integration for enterprise SSO

### Authorization Flow

1. User logs in via `/login`
2. Supabase Auth callback at `/auth/callback`
3. Middleware checks session on protected routes
4. Role-based redirect to appropriate dashboard:
   - Admin → `/admin`
   - Team Leader → `/leader`
   - Employee → `/employee`

### Invitation Flow

1. Admin creates invite via `/api/invite`
2. Email sent with link `/invite/[token]`
3. User accepts invite, creates account
4. Profile automatically linked to organization/team

---

## 🚀 Deployment

### Vercel (Recommended)

1. Import project from GitHub
2. Set environment variables in Vercel dashboard
3. Deploy

**Required Vercel Environment Variables:**
- All variables from [Environment Variables](#-environment-variables)

### Production URL

Live at: [https://tetra.onl](https://tetra.onl)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Run `npm run lint` before committing
- Run `npm run typecheck` to ensure type safety
- All UI text must be in Norwegian Bokmål
- Follow existing code patterns and styling

---

## 📄 License

Proprietary. All rights reserved.

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/Tetraadm/tetra/issues)
- **Email**: support@tetra.onl

---

*Built with ❤️ for Norwegian workplace safety*
