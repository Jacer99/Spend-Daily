<div align="center">

# 💸 Spend Daily

**One expense at a time. See exactly where your money goes — every day.**

[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

<!-- Add a screenshot or GIF of the app here -->
<!-- <img src="docs/screenshot.png" alt="Spend Daily screenshot" width="600" /> -->

</div>

---

## About

**Spend Daily** is a fast, no-friction expense tracker built to make logging spending a 5-second habit instead of a chore. Add an expense, watch your daily and monthly picture update instantly, and get a clear, visual read on where your money is actually going.

It's built as a modern web app — React + TypeScript on the front end, Firebase on the back end — so your data syncs in real time and is available wherever you open the app.

## ✨ Features

- **📆 Fast daily logging** — add an expense in a couple of taps, no lengthy forms
- **📊 Visual breakdowns** — interactive charts (via Recharts) turn raw transactions into a clear picture of daily and monthly spending
- **☁️ Cloud sync** — data is stored in Firebase/Firestore, so it's backed up and available across sessions and devices
- **🎉 Little wins, celebrated** — milestone and streak moments get a confetti burst, not just a number
- **🎨 Clean, icon-driven UI** — built with Lucide icons and Tailwind CSS for a light, legible interface
- **⚡ Modern, fast tooling** — Vite + TypeScript for instant dev feedback and quick builds

> Feature list reflects the current codebase — update this section as functionality evolves.

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend / Data | Firebase (Firestore) |
| Extras | canvas-confetti |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (or [Bun](https://bun.sh/), since this repo ships a `bun.lock`)
- A [Firebase](https://console.firebase.google.com/) project with Firestore enabled

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/Jacer99/Spend-Daily.git
cd Spend-Daily

# 2. Install dependencies
npm install
# or, if you prefer Bun:
bun install

# 3. Configure environment variables (see below)
cp .env.example .env.local   # create this file if it doesn't exist yet

# 4. Start the dev server
npm run dev
```

The app runs at **http://localhost:3000** by default.

### Environment variables

Spend Daily connects to Firebase, so it needs your project's credentials. Create a `.env.local` file in the project root with your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> Check the Firebase initialization file in `src/` for the exact variable names the app expects, and adjust the list above to match.

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Type-check the project (`tsc --noEmit`) |
| `npm run test` | Run the test suite (`tests/stressTest.ts`) |
| `npm run preview` | Preview the production build locally |

## 📁 Project Structure

```
Spend-Daily/
├── src/               # Application source — components, screens, logic
├── public/            # Static assets
├── shared/            # Shared types and utilities
├── tests/             # Test scripts (e.g. stressTest.ts)
├── docs/              # Project documentation
├── firestore.rules    # Firestore security rules
├── index.html         # App entry point
├── vite.config.ts     # Vite configuration
└── package.json
```

## 🔒 Firestore Rules

Database access is locked down via `firestore.rules`. If you change the data model, update the rules and deploy them alongside your app:

```bash
firebase deploy --only firestore:rules
```

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a Pull Request

Please keep PRs focused — one feature or fix per PR makes review much easier.

## 📄 License

This project is licensed under the **GPL-3.0 License** — see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with care, one logged expense at a time. 💸
</div>
