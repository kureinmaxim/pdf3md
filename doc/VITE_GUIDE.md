# Vite Guide & Troubleshooting

This document explains how **Vite** works in the PDF3MD project, focusing on the build process, caching mechanisms, and how to troubleshoot common issues like the one encountered with the Profile System.

## ⚡ What is Vite?

Vite (French for "quick") is a build tool that aims to provide a faster and leaner development experience for modern web projects.

In **PDF3MD**, Vite handles:
1.  **Development Server**: Hot Module Replacement (HMR) for instant updates.
2.  **Building for Production**: Bundling your React code into optimized static files (`.js`, `.css`, `.html`) using **Rollup**.
3.  **Proxying**: Forwarding API requests to the Flask backend during development.

---

## 🏗️ Development vs. Production

### Development (`npm run dev`)
- **No Bundling**: files are served as native ES modules.
- **Fast Startup**: Only compiles what is needed.
- **HMR**: When you edit a component, only that component reloads.

### Production (`npm run build`)
- **Bundling**: All code is combined into a few optimized files (e.g., `index-D8s7a.js`).
- **Tree Shaking**: Removes unused code (this is why `ProfileSelector` wasn't showing initially!).
- **Minification**: Makes files smaller.
- **File Hashing**: Adds hashes to filenames for cache busting (e.g., `assets/index-HT5s2.css`).

---

## 🔍 The "Missing Component" Mystery

We encountered a situation where `ProfileSelector` existed in the code but didn't appear in the built app inside the DMG.

### Why did this happen?

1.  **Tree Shaking**: If a component is imported but seemingly "unused" (e.g., conditional rendering logic that the builder misinterprets as always false), Vite/Rollup removes it to save space.
2.  **Wrong Build Context**: Building from the root `pdf3md/` vs `pdf3md/pdf3md/` can lead to different `node_modules` or config resolutions.
3.  **Aggressive Caching**:
    *   **Vite Cache**: Stored in `node_modules/.vite/`.
    *   **Browser Cache**: Browsers aggressively cache files like `index.js` unless the filename hash changes.
    *   **PyInstaller/DMG**: The script `build_dmg.sh` might have picked up an old `dist/` folder if the build command failed or ran in the wrong directory.

### ✅ The Fix

To ensure a clean build, always follow this "Nuke & Rebuild" sequence:

```bash
# 1. Clean everything
rm -rf dist node_modules .vite package-lock.json

# 2. Re-install fresh
npm install

# 3. Build
npm run build
```

---

## 🛠️ Essential Commands

Run these from the `pdf3md/` frontend directory:

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Starts dev server on port 5173 | Daily development |
| `npm run build` | Compiles app to `dist/` | Before releasing/building DMG |
| `npm run preview` | Runs the *built* version locally | Testing the production build before deployment |

### Troubleshooting Cheatsheet

**Problem:** "My changes aren't showing up!"  
**Solution:**
1.  Open DevTools (F12) -> Network -> Check "Disable Cache".
2.  Hold `Shift` and click Refresh (Hard Reload).
3.  Run `npm run build` again and check if the file hash changed (e.g., `index-XXXX.js`).

**Problem:** "It works in Dev but not in Production (DMG)"  
**Solution:**
1.  Check for errors in the browser console of the production build.
2.  Ensure all environment variables (`import.meta.env`) are set for production.
3.  Verify that `npm run build` was actually executed by your build script (`build_dmg.sh`).

---

## 📂 Configuration (`vite.config.js`)

Our config sets up the proxy so you don't have CORS issues:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forwards /convert requests to Flask running on port 6201
      '/convert': 'http://backend:6201', 
      // ...
    }
  }
})
```
