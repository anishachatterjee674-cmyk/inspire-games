# ⚡ Inspire Games Portal

> **Play Without Limits.** A high-performance, zero-dependency HTML5 Canvas arcade gaming portal featuring 7 fully playable games, procedural Web Audio sound synthesis, theater mode, mobile touch controls, and a host feedback hub.

Hosted & Created by **Anisha**.

---

## 🎮 Playable Games Collection

| Game | Genre | Highlights |
| :--- | :--- | :--- |
| 🎯 **Bottle Shooter** | Target / Physics Shooter | Revolver cylinder reload, glass shattering polygon physics, floating bonus targets, TNT explosions, combo score multipliers. |
| 🔮 **Bubble Shooter** | Hexagonal Match-3 Arcade | Trajectory laser guide, wall bounce bank shots, cascading bubble drops, dynamic ceiling drops. |
| 👵 **Granny** | Stealth Survival Horror | 2.5D mansion layout, flashlight fog-of-war, noise-ripple sound detection, hiding under beds/closets, 4-lock keycard & wrench escape puzzle. |
| ♟️ **Chess (Classic & AI)** | Strategy / Board | Complete FIDE legal move validator (castling, en passant, promotion), Minimax AI with Alpha-Beta pruning (Casual, Intermediate, Grandmaster) & 2-Player Pass-and-Play. |
| 🏃 **Temple Run: Sacred Escape** | 3D Perspective Endless Runner | Dynamic curved pathway, 3-lane dodge, jump & slide obstacles, ancient coin pickups, and Demon Beast chase mechanics. |
| 👾 **Space Invaders** | Retro Sci-Fi Shooter | Descending alien waves, destructible defense bunkers, mystery UFO mothership, particle explosions. |
| 🔢 **2048 Neon** | Tile Puzzle | Cyberpunk glowing board, smooth tile sliding animations, undo move, high score tracking. |

---

## ✨ Features

- **Zero External Dependencies**: Pure vanilla JavaScript (ES6+), HTML5 Canvas, and modern CSS3. No Node.js build step or npm packages required.
- **Web Audio Sound Synthesizer (`audio.js`)**: Procedurally generates realistic sound effects (gunshots, glass shatter, bubble pops, horror creaks, chess knocks, victory fanfares) directly in the browser.
- **Glassmorphism & Cyberpunk UI**: Dark sleek theme, responsive layout, fluid CSS micro-animations, and animated glow effects.
- **Interactive Theater Mode**: Play in an enlarged focused overlay with pause, restart, sound toggle, and instant instructions modal.
- **Mobile Friendly**: Auto-detects touch devices and displays responsive on-screen touch controls (D-Pad, Action buttons).
- **Confidential Host Hub**: Players can submit bug reports and feedback directly to host Anisha through a private, secure in-portal form.

---

## 🚀 How to Run Locally

### Option 1: Direct File Launch
Simply double-click **`index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).

### Option 2: Local Python Server (Recommended)
```bash
# In the inspire-games directory:
python -m http.server 8000
```
Then visit **`http://localhost:8000`** in your browser.

---

## 🌐 Free Deployment via GitHub Pages

1. Create a new repository on [GitHub](https://github.com) named `inspire-games`.
2. Upload all the files (`index.html`, `css/`, `js/`, `assets/`, `README.md`).
3. Go to **Settings** ➔ **Pages**.
4. Under **Branch**, select `main` (or `master`) and folder `/ (root)`, then click **Save**.
5. Your game portal will be live on the web at:
   `https://<your-username>.github.io/inspire-games/`

---

## 📁 Project Structure

```
inspire-games/
├── index.html              # Main portal UI, hero banner, game catalog & host modal
├── README.md               # Documentation and guides
├── css/
│   └── style.css           # Glassmorphism styling, responsive layouts & animations
├── js/
│   ├── app.js              # Portal controller, search/filters, theater mode & inbox
│   ├── audio.js            # Web Audio API procedural sound synthesizer
│   └── games/
│       ├── bottle-shooter.js  # Bottle target shooter engine
│       ├── bubble-shooter.js  # Bubble Bobble match-3 engine
│       ├── granny.js          # Granny stealth horror mansion engine
│       ├── chess.js           # FIDE chess engine & Minimax AI
│       ├── temple-run.js      # 3D perspective endless runner engine
│       ├── space-invaders.js  # Retro alien shooter engine
│       └── 2048.js            # Neon sliding number puzzle engine
└── assets/                 # Custom sprites and icons (optional)
```

---

## 📜 License
MIT License. Created with ❤️ for gamers worldwide.
