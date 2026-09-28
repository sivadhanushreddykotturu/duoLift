# DuoLift 🏋️‍♂️🤝

> **Zero fluff. Pure accountability.**  
> A minimalist, shared daily workout checklist and visual progress vault built for pairs.

---

## ⚡ Why I Built This

Going to the gym or doing daily workouts alone is notoriously easy to abandon. Most fitness applications on the market today are bloated with paid subscriptions, AI coach gimmicks, complex macro calculators, social feeds, and spammy push notifications.

All we really wanted was something dead simple and beautiful: **genuine mutual accountability with one person**—whether that's your gym partner, partner, or best friend.

- If you work out, you check it off.
- Your partner sees it instantly.
- You keep the shared streak burning.
- If one slacks off, the streak is on the line.

No distractions. Just tactile satisfaction, mutual motivation, and honest consistency.

---

## ✨ What It Does

- 🔗 **Instant 6-Character Pair Linking**: Generate a code or enter your buddy's 6-character invite code to sync in real time—no messy friend requests.
- 🔥 **Unified Streak & Accountability Board**: An interactive visual calendar that displays your days, your partner's days, and golden days where both crushed their workout.
- 📝 **Routine & Set Logger**: Log customized exercises, target sets, and rep counts. Tap **"Copy Yesterday's Routine"** to log in seconds when running consistent splits.
- 📸 **Visual Progress Vault**: Upload daily progress pictures powered by Cloudinary. Filter by month, view side-by-side, or isolate either your photos or your partner's.
- 🔍 **Day Inspection Modal**: Tap on any calendar day to inspect exactly what exercises, sets, and reps either of you completed.
- 🎨 **Custom Profile & Avatars**: Upload a custom profile picture or use generative minimalist avatars with custom nicknames.
- 📲 **Full Progressive Web App (PWA)**: Installable directly onto iOS Safari, Android, and Desktop as a standalone full-screen mobile app.

---

## 🚀 How Cool It Is (Engineering & Experience)

### 🎨 Tactile Minimalist UI
Built on a tactile warm clay aesthetic (`#EBEBEB`), DuoLift draws inspiration from Japanese editorial design and physical leather notebooks. Smooth pill navigation, micro-interactions, haptic feedback, and celebratory monochromatic confetti make logging workouts satisfying every single day.

### 📱 iOS PWA Anti-Cache & Auto-Update Engine
iOS Safari and standalone PWAs are infamous for aggressively caching Service Workers and static bundles, locking users into old builds without any address bar or refresh button. DuoLift fixes this completely:
1. **Automated Version Bumping**: On every `npm run build`, [`scripts/generate-version.mjs`](scripts/generate-version.mjs) generates a unique `buildId` and updates `public/version.json`.
2. **Strict Anti-Cache Headers**: Explicit `Cache-Control: no-cache, no-store, must-revalidate` headers configured in [`next.config.ts`](next.config.ts) for `/sw.js` and `/version.json`.
3. **Background Thaw & Visibility Watcher**: [`src/hooks/useAppUpdater.ts`](src/hooks/useAppUpdater.ts) listens to `visibilitychange`, `focus`, and iOS Safari `pageshow` (restoration from bfcache / background hibernation). When a new deployment is detected, it updates the Service Worker, clears stale `CacheStorage` buckets, and smoothly reloads without requiring any user action.

### 🔄 Native Pull-To-Refresh Gesture
Since native pull-to-refresh is stripped away by iOS WebKit in standalone PWA mode, DuoLift includes a custom rubber-banding gesture component ([`PullToRefresh.tsx`](src/components/pwa/PullToRefresh.tsx)) with haptic vibration (`navigator.vibrate`) to refresh buddy activity and check for app updates seamlessly.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: MongoDB with Mongoose
- **Image Storage**: Cloudinary (Direct authenticated upload signing)
- **PWA**: Custom Service Worker, Web App Manifest, CacheStorage lifecycle manager

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/sivadhanushreddykotturu/duoLift.git
cd duoLift
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/duolift?retryWrites=true&w=majority

# Cloudinary (Photo Vault)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) on your desktop or mobile browser.

### 4. Build for Production

```bash
npm run build
npm start
```
*(Every build automatically increments the build ID and syncs `version.json`)*.

---

## 📄 License

MIT © [Siva Dhanush Reddy](https://github.com/sivadhanushreddykotturu)
