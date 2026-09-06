# CartKaro Admin Panel

The control center for the CartKaro ecosystem — built with **React, Tailwind CSS, and Firebase**.

Currently active module: **Partner Hub Management** (verify partners, review legal documents, approve/reject registrations, and manage update requests). Customer Management and Delivery Partner Management are shown on the dashboard as disabled "Coming Soon" modules, ready to be built later.

---

## 1. Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Admin login

This panel uses Firebase Authentication with email/password login. It has no public registration page: only accounts with the Firebase custom claim `admin: true` can enter. A `superAdmin: true` user can create further admin accounts from **Settings → Admin access**.

Do not put passwords in `.env`: all `VITE_` values are included in the browser build.

---

## 2. Connecting Firebase

Until you connect a real Firebase project, the app runs in **demo mode** — the dashboard, partner list, partner detail, and update requests pages all show realistic sample data so you can see the full UI immediately.

To connect your project:

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase config values (Firebase Console → Project Settings → General → Your apps → SDK setup and configuration).
3. Restart `npm run dev`.

The app will automatically detect the config and start reading/writing real data from:

- **`partners`** — partner registrations (`ownerDetails`, `businessDetails`, `categories`, `businessTiming`, `legalDocuments`, `bankDetails`, `deliverySettings`, `agreement`, `verificationStatus`, `isActive`, `createdAt`)
- **`partnerUpdateRequests`** — pending settings-change requests from the Partner Hub App
- **`admins`** — admin users (`email`, `role`), for when you switch on Firebase Authentication

Firebase Storage paths expected by the registration apps: `profileImages/`, `businessImages/`, `documents/`, `bankDocuments/`. This admin panel only **reads** the resulting URLs — it doesn't upload files.

### Admin setup and deployment

1. In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
2. Create the first user in Firebase Console → Authentication → Users.
3. Firebase Console → Project settings → Service accounts → Generate new private key. Keep this JSON file outside the repository. Grant the first user both `admin: true` and `superAdmin: true` using the included trusted local script (replace the placeholders with your actual path and email):

```bash
npm --prefix functions install
node functions/scripts/grant-super-admin.mjs /absolute/path/to/service-account.json admin@yourcompany.com
```

This must never be done from browser code.
4. Install and deploy the included Cloud Function, which lets only that Super Admin create normal admin accounts:

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only functions,firestore:rules,storage
```

After a claim is granted, the user must sign out and sign in again. The included `firestore.rules` and `storage.rules` deny database and document access to anyone who is not an authenticated Firebase admin.

---

## 3. Project Structure

```
src/
  firebase/
    firebaseConfig.js     Firebase init (safe to keep even without real keys)
    authConfig.js          Hardcoded admin username/password
    partnerService.js      All Firestore reads/writes (with demo-data fallback)
  context/
    AuthContext.jsx         Login state, persisted in localStorage
  components/
    Layout.jsx, Sidebar.jsx, Topbar.jsx
    StatCard.jsx, StatusBadge.jsx, SectionCard.jsx, DocumentCard.jsx
    Feedback.jsx            Loader / EmptyState / ConfirmDialog
    ProtectedRoute.jsx
  pages/
    Login.jsx, Dashboard.jsx, Settings.jsx, ComingSoon.jsx
    PartnerHub/
      PartnerDashboard.jsx   Overview stats
      PartnerList.jsx        Search, filter, table of all partners
      PartnerDetail.jsx       8-section verification workflow + approve/reject
      UpdateRequests.jsx      Old vs new data, approve/reject
  data/
    mockPartners.js          Demo data used when Firebase isn't connected
```

---

## 4. Adding Your Logo

Replace `public/logo.png` with your actual CartKaro logo (same filename). It's used on the sidebar, the login screen, and the browser favicon.

---

## 5. Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy it to Firebase Hosting, Vercel, Netlify, or any static host.

For Firebase Hosting, deploy the SPA and its rewrite rule using:

```bash
firebase deploy --only hosting
```

```bash
npm run preview   # preview the production build locally
```

---

## 6. Tech Stack

- React 19 + Vite
- Tailwind CSS (navy & gold theme, custom gradients/animations in `tailwind.config.js`)
- Framer Motion (page transitions, micro-interactions)
- React Router v7
- Firebase (Firestore, Storage, Auth-ready)
- lucide-react icons
