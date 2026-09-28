/* -------------------------------------------------------------
 * POMODORO PRO - SETTINGS PANEL & SHORTCUT KEYBOARD BINDINGS
 * ------------------------------------------------------------- */

class SettingsController {
  constructor() {
    this.app = null; // Reference to main app instance
    this.sidebar = document.getElementById('settingsSidebar');
    this.isOpen = false;
  }

  init(appInstance) {
    this.app = appInstance;
    this.setupListeners();
    this.bindKeyboardShortcuts();
  }

  setupListeners() {
    const openBtn = document.getElementById('btnOpenSettings');
    const closeBtn = document.getElementById('btnCloseSettings');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    // Toggle Sidebar visibility
    openBtn.addEventListener('click', () => this.open());
    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());

    // Input changes - Sync immediately to configurations
    const focusInp = document.getElementById('inputFocusDuration');
    const breakInp = document.getElementById('inputBreakDuration');
    const autoFocusCh = document.getElementById('checkAutoStartFocus');
    const autoBreakCh = document.getElementById('checkAutoStartBreak');
    const langSelect = document.getElementById('selectLanguage');
    const notifCh = document.getElementById('checkBrowserNotifications');
    const confettiCh = document.getElementById('checkConfetti');

    focusInp.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 5) val = 5;
      if (val > 180) val = 180;
      e.target.value = val;
      
      this.app.config.focusDuration = val;
      this.app.syncDurations();
    });

    breakInp.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 60) val = 60;
      e.target.value = val;

      this.app.config.breakDuration = val;
      this.app.syncDurations();
    });

    autoFocusCh.addEventListener('change', (e) => {
      this.app.config.autoStartFocus = e.target.checked;
      StorageManager.save(this.app.config);
    });

    autoBreakCh.addEventListener('change', (e) => {
      this.app.config.autoStartBreak = e.target.checked;
      StorageManager.save(this.app.config);
    });

    langSelect.addEventListener('change', (e) => {
      this.app.config.language = e.target.value;
      StorageManager.save(this.app.config);
      this.app.applyLanguage(e.target.value);
    });

    notifCh.addEventListener('change', (e) => {
      this.app.config.enableBrowserNotifications = e.target.checked;
      StorageManager.save(this.app.config);
      if (e.target.checked) {
        NotificationManager.requestPermission().then(granted => {
          if (!granted) e.target.checked = false;
        });
      }
    });

    confettiCh.addEventListener('change', (e) => {
      this.app.config.enableConfetti = e.target.checked;
      StorageManager.save(this.app.config);
    });

    // Theme preset switcher buttons
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const themeName = btn.getAttribute('data-theme');
        this.app.applyTheme(themeName);
      });
    });

    // Data operations
    document.getElementById('btnExportJSON').addEventListener('click', () => {
      StorageManager.exportData();
    });

    const fileImport = document.getElementById('inputImportJSON');
    fileImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      StorageManager.importData(file)
        .then((newConfig) => {
          alert(this.app.config.language === 'id' ? "Pengaturan berhasil di-import!" : "Settings imported successfully!");
          window.location.reload();
        })
        .catch(err => alert(err));
    });

    document.getElementById('btnClearData').addEventListener('click', () => {
      const msg = this.app.config.language === 'id' ? 
        "Apakah Anda yakin ingin menghapus semua data? Ini termasuk tugas, catatan, dan statistik produktivitas." : 
        "Are you sure you want to clear all data? This includes tasks, notes, and productivity statistics.";
      if (confirm(msg)) {
        StorageManager.clearAll();
        window.location.reload();
      }
    });
  }

  // Populate HTML fields with loaded configuration data
  loadUI(config) {
    document.getElementById('inputFocusDuration').value = config.focusDuration;
    document.getElementById('inputBreakDuration').value = config.breakDuration;
    document.getElementById('checkAutoStartFocus').checked = config.autoStartFocus;
    document.getElementById('checkAutoStartBreak').checked = config.autoStartBreak;
    document.getElementById('selectLanguage').value = config.language;
    document.getElementById('checkBrowserNotifications').checked = config.enableBrowserNotifications;
    document.getElementById('checkConfetti').checked = config.enableConfetti;

    // Set active theme button selection
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === config.theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  open() {
    this.sidebar.classList.add('open');
    this.sidebar.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
  }

  close() {
    this.sidebar.classList.remove('open');
    this.sidebar.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
  }

  // Keyboard shortcut definitions (Global bindings)
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore key events when the user is editing text inputs/textareas
      const activeTag = document.activeElement.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      // Ctrl + , -> Open Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        this.open();
        return;
      }

      // Space -> Start/Pause Timer
      if (e.code === 'Space') {
        e.preventDefault();
        this.app.togglePlayState();
        return;
      }

      // R -> Reset Timer
      if (key === 'r') {
        e.preventDefault();
        this.app.timer.reset();
        return;
      }

      // S -> Skip Current Session
      if (key === 's') {
        e.preventDefault();
        this.app.timer.skip();
        return;
      }

      // F -> Fullscreen Focus mode
      if (key === 'f') {
        e.preventDefault();
        this.app.toggleFullscreen();
        return;
      }

      // M -> Mute Music & Chimes
      if (key === 'm') {
        e.preventDefault();
        this.app.toggleMuteState();
        return;
      }
    });
  }
}
window.SettingsController = SettingsController;
