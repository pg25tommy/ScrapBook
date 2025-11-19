# SoftBound by Daniel — Scrapbook Web App

**Version:** 0.6.0
**Owner:** Tommy Minter
**Branding:** SoftBound by Daniel
**Status:** Active

## Overview

SoftBound by Daniel is a tactile, analog-feeling scrapbook web app that displays Polaroid-style images and newspaper clippings on a warm paper background. The aesthetic is physical and intimate: matte textures, soft shadows, tape overlays, and gentle light-table vibes.

**NEW in v0.6.0:** Multi-slot pages! Create rich scrapbook pages with multiple photos and newspaper clippings positioned freely on the same page.

The app features a complete **admin/public architecture**:
- **Admin Dashboard** (`/admin`): Full CRUD operations for multi-slot scrapbook pages with authentication
- **Public Gallery** (`/`): Beautiful read-only view of published pages for end users

---

## Features

### Admin Features (`/admin`)
- **Authentication**: Username/password login with NextAuth.js
- **Create & Edit Pages**: Full Light Table editor with all functionality
- **Publish/Unpublish**: Control which pages are visible to the public
- **Delete Pages**: Remove unwanted scrapbook pages
- **Light Table Tools**:
  - Photo upload and cycling through images
  - Zoom & pan controls
  - Flip photo to add text on back (newspaper clipping style)
  - Loupe magnification
  - Reset camera view

### Public Features (`/`)
- **Gallery View**: Grid display of all published scrapbook pages
- **Page Viewer**: Read-only view of individual pages
- **Zoom & Pan**: Browse published pages with full camera controls
- **No Login Required**: Public users can view without authentication

### Core Display Features
- Single Polaroid frame centered on cream paper background
- Frame includes:
  - Realistic matte texture
  - Drop shadow
  - Masked content region
  - Decorative tape pieces on top layer (never masked)

### Interaction
- **Mouse wheel zoom** (0.5x to 3.0x)
- **Click-and-drag panning** on background
- **Click frame** to cycle through images (admin only)
- **Flip photo** to add text on back
- **Toolbar controls** (admin only):
  - Next Photo: Load next image from pool
  - Flip Over/Show Front: Toggle between photo and text
  - Toggle Loupe: Enable/disable magnification
  - Reset View: Return camera to default zoom/pan

### Data Management
- **In-memory storage** for development (persists across hot-reloads via globalThis)
- **Vercel Postgres** support for production
- **Local image pool** from `/public/photos/`
- **External image support** via CORS-safe proxy

---

## Tech Stack

- **Next.js 15.5** (App Router)
- **React 19.1** + **TypeScript 5**
- **NextAuth.js 4** for authentication
- **PixiJS 8.12** for high-performance 2D graphics
- **Zustand 5.0** for lightweight state management
- **Vercel Postgres** + **@vercel/postgres** for database
- **bcryptjs** for password hashing
- **Tailwind CSS 4** for styling
- **Vitest 3.2** + Testing Library for testing

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/pg25tommy/ScrapBook.git
cd light-table

# Install dependencies
npm install
```

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

Access the admin dashboard at [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Changing Admin Password

```bash
# Generate a new bcrypt hash
cd light-table
node scripts/generate-credentials.js YOUR_NEW_PASSWORD
```

Copy the generated `ADMIN_PASSWORD_HASH` and update it in `.env.local`

### Production Build

```bash
# Build for production
npm run build

# Run production server
npm start
```

### Testing

```bash
# Run test suite
npm test
```

### Linting

```bash
# Check code quality
npm run lint
```

---

## Project Structure

```
light-table/
├── src/
│   ├── app/
│   │   ├── admin/                   # Admin dashboard
│   │   │   ├── login/              # Login page
│   │   │   ├── pages/              # Page management
│   │   │   └── page.tsx            # Admin home
│   │   ├── view/[slug]/            # Public page viewer
│   │   ├── api/
│   │   │   ├── admin/pages/        # Admin CRUD API
│   │   │   ├── public/pages/       # Public read API
│   │   │   ├── auth/               # NextAuth.js authentication
│   │   │   ├── page/route.ts       # Image pool API
│   │   │   └── proxy/route.ts      # CORS proxy
│   │   ├── components/
│   │   │   ├── LightTableApp.tsx   # Main UI component
│   │   │   ├── AdminDashboard.tsx  # Admin UI
│   │   │   ├── PageEditor.tsx      # Page creation/editing
│   │   │   ├── PublicGallery.tsx   # Public gallery
│   │   │   └── SessionProvider.tsx # Auth provider
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Public home
│   │   └── globals.css             # Global styles
│   ├── lib/
│   │   ├── db.ts                   # Database layer
│   │   ├── auth.ts                 # Auth helpers
│   │   └── pixi/                   # PixiJS graphics
│   │       ├── engine.ts           # Graphics engine
│   │       ├── tapeTextures.ts     # Tape SVG assets
│   │       ├── compat.ts           # PIXI compatibility
│   │       └── utils.ts            # Texture utilities
│   ├── state/
│   │   └── useLightTableStore.ts   # Zustand state store
│   ├── types/
│   │   └── next-auth.d.ts          # NextAuth types
│   └── tests/
│       └── compat.test.ts          # Unit tests
├── public/
│   ├── photos/                     # Local image directory
│   └── textures/                   # Paper texture assets
├── scripts/
│   └── generate-credentials.js     # Password hash generator
├── .env.local                      # Environment variables
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── SETUP.md                        # Setup guide
└── SPEC.md                         # Technical specification
```

---

## Usage

### Admin Workflow

1. **Login**: Navigate to `/admin/login` and use your credentials
2. **Create Page**: Click "+ New Page" in the admin dashboard
3. **Edit Content**:
   - Upload or cycle through photos
   - Flip photo to add text on back
   - Zoom, pan, and arrange your photo
4. **Publish**: Toggle "Published" status to make visible to public
5. **Delete**: Remove unwanted pages from the dashboard

### Adding Local Photos

1. Place image files (JPG, PNG, etc.) in `/public/photos/`
2. In admin editor, click "Next Photo" to cycle through images
3. Images are loaded randomly from the pool

### Public Viewing

1. Navigate to `/` (no login required)
2. Browse the gallery of published pages
3. Click a page to view full-screen with zoom/pan
4. Return to gallery with back button

---

## API Endpoints

### Admin API

#### `GET /api/admin/pages`
Get all pages (authentication required)

**Response:**
```json
{
  "pages": [
    {
      "id": 1,
      "title": "Summer Memories",
      "slug": "summer-memories",
      "published": true,
      "slot_data": { ... },
      "created_at": "2025-11-15T...",
      "updated_at": "2025-11-15T..."
    }
  ]
}
```

#### `POST /api/admin/pages`
Create a new page (authentication required)

**Body:**
```json
{
  "title": "Page Title",
  "slug": "page-title",
  "slotData": { ... }
}
```

#### `PUT /api/admin/pages/[id]`
Update a page (authentication required)

#### `PATCH /api/admin/pages/[id]`
Toggle published status (authentication required)

#### `DELETE /api/admin/pages/[id]`
Delete a page (authentication required)

### Public API

#### `GET /api/public/pages`
Get all published pages

#### `GET /api/public/pages/[slug]`
Get a specific published page by slug

### Utility API

#### `GET /api/page`
Returns image URL(s) from the pool (used by admin editor)

**Query Parameters:**
- `pool` (optional): `'local'`, `'external'`, or `'any'` (default: `'any'`)
- `index` (optional): Specific index for deterministic cycling

#### `GET /api/proxy`
CORS-safe proxy for external images

**Query Parameters:**
- `url` (required): The external image URL to fetch

**Allowed Hosts:**
- `images.unsplash.com`
- `images.pexels.com`

---

## Database

### In-Memory Storage (Development)

For development without a database, pages are stored in memory using `globalThis` to persist across hot-reloads. This is **not suitable for production** as data is lost on server restart.

### Vercel Postgres (Production)

1. Create a Vercel Postgres database
2. Add `POSTGRES_URL` to your environment variables
3. Run the schema setup:

```sql
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  slot_data JSONB NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables

Required variables in `.env.local`:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<generate-with-scripts/generate-credentials.js>

# Database (optional for development)
POSTGRES_URL=<your-postgres-connection-string>
```

---

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production domain)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `POSTGRES_URL` (create Vercel Postgres database)
4. Deploy!

**Important:** Update `NEXTAUTH_URL` to your production domain:
```
NEXTAUTH_URL=https://yoursite.vercel.app
```

---

## Security

- **Authentication**: NextAuth.js with bcrypt password hashing
- **CORS Protection**: `/api/proxy` validates and whitelists external image sources
- **Server-Side Auth**: All admin routes protected with `requireAuth()`
- **Password Security**: Bcrypt hash with salt rounds (default: 10)

**⚠️ Important:** Change the default admin password before deploying to production!

---

## Troubleshooting

### Port Conflicts

If port 3000 is in use, the dev server will automatically use the next available port (3001, 3002, etc.). Update `NEXTAUTH_URL` in `.env.local` to match.

### Authentication Issues

1. Ensure `.env.local` has correct `NEXTAUTH_SECRET` and `ADMIN_PASSWORD_HASH`
2. Verify `NEXTAUTH_URL` matches your current port
3. Clear browser cookies and try again

### In-Memory Data Loss

Pages created in development are stored in memory and will be lost when:
- Server is restarted
- Node process is killed

For persistence, set up Vercel Postgres and configure `POSTGRES_URL`.

### CORS Failures

External images must go through `/api/proxy`:
- Ensure the host is in the allowed list
- Check browser console for specific errors

---

## Roadmap

### Current (v0.5)
- ✅ Admin/public architecture with authentication
- ✅ Full CRUD operations for scrapbook pages
- ✅ Publish/unpublish workflow
- ✅ In-memory storage with globalThis persistence
- ✅ Vercel Postgres support
- ✅ Photo flip with back text editing
- ✅ Single Polaroid frame display
- ✅ Zoom & pan controls
- ✅ CORS-safe image loading
- 🔨 Loupe magnification (placeholder, needs refinement)

### Future
- Email/social authentication
- Image upload to cloud storage
- Multi-photo layouts per page
- Commenting system
- Social sharing
- Mobile app (React Native)
- Collaborative scrapbooks

---

## Contributing

This is a personal project by Tommy Minter. For questions or feedback, please refer to the [SPEC.md](SPEC.md) file for technical details or open an issue on GitHub.

---

## License

All rights reserved.