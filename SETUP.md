# Light Table Setup Guide

## ✅ What's Been Implemented

Your Light Table application now has a complete **admin/public system**:

### **Admin Features** (`/admin`)
- Username/password authentication (NextAuth.js)
- Create, edit, and delete scrapbook pages
- Publish/unpublish toggle for pages
- Full Light Table editor with all functionality:
  - Photo upload and cycling
  - Zoom & pan
  - Flip photo to add text on back
  - Loupe magnification
  - Reset camera view

### **Public Features** (`/`)
- Gallery view showing all published pages
- Read-only scrapbook viewer
- Beautiful Polaroid-style presentation
- No login required for end users

---

## 🚀 Quick Start

### 1. Access the Application

The dev server is running at: **http://localhost:3001**

### 2. Login as Admin

1. Go to: **http://localhost:3001/admin/login**
2. Use these credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

### 3. Create Your First Scrapbook Page

1. After login, you'll see the Admin Dashboard
2. Click **"+ New Page"**
3. Enter a title (e.g., "Summer Memories")
4. The slug auto-generates from the title
5. Use the Light Table editor to:
   - Click "Next Photo" to cycle through images
   - Click "Flip Over" to add text on the back
   - Zoom, pan, and arrange your photo
6. Click **"Create Page"** to save
7. Back in the dashboard, click **"Publish"** to make it live

### 4. View as End User

1. Open **http://localhost:3001** (without logging in)
2. You'll see the public gallery with all published pages
3. Click on a page to view it
4. End users can zoom/pan but **cannot edit**

---

## 🔐 Changing Your Admin Password

Run this command to generate a new password hash:

```bash
cd light-table
node scripts/generate-credentials.js YOUR_NEW_PASSWORD
```

Copy the generated `ADMIN_PASSWORD_HASH` and update it in `.env.local`

---

## 💾 Database Setup (Optional - Currently using in-memory storage)

Right now, your pages are stored in memory (they reset when you restart the server). To persist data:

### Option 1: Vercel Postgres (Recommended)

1. Create a Vercel account at https://vercel.com
2. Create a new Postgres database in your project
3. Copy the `POSTGRES_URL` from Vercel dashboard
4. Add it to `.env.local`:
   ```
   POSTGRES_URL=postgres://...
   ```
5. Run the schema setup:
   ```bash
   # Connect to your database and run:
   cat scripts/schema.sql
   ```

### Option 2: Continue with In-Memory (Development Only)

Just leave `POSTGRES_URL` empty in `.env.local`. Pages will be stored in memory and reset on restart.

---

## 📁 Project Structure

```
/admin                    → Admin dashboard (protected)
  /login                  → Login page
  /pages/new              → Create new scrapbook page
  /pages/[id]             → Edit existing page

/view/[slug]              → Public view of a scrapbook page
/                         → Public gallery (all published pages)

/api/admin/pages          → Admin API endpoints
/api/public/pages         → Public API endpoints
/api/auth/[...nextauth]   → Authentication
```

---

## 🎨 Customization

### Adding Local Photos

Place images in `/public/photos/` and they'll be available in the "Next Photo" cycle.

### Changing the Site Title

Edit `src/app/layout.tsx` and update the `metadata` object.

### Styling

The warm cream aesthetic is defined in:
- `src/app/globals.css` - Paper texture background
- Component inline styles - Polaroid frame, buttons, etc.

---

## 🐛 Troubleshooting

### "Unauthorized" Error

- Make sure you're logged in at `/admin/login`
- Check that `.env.local` has correct `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`

### Pages Not Saving

- If using Postgres, verify `POSTGRES_URL` is correct
- If using in-memory, pages reset on server restart (this is normal)

### Port 3001 Instead of 3000

- Port 3000 was in use, so the server used 3001
- You can stop the other process or just use 3001

---

## 📝 Environment Variables Reference

Your `.env.local` file should have:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=...              # Auto-generated secret
NEXTAUTH_URL=http://localhost:3001

# Admin Credentials
ADMIN_USERNAME=admin             # Change this if you want
ADMIN_PASSWORD_HASH=...          # Bcrypt hash of password

# Database (optional)
POSTGRES_URL=                    # Leave empty for in-memory storage
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Vercel settings:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `POSTGRES_URL` (create Vercel Postgres database)
4. Deploy!

Update `NEXTAUTH_URL` to your production domain:
```
NEXTAUTH_URL=https://yoursite.vercel.app
```

---

## ✨ Features Summary

| Feature | Admin | Public |
|---------|-------|--------|
| View pages | ✅ | ✅ (published only) |
| Create pages | ✅ | ❌ |
| Edit pages | ✅ | ❌ |
| Delete pages | ✅ | ❌ |
| Publish/unpublish | ✅ | ❌ |
| Zoom & pan | ✅ | ✅ |
| Flip photo & edit text | ✅ | ❌ (view only) |
| Loupe magnification | ✅ | ✅ |

---

## 🎯 Next Steps

1. **Test the workflow**: Login → Create → Publish → View as public user
2. **Add your photos**: Place images in `/public/photos/`
3. **Customize credentials**: Change the default admin password
4. **Set up database**: Add Vercel Postgres for persistence
5. **Deploy**: Push to GitHub and deploy on Vercel

---

## 💡 Tips

- **Development Workflow**: Keep the dev server running, it hot-reloads on file changes
- **Testing**: Use incognito/private browsing to test the public view without logging in
- **Multiple Pages**: Create several pages and toggle published/draft status
- **Text on Back**: Use the flip feature to add memories or notes to your photos

---

## 📞 Support

Check the technical specification: `SPEC.md`

Login credentials:
- Username: `admin`
- Password: `admin123`

Happy scrapbooking! 📸