# Pomodoro Pro - Premium Focus & Productivity App

A state-of-the-art, offline-capable Pomodoro Timer web application built with native **HTML5, CSS3, and Vanilla ES6+ JavaScript**. It features a high-fidelity coffee aesthetic, animated SVG rings, keyboard shortcuts, local statistics visualizations, interactive To-Do list integrations, browser system notifications, and a procedural Web Audio API ambient noise synthesizer.

## 🚀 Key Features

* **High-Accuracy Timing Engine:** Eliminates browser tab throttling issues using timestamp calculations (`Date.now()`) linked to an offline-isolated inline Web Worker.
* **Procedural Ambient Noise:** Generates organic, programmatically synthesized soundscapes (Rain, Forest, Cafe, Keyboard Typing, and White Noise) via the Web Audio API with zero assets download.
* **Music Playlist Manager:** Supports customized focus tracks using standard Drag-and-Drop file listeners or local file pickers with auto-progression, repeat-one, repeat-all, and shuffle.
* **Multi-Theme Presets:** Select between Coffee Aesthetic, Dark Mode, AMOLED black, Ocean Blue, Sakura Pink, and Forest Green.
* **Dynamic Stats Canvas:** Track your productivity levels, target sessions, daily streaks, and draw custom responsive high-DPI bar charts using the HTML5 Canvas API.
* **Integrated Notes & To-Do List:** Write quick scratchpads, manage active tasks, and sync the current task description inside the fullscreen mode.
* **Progressive Web App (PWA):** Installable directly on Windows, macOS, Android, and iOS devices with full offline support.
* **A11y Accessibility Compliant:** Outfitted with keyboard focus indicators, screen reader accessibility attributes, and keyboard shortcuts.

---

## 📂 Folder Structure

```
Pomodoro-Pro/
├── index.html          # Main HTML5 layout & PWA registers
├── manifest.json       # Web App Manifest for mobile installation
├── sw.js               # Service Worker caching assets for offline use
├── README.md           # Documentation guide
│
├── css/
│   ├── style.css       # Core layout variables, glassmorphic panels, and theme styles
│   ├── responsive.css  # Mobile, tablet, laptop, and viewport scale rules
│   └── animation.css   # Keyframes, floating bubbles, disk rotation, and waves
│
├── js/
│   ├── app.js          # App orchestrator, i18n triggers, confetti, and lists
│   ├── timer.js        # High-accuracy worker-based tick clocks
│   ├── audio.js        # Fading, playlist, and Web Audio API ambient synthesizers
│   ├── storage.js      # LocalStorage syncing, schema merge, and JSON export/import
│   ├── notification.js # HTML5 push notification manager with background fallbacks
│   ├── statistics.js   # Streak validation, Canvas chart engine, and CSV export
│   └── settings.js     # Form change registers and global hotkey bindings
│
└── assets/             # Subdirectories for assets override (Optional)
    ├── icons/
    ├── music/
    └── sounds/
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
A modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari). No compilers, Node.js packages, or installation steps are required.

### Running Locally
1. Clone or download this repository to your computer.
2. Double-click `index.html` to open it in your web browser.
3. *Recommended (For PWA & Notifications):* Serve the folder using a local server:
   ```bash
   # Using Python (built-in)
   python -m http.server 8000
   
   # Using Node.js (npx)
   npx serve .
   ```
   Open `http://localhost:8000` or `http://localhost:3000` in your browser.

---

## 🎵 Customizing Audio Assets

The application functions fully without local files using procedural synthesizers. However, you can configure static local overrides:

### Replacing Default Focus Music
1. Save your custom MP3 file into the directory `assets/music/` and name it `default-focus.mp3`.
2. The player will automatically load and play this track as the first index in the playlist if it detects the file path.
3. Alternatively, click **Add Focus Music** or drag and drop any number of `.mp3` files directly onto the playlist panel to load custom tracks into the playlist dynamically using object URLs.

### Replacing Default Beep Notification
1. Save your custom alarm sound file into the directory `assets/sounds/` and name it `beep.mp3`.
2. Alternatively, click **Choose Alert Sound** in the playlist section to select a local audio file (`.mp3`, `.wav`, `.ogg`) as the custom session completion chime.

---

## 🖥️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>Space</kbd> | Toggle Play / Pause Timer |
| <kbd>R</kbd> | Reset Current Timer Session |
| <kbd>S</kbd> | Skip to Next Session |
| <kbd>M</kbd> | Toggle Audio Mute State |
| <kbd>F</kbd> | Toggle Fullscreen Focus mode |
| <kbd>Ctrl + ,</kbd> | Toggle Configuration Sidebar Panel |

---

## 🌐 Deployment Guides

### Deploy to GitHub Pages
1. Create a new repository on your GitHub account.
2. Commit and push the folder files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Pomodoro Pro"
   git remote add origin https://github.com/username/repository-name.git
   git branch -M main
   git push -u origin main
   ```
3. Navigate to **Settings** > **Pages** in your GitHub repository sidebar.
4. Set the Source build to **Deploy from a branch** and select `main` (under `/root`), then click **Save**.
5. Your app will be live at `https://username.github.io/repository-name/` within a minute.

### Deploy to Netlify
1. Log in to your [Netlify Dashboard](https://app.netlify.com/).
2. Click **Add new site** > **Deploy manually**.
3. Drag and drop the `Pomodoro-Pro` folder directly onto the upload interface.
4. Your website will be compiled and live immediately under a custom subdomain.

---

## 🗺️ Roadmap

- [ ] Task sub-categorization and prioritization tags.
- [ ] Visual custom shortcut key configurations.
- [ ] Integration with cloud backup servers.
- [ ] Custom ambient sound mixture sliders.

## 📄 License
This project is licensed under the MIT License - see the LICENSE details for info.
