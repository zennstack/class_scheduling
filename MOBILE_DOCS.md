# Mobile Implementation Guide (PlanClass)

This document outlines the transition of the PlanClass system into a cross-platform mobile application.

## 📱 Phase 1: Progressive Web App (PWA) & Responsiveness

### 1. UI Refinements
- **Bottom Navigation (`MobileNav.jsx`):** Replaced the desktop sidebar with a bottom-fixed navigation bar on small screens (Home, Calendar, Resources, Profile).
- **Adaptive Calendar:** The calendar now automatically switches to a "Day" view on mobile and "Work Week" on desktop for better readability.
- **Mobile Modals:** Transformed centered modals into "Bottom Sheets" that slide up from the bottom of the screen.
- **Scrollable Tabs:** Resource tabs now scroll horizontally to prevent cramped layouts.

### 2. PWA Foundation
- **Vite PWA Plugin:** Configured `vite-plugin-pwa` to enable offline support and "Install to Home Screen" functionality.
- **Manifest:** Defined app name (`PlanClass`), colors, and standalone display mode.

---

## 🚀 Phase 2: Native Wrapper (Capacitor)

We use **Capacitor** to wrap the React web app into a native Android/iOS shell.

### Important Commands (Run inside `/frontend`)

#### Initial Setup
```powershell
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Initialize Project
npx cap init

# Generate Android Project
npx cap add android
```

#### Mobile Connectivity (Important!)
To allow your phone to talk to your computer's backend:
1.  **Find your IP:** Run `ipconfig` and find your IPv4 (e.g., `192.168.1.51`).
2.  **Update Frontend:** Set the `baseURL` in `src/utils/api.js` to your computer's IP.
3.  **Django Server:** You **MUST** run using `python manage.py runserver 0.0.0.0:8000`.
4.  **Android Manifest:** Ensure `android:usesCleartextTraffic="true"` is set in `AndroidManifest.xml` (already done).

#### 🛠️ Troubleshooting Checklist (Next Time)
If you can't log in on a new device/network:
- [ ] Are the phone and computer on the **same WiFi**?
- [ ] Did you update the IP in `src/utils/api.js`?
- [ ] Did you run `npm run build` and `npx cap sync`?
- [ ] Is Django running with `0.0.0.0:8000`?
- [ ] Is your Windows Firewall blocking port 8000? (Try `http://[IP]:8000/api/` in the phone browser).

#### 🔄 The "Sync Cycle"
Whenever you make a change to the React code:
```powershell
npm run build     # 1. Compile web assets
npx cap sync      # 2. Push to Android folder
# Now run in Android Studio or use:
npx cap run android -l --external
```

#### Assets (Icons & Splash)
```powershell
# Install Assets Tool
npm install @capacitor/assets --save-dev

# Generate Icons and Splash Screens from assets/logo.png
npx capacitor-assets generate
```

---

## 🔧 Native Development in Android Studio

1.  **Run the App:** Click the green "Play" button in the top toolbar.
2.  **Live Reload:** To see changes instantly on your device without rebuilding:
    ```powershell
    npx cap run android -l --external
    ```
3.  **Logcat:** Use the "Logcat" tab at the bottom of Android Studio to debug and see errors.

---

## 📂 Project Structure Changes
- `frontend/src/components/MobileNav.jsx`: New mobile navigation component.
- `frontend/assets/`: Contains `logo.png` and `splash.png` (Source for mobile icons).
- `frontend/android/`: The native Android project folder.
- `frontend/capacitor.config.json`: Configuration for the native wrapper.
