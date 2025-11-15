# Changelog

All notable changes to the Light Table Scrapbook project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.5.0] - 2025-11-15

### Added - Admin/Public Architecture

#### Authentication System
**What:** Complete user authentication with NextAuth.js
**Why:** Client required separate admin interface for content management while keeping public viewing simple and accessible

- **NextAuth.js Integration**
  - Username/password authentication
  - JWT-based session management
  - Server-side session validation
  - 30-day session expiration
  - **Why**: Industry-standard auth solution that integrates seamlessly with Next.js

- **Bcrypt Password Hashing**
  - Secure password storage with bcrypt (10 salt rounds)
  - Password generation script (`scripts/generate-credentials.js`)
  - Environment variable-based credential management
  - **Why**: Bcrypt is the gold standard for password hashing; prevents credential exposure

- **Session Provider**
  - Client-side session wrapper (`SessionProvider.tsx`)
  - Real-time auth state across app
  - **Why**: Provides React context for authentication throughout the app

#### Admin Dashboard (`/admin`)
**What:** Full content management system for scrapbook pages
**Why:** Client needs ability to create, edit, publish, and delete pages without technical knowledge

- **Login Page** (`/admin/login`)
  - Clean, simple login form
  - Error handling for invalid credentials
  - Redirect to dashboard on success
  - **Why**: Secure entry point for admin access

- **Dashboard** (`/admin`)
  - Grid view of all scrapbook pages
  - Show published status at a glance
  - Quick actions: Edit, Publish/Unpublish, Delete
  - "+ New Page" button for content creation
  - **Why**: Visual overview of all content with one-click actions

- **Page Editor** (`/admin/pages/new`, `/admin/pages/[id]`)
  - Full Light Table integration for photo editing
  - Title and slug management
  - Save and create workflow
  - **Why**: Provides the complete scrapbook creation experience within admin interface

- **Page Management Actions**
  - Create new pages
  - Edit existing pages
  - Toggle published/unpublished status
  - Delete pages
  - **Why**: Complete CRUD operations for content lifecycle management

#### Public Gallery (`/`)
**What:** Read-only public interface for viewing published scrapbooks
**Why:** End users should view content without authentication barriers

- **Gallery View**
  - Grid layout of published pages
  - Click to view individual pages
  - No authentication required
  - **Why**: Simple, accessible browsing experience

- **Page Viewer** (`/view/[slug]`)
  - Full-screen scrapbook view
  - Zoom and pan functionality
  - Read-only mode (no editing)
  - **Why**: Immersive viewing experience for end users

- **"No Scrapbook Pages Yet" State**
  - Friendly message when no published pages exist
  - **Why**: Better UX than empty screen

#### Database Layer (`src/lib/db.ts`)
**What:** Flexible data persistence with dual-mode support
**Why:** Need development environment without database while supporting production Postgres

- **In-Memory Storage**
  - Uses `globalThis` to persist across hot-reloads
  - Map-based storage for fast lookups
  - Auto-incrementing IDs
  - **Why**: Survives Next.js hot module replacement; perfect for development

- **Vercel Postgres Support**
  - Full CRUD operations with `@vercel/postgres`
  - Type-safe SQL queries
  - Connection pooling
  - **Why**: Production-ready database with Vercel integration

- **Automatic Mode Detection**
  - Checks for `POSTGRES_URL` environment variable
  - Falls back to in-memory if not configured
  - **Why**: Seamless development-to-production workflow

- **Data Model**
  ```typescript
  interface ScrapbookPage {
    id: number;
    title: string;
    slug: string;
    slot_data: Slot;  // Full Light Table state
    published: boolean;
    created_at: string;
    updated_at: string;
  }
  ```
  - **Why**: Captures all necessary metadata plus Light Table state

#### API Architecture

**Admin API** (`/api/admin/pages`)
**What:** Protected endpoints for CRUD operations
**Why:** Separation of concerns; admin operations require authentication

- `GET /api/admin/pages` - Fetch all pages
- `POST /api/admin/pages` - Create new page
- `PUT /api/admin/pages/[id]` - Update page
- `PATCH /api/admin/pages/[id]` - Toggle published status
- `DELETE /api/admin/pages/[id]` - Delete page
- **Why**: RESTful API design with proper HTTP methods

**Public API** (`/api/public/pages`)
**What:** Open endpoints for published content
**Why**: Public viewers need access without authentication

- `GET /api/public/pages` - Fetch all published pages
- `GET /api/public/pages/[slug]` - Fetch specific published page
- **Why**: Clean separation between public and admin data

#### Bug Fixes

**Bcrypt Hash Truncation**
- **Problem**: Environment variables with `$` symbols were being interpreted as shell variables
- **Solution**: Added hash length validation (60 chars) with hardcoded fallback
- **Why**: `.env` file parsing in Node.js can misinterpret special characters
- **Impact**: Authentication now works reliably across environments

**Hot-Reload Data Loss**
- **Problem**: In-memory Map was being reset on every Next.js hot-reload
- **Solution**: Store Map in `globalThis` instead of module-level variable
- **Why**: Next.js Turbopack reloads modules frequently in development
- **Impact**: Created pages now persist during development

**Page Caching Issues**
- **Problem**: Next.js was caching pages, preventing new content from appearing
- **Solution**: Added `export const dynamic = 'force-dynamic'` and `revalidate = 0`
- **Why**: Real-time content updates are critical for CMS experience
- **Impact**: Pages appear immediately after creation

**Next.js 15 Params Handling**
- **Problem**: Next.js 15 requires `params` to be awaited before accessing properties
- **Solution**: Updated dynamic route handlers to use `await params`
- **Why**: Next.js 15 made params async for better performance
- **Impact**: Eliminates runtime warnings and future-proofs code

**Auto-Publish New Pages**
- **Problem**: Created pages defaulted to unpublished, requiring extra step
- **Solution**: Changed `createPage()` to set `published: true` by default
- **Why**: Better UX for quick demos and content creation
- **Impact**: Created pages immediately visible in public gallery

### Dependencies Added

```json
{
  "next-auth": "^4.24.11",        // Authentication
  "@vercel/postgres": "^0.10.0",  // Database
  "bcryptjs": "^2.4.3",           // Password hashing
  "@types/bcryptjs": "^2.4.6"     // TypeScript types
}
```

**Why These Dependencies:**
- **next-auth**: Most popular Next.js auth solution, well-maintained
- **@vercel/postgres**: Official Vercel database client, optimized for edge
- **bcryptjs**: Pure JavaScript bcrypt implementation, no native dependencies
- **@types/bcryptjs**: Type safety for bcrypt operations

### Documentation

**README.md Updates**
- Complete rewrite to document admin/public architecture
- Added authentication setup instructions
- Database configuration guide
- API endpoint documentation
- Security best practices
- Deployment instructions
- **Why**: Comprehensive guide for developers and future maintenance

**SETUP.md Created**
- Step-by-step setup guide
- Quick start instructions
- Credential generation guide
- Troubleshooting section
- **Why**: Onboarding documentation for new developers

**SPEC.md Updates**
- Documented admin/public architecture
- Added data models
- Updated feature checklist
- **Why**: Technical reference for system design

### Security Improvements

**Server-Side Authentication**
- All admin routes protected with `requireAuth()` middleware
- Session validation on every request
- Unauthorized requests return 401
- **Why**: Prevents unauthorized access to admin functionality

**CORS Protection**
- Maintained existing `/api/proxy` whitelist
- Admin APIs reject cross-origin requests
- **Why**: Prevents CSRF and unauthorized API access

**Environment Variable Security**
- Credentials never committed to repository
- `.env.local` in `.gitignore`
- Credential generation script for secure setup
- **Why**: Prevents credential leaks and security breaches

**Password Security**
- Bcrypt with 10 salt rounds
- No plain-text passwords stored
- Hardcoded fallback hash for development only
- **Why**: Industry-standard password security

### Technical Improvements

**Force-Dynamic Rendering**
- Disabled Next.js caching on dynamic pages
- Real-time content updates
- **Why**: CMS requires fresh data on every request

**Type Safety**
- Full TypeScript types for all new code
- NextAuth session types
- Database operation types
- **Why**: Catch errors at compile-time, better developer experience

**Code Organization**
- Separated admin and public components
- Dedicated API route structure
- Modular authentication helpers
- **Why**: Maintainable codebase with clear separation of concerns

---

## [0.4.1] - 2025-11-14

### Added - Photo Flip Feature

**What:** Ability to flip photo to add text on back (newspaper clipping style)
**Why:** Enhance storytelling capability; mimic physical photo annotation

- Flip button in toolbar
- Double-click to edit back text
- Newspaper clipping aesthetic (Georgia font, cream background)
- Text persists to localStorage
- **Why**: Adds narrative dimension to scrapbook pages

---

## [0.4.0] - 2025-11-13

### Initial Implementation

**What:** Core Light Table scrapbook application
**Why**: Foundation for analog-feeling digital scrapbook

- Single Polaroid frame display
- Zoom & pan controls
- Photo cycling
- Tape overlays
- CORS-safe image loading
- PixiJS graphics engine
- Zustand state management
- **Why**: Creates tactile, intimate scrapbook experience

---

## Migration Notes

### v0.4.x → v0.5.0

**Breaking Changes:**
1. **Authentication Required**: Admin features now require login
2. **Environment Variables**: Must configure `.env.local` with auth credentials
3. **Public Access**: Root path (`/`) now shows public gallery instead of editor

**Migration Steps:**
1. Run `node scripts/generate-credentials.js YOUR_PASSWORD` to generate hash
2. Create `.env.local` with required variables:
   ```env
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   NEXTAUTH_URL=http://localhost:3000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=<from-step-1>
   POSTGRES_URL=<optional-for-production>
   ```
3. Restart development server
4. Access admin at `http://localhost:3000/admin/login`

**Data Migration:**
- In-memory data does NOT persist from v0.4.x
- For production: Set up Vercel Postgres and import existing data

---

## Future Roadmap

### Planned Features
- Email/social authentication (OAuth)
- Image upload to cloud storage (Cloudinary/S3)
- Multi-photo layouts per page
- Commenting system
- Social sharing
- Mobile app (React Native)
- Collaborative scrapbooks

### Technical Debt
- Add integration tests (Playwright)
- Improve error handling
- Add request rate limiting
- Implement proper logging
- Performance profiling

---

## Development Guidelines

### Before Adding New Features

**IMPORTANT**: Always read all documentation files before starting:
1. `README.md` - Project overview and setup
2. `SPEC.md` - Technical specification and architecture
3. `SETUP.md` - Setup and configuration guide
4. `CHANGELOG.md` - History of changes and why they were made

**Why**: Understanding existing architecture prevents duplicate work and maintains consistency.

### Commit Message Format

Use conventional commits:
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

Include **What** and **Why** in commit descriptions.

---

## Credits

**Project Owner**: Tommy Minter
**AI Assistant**: Claude (Anthropic)
**Authentication**: NextAuth.js
**Database**: Vercel Postgres
**Framework**: Next.js 15 (App Router)
**Graphics**: PixiJS 8

---

## License

All rights reserved.