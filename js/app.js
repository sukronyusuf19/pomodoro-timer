/* -------------------------------------------------------------
 * POMODORO PRO - APP INITIALIZER (MAIN SYSTEM GLUE)
 * ------------------------------------------------------------- */

// Comprehensive i18n Language Map
const LOCALES = {
  en: {
    badge_focus: "FOCUS SESSION",
    badge_break: "BREAK SESSION",
    btn_start: "Start",
    btn_pause: "Pause",
    btn_reset: "Reset",
    btn_skip: "Skip",
    btn_restart: "Restart",
    title_todo: "To-Do List",
    title_notes: "Session Notes",
    title_music_playlist: "Music & Playlists",
    vol_music: "Music",
    vol_notif: "Beep",
    sub_ambient: "Ambient Sounds",
    ambient_rain: "Rain",
    ambient_forest: "Forest",
    ambient_cafe: "Cafe",
    ambient_typing: "Typing",
    ambient_white: "Noise",
    sub_playlist: "Focus Tracks",
    mode_shuffle: "Shuffle",
    mode_repeat_off: "Off",
    mode_repeat_one: "One",
    mode_repeat_all: "All",
    drag_drop_text: "Drop MP3 files to add",
    add_music: "Add Focus Music",
    choose_beep: "Choose Alert sound",
    title_stats: "Productivity Dashboard",
    stat_streak: "Day Streak",
    stat_target: "Daily Target",
    metric_focus_time: "Total Focus",
    metric_completed: "Completed",
    metric_longest: "Longest Focus",
    stats_weekly_chart: "Weekly Productivity",
    settings_title: "Configuration",
    set_durations: "Intervals (Minutes)",
    set_focus_dur: "Focus",
    set_break_dur: "Break",
    set_automation: "Automation",
    set_auto_focus: "Auto Start Focus",
    set_auto_break: "Auto Start Break",
    set_theme: "Theme Preset",
    set_general: "General Settings",
    set_lang: "Language",
    set_browser_notif: "System Notifications",
    set_confetti: "Target Confetti",
    set_shortcuts: "Keyboard Shortcuts",
    sc_play_pause: "Start / Pause",
    sc_reset: "Reset Timer",
    sc_skip: "Skip Session",
    sc_fullscreen: "Fullscreen",
    sc_settings: "Open Settings",
    sc_mute: "Mute Audio",
    set_backup: "Data Backup",
    btn_export: "Export Settings",
    btn_import: "Import Settings",
    btn_clear_all: "Reset Data",
    btn_exit_focus: "Exit Focus Mode",
    notif_focus_title: "Focus Finished!",
    notif_focus_body: "Time to take a break ☕",
    notif_break_title: "Break Finished!",
    notif_break_body: "Let's get back to work 🍅"
  },
  id: {
    badge_focus: "SESI FOKUS",
    badge_break: "SESI ISTIRAHAT",
    btn_start: "Mulai",
    btn_pause: "Jeda",
    btn_reset: "Atur Ulang",
    btn_skip: "Lewati",
    btn_restart: "Mulai Sesi",
    title_todo: "Daftar Tugas",
    title_notes: "Catatan Sesi",
    title_music_playlist: "Musik & Playlist",
    vol_music: "Musik",
    vol_notif: "Beep",
    sub_ambient: "Suara Latar",
    ambient_rain: "Hujan",
    ambient_forest: "Hutan",
    ambient_cafe: "Kafe",
    ambient_typing: "Ketikan",
    ambient_white: "Noise",
    sub_playlist: "Lagu Fokus",
    mode_shuffle: "Acak",
    mode_repeat_off: "Mati",
    mode_repeat_one: "Satu",
    mode_repeat_all: "Semua",
    drag_drop_text: "Lepaskan file MP3 untuk menambah",
    add_music: "Tambah Musik Fokus",
    choose_beep: "Pilih suara alarm",
    title_stats: "Dashboard Produktivitas",
    stat_streak: "Streak Harian",
    stat_target: "Target Sesi",
    metric_focus_time: "Total Fokus",
    metric_completed: "Selesai",
    metric_longest: "Fokus Terlama",
    stats_weekly_chart: "Produktivitas Mingguan",
    settings_title: "Konfigurasi",
    set_durations: "Interval (Menit)",
    set_focus_dur: "Fokus",
    set_break_dur: "Istirahat",
    set_automation: "Otomatisasi",
    set_auto_focus: "Mulai Otomatis Fokus",
    set_auto_break: "Mulai Otomatis Istirahat",
    set_theme: "Pilihan Tema",
    set_general: "Pengaturan Umum",
    set_lang: "Bahasa",
    set_browser_notif: "Notifikasi Sistem",
    set_confetti: "Target Konfeti",
    set_shortcuts: "Pintasan Keyboard",
    sc_play_pause: "Mulai / Jeda Sesi",
    sc_reset: "Reset Timer",
    sc_skip: "Lewati Sesi",
    sc_fullscreen: "Layar Penuh",
    sc_settings: "Buka Pengaturan",
    sc_mute: "Bungkam Audio",
    set_backup: "Cadangan Data",
    btn_export: "Ekspor Pengaturan",
    btn_import: "Impor Pengaturan",
    btn_clear_all: "Reset Data",
    btn_exit_focus: "Keluar Mode Fokus",
    notif_focus_title: "Fokus Selesai!",
    notif_focus_body: "Saatnya istirahat sejenak ☕",
    notif_break_title: "Istirahat Selesai!",
    notif_break_body: "Ayo kembali fokus belajar 🍅"
  }
};

class PomodoroApp {
  constructor() {
    this.config = StorageManager.load();
    this.timer = new PomodoroTimer();
    this.audio = new AudioController();
    this.stats = new StatisticsController();
    this.settingsPanel = new SettingsController();
    
    this.customAlertUrl = null;
    this.isFullscreenFocus = false;
  }

  init() {
    // 1. Initialise Settings and load values to Sidebar fields
    this.settingsPanel.init(this);
    this.settingsPanel.loadUI(this.config);

    // 2. Initialise Stats Dashboard (Canvas drawing & counts)
    const canvas = document.getElementById('weeklyChart');
    this.stats.init(canvas, this.config);
    this.updateStatsUI();

    // 3. Initialise System notifications API permissions
    NotificationManager.init(this.config.enableBrowserNotifications);

    // 4. Connect Audio Settings and Volume controls
    this.audio.setMusicVolume(this.config.musicVolume);
    this.audio.setNotifVolume(this.config.notifVolume);
    this.audio.setTracks(this.config.playlist, this.config.currentPlaylistIndex);
    if (this.config.isMuted) this.audio.toggleMute();
    this.audio.isShuffle = this.config.isShuffle;
    this.audio.repeatMode = this.config.repeatMode;

    this.syncAudioUI();

    // 5. Build Timer State Rules & callbacks
    this.timer.setDurations(this.config.focusDuration, this.config.breakDuration);
    this.timer.onTickCallback = (secondsLeft, totalSeconds) => this.onTimerTick(secondsLeft, totalSeconds);
    this.timer.onCompleteCallback = (finishedMode) => this.onTimerComplete(finishedMode);
    this.timer.onStatusChangeCallback = (status) => this.onTimerStatusChange(status);

    // 6. Bind remaining UI Interactions
    this.bindAppInteractions();
    this.applyTheme(this.config.theme);
    this.applyLanguage(this.config.language);
    
    this.setupBackgroundBubbles();
    this.loadTaskList();
    this.loadNotes();

    // Force draw statistics chart once theme loaded
    setTimeout(() => {
      this.stats.renderChart();
    }, 100);

    // Lucide Icon parser init
    lucide.createIcons();
  }

  /* -------------------------------------------------------------
   * UI SYNCS & RENDERING METHODS
   * ------------------------------------------------------------- */
  syncDurations() {
    this.timer.setDurations(this.config.focusDuration, this.config.breakDuration);
    // Draw resetting state
    const currentModeDuration = this.timer.mode === 'focus' ? this.config.focusDuration : this.config.breakDuration;
    const formatted = PomodoroTimer.formatTime(currentModeDuration * 60);
    
    document.getElementById('timeFocus').textContent = PomodoroTimer.formatTime(this.config.focusDuration * 60);
    document.getElementById('timeBreak').textContent = PomodoroTimer.formatTime(this.config.breakDuration * 60);
    
    if (this.timer.status === 'idle') {
      document.getElementById('focusScreenTimerText').textContent = formatted;
      this.resetRingProgress();
    }
    
    StorageManager.save(this.config);
  }

  syncAudioUI() {
    document.getElementById('sliderMusicVol').value = this.config.musicVolume;
    document.getElementById('valMusicVol').textContent = `${this.config.musicVolume}%`;
    document.getElementById('sliderNotifVol').value = this.config.notifVolume;
    document.getElementById('valNotifVol').textContent = `${this.config.notifVolume}%`;

    const muteBtn = document.getElementById('btnMute');
    muteBtn.innerHTML = this.audio.isMuted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
    
    const shuffleBtn = document.getElementById('btnShuffle');
    if (this.config.isShuffle) shuffleBtn.classList.add('active');
    else shuffleBtn.classList.remove('active');

    const repeatBtn = document.getElementById('btnRepeat');
    const repeatTxt = document.getElementById('textRepeat');
    repeatBtn.setAttribute('data-repeat', this.config.repeatMode);
    
    if (this.config.repeatMode === 'one') {
      repeatTxt.setAttribute('data-i18n', 'mode_repeat_one');
      repeatBtn.classList.add('active');
    } else if (this.config.repeatMode === 'all') {
      repeatTxt.setAttribute('data-i18n', 'mode_repeat_all');
      repeatBtn.classList.add('active');
    } else {
      repeatTxt.setAttribute('data-i18n', 'mode_repeat_off');
      repeatBtn.classList.remove('active');
    }
    
    this.applyLanguage(this.config.language);
    this.renderPlaylistUI();
    lucide.createIcons();
  }

  updateStatsUI() {
    document.getElementById('statsStreak').textContent = this.config.streak;
    document.getElementById('statsFocusCompleted').textContent = this.config.totalFocusSessions;
    document.getElementById('statsSessionsCount').textContent = this.config.completedSessionsToday;
    document.getElementById('statsDailyTarget').textContent = this.config.dailyTarget;
    
    // Format minutes nicely
    const totalMinutes = this.config.totalFocusTime;
    document.getElementById('statsTotalFocusTime').textContent = totalMinutes >= 60 ? 
      `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`;
      
    document.getElementById('statsLongestFocus').textContent = `${this.config.longestFocusSession}m`;
  }

  renderPlaylistUI() {
    const list = document.getElementById('trackList');
    list.innerHTML = '';

    this.config.playlist.forEach((track, index) => {
      const item = document.createElement('li');
      item.className = `track-item ${index === this.config.currentPlaylistIndex ? 'active' : ''}`;
      item.setAttribute('data-index', index);
      
      const discIcon = index === this.config.currentPlaylistIndex && this.timer.status === 'running' && this.timer.mode === 'focus' ?
        '<i data-lucide="disc" class="rotating-disc"></i>' : '<i data-lucide="music"></i>';

      item.innerHTML = `
        ${discIcon}
        <span class="track-name">${track.name}</span>
        <span class="track-duration">${track.duration}</span>
      `;
      
      item.addEventListener('click', () => {
        this.config.currentPlaylistIndex = index;
        this.audio.currentTrackIndex = index;
        StorageManager.save(this.config);
        
        // Highlight active track
        const children = list.querySelectorAll('.track-item');
        children.forEach(c => c.classList.remove('active'));
        item.classList.add('active');

        if (this.timer.status === 'running' && this.timer.mode === 'focus') {
          this.audio.playMusic();
        }
        lucide.createIcons();
      });

      list.appendChild(item);
    });
    lucide.createIcons();
  }

  applyTheme(themeName) {
    const body = document.body;
    // Strip other theme classes
    body.className = body.className.replace(/theme-\w+/g, '');
    body.classList.add(`theme-${themeName}`);

    this.config.theme = themeName;
    StorageManager.save(this.config);

    // Redraw graphs since colors are loaded dynamically from computed body colors
    this.stats.renderChart();
  }

  applyLanguage(lang) {
    const data = LOCALES[lang] || LOCALES['en'];
    
    // Find all tags with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (data[key]) {
        el.textContent = data[key];
      }
    });

    // Handle form input placeholders separately
    const taskInput = document.getElementById('taskInput');
    taskInput.placeholder = lang === 'id' ? "Tambah tugas fokus..." : "Add a focus task...";

    const notesArea = document.getElementById('notesArea');
    notesArea.placeholder = lang === 'id' ? 
      "Tuliskan ide, catatan, atau coretan selama sesi Anda..." : 
      "Write down ideas, notes, or scratchpads during your session...";
  }

  /* -------------------------------------------------------------
   * APP ACTIONS BINDINGS
   * ------------------------------------------------------------- */
  bindAppInteractions() {
    // 1. Play, Pause, Reset, Skip, Restart controls
    document.getElementById('btnStart').addEventListener('click', () => this.togglePlayState());
    document.getElementById('btnPause').addEventListener('click', () => this.togglePlayState());
    document.getElementById('btnReset').addEventListener('click', () => this.timer.reset());
    document.getElementById('btnSkip').addEventListener('click', () => this.timer.skip());
    document.getElementById('btnRestartSession').addEventListener('click', () => this.timer.restartSession());

    // 2. Fullscreen transitions
    document.getElementById('btnFullscreen').addEventListener('click', () => this.toggleWindowFullscreen());
    document.getElementById('btnFocusScreen').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btnExitFocusScreen').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('btnFocusPlay').addEventListener('click', () => this.togglePlayState());
    document.getElementById('btnFocusSkip').addEventListener('click', () => this.timer.skip());

    // 3. Audio Controls
    const muteBtn = document.getElementById('btnMute');
    muteBtn.addEventListener('click', () => this.toggleMuteState());

    const musVol = document.getElementById('sliderMusicVol');
    musVol.addEventListener('input', (e) => {
      const val = e.target.value;
      this.config.musicVolume = parseInt(val);
      document.getElementById('valMusicVol').textContent = `${val}%`;
      this.audio.setMusicVolume(this.config.musicVolume);
      StorageManager.save(this.config);
    });

    const notVol = document.getElementById('sliderNotifVol');
    notVol.addEventListener('input', (e) => {
      const val = e.target.value;
      this.config.notifVolume = parseInt(val);
      document.getElementById('valNotifVol').textContent = `${val}%`;
      this.audio.setNotifVolume(this.config.notifVolume);
      StorageManager.save(this.config);
    });

    // Ambient click sounds selector
    const ambBtns = document.querySelectorAll('.btn-ambient');
    ambBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const soundType = btn.getAttribute('data-ambient');
        const active = this.audio.toggleAmbient(soundType);
        
        ambBtns.forEach(b => b.classList.remove('active'));
        if (active) {
          btn.classList.add('active');
        }
      });
    });

    // Playlist options
    document.getElementById('btnShuffle').addEventListener('click', () => {
      this.config.isShuffle = !this.config.isShuffle;
      this.audio.isShuffle = this.config.isShuffle;
      StorageManager.save(this.config);
      this.syncAudioUI();
    });

    document.getElementById('btnRepeat').addEventListener('click', () => {
      let currentMode = this.config.repeatMode;
      let nextMode = 'none';
      if (currentMode === 'none') nextMode = 'all';
      else if (currentMode === 'all') nextMode = 'one';
      
      this.config.repeatMode = nextMode;
      this.audio.repeatMode = nextMode;
      StorageManager.save(this.config);
      this.syncAudioUI();
    });

    // Track ended playlist propagation callback link
    this.audio.onTrackEndedCallback = () => {
      if (this.config.repeatMode === 'one') {
        this.audio.playMusic();
      } else {
        this.audio.playNext();
        this.config.currentPlaylistIndex = this.audio.currentTrackIndex;
        StorageManager.save(this.config);
        this.renderPlaylistUI();
      }
    };

    // Custom File Pickers
    document.getElementById('inputMusicFile').addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      files.forEach(file => {
        const url = URL.createObjectURL(file);
        this.config.playlist.push({
          name: file.name.replace(/\.[^/.]+$/, ""), // Strip file extension
          duration: 'Local File',
          fileUrl: url
        });
      });
      
      StorageManager.save(this.config);
      this.renderPlaylistUI();
    });

    document.getElementById('inputNotifFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.customAlertUrl = URL.createObjectURL(file);
      alert(this.config.language === 'id' ? "Suara alarm kustom dipilih!" : "Custom alert chime loaded!");
    });

    // Task input submission form
    document.getElementById('taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('taskInput');
      const text = input.value.trim();
      if (!text) return;

      this.addTask(text);
      input.value = '';
    });

    // Task drop file zone handler
    const dropZone = document.getElementById('trackDropZone');
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3'));
      if (files.length === 0) return;

      files.forEach(file => {
        const url = URL.createObjectURL(file);
        this.config.playlist.push({
          name: file.name.replace(/\.[^/.]+$/, ""),
          duration: 'Local File',
          fileUrl: url
        });
      });

      StorageManager.save(this.config);
      this.renderPlaylistUI();
    });

    // Notes auto saving on keyboard inputs
    const notesInput = document.getElementById('notesArea');
    notesInput.addEventListener('input', (e) => {
      this.config.notes = e.target.value;
      StorageManager.save(this.config);
    });

    // Export stats to CSV button binding
    document.getElementById('btnExportCSV').addEventListener('click', () => {
      this.stats.exportCSV();
    });

    // Direct mode click card triggers (Focus <-> Break switches manually)
    document.getElementById('cardFocus').addEventListener('click', () => {
      if (this.timer.status !== 'running' && this.timer.mode !== 'focus') {
        this.timer.switchMode('focus');
        this.syncModeCardsUI();
      }
    });

    document.getElementById('cardBreak').addEventListener('click', () => {
      if (this.timer.status !== 'running' && this.timer.mode !== 'break') {
        this.timer.switchMode('break');
        this.syncModeCardsUI();
      }
    });
  }

  togglePlayState() {
    this.audio.init(); // Initialize audio context
    if (this.timer.status === 'running') {
      this.timer.pause();
    } else {
      this.timer.start();
    }
  }

  toggleMuteState() {
    const isMuted = this.audio.toggleMute();
    this.config.isMuted = isMuted;
    StorageManager.save(this.config);
    this.syncAudioUI();
  }

  /* -------------------------------------------------------------
   * DYNAMIC TIMER EVENTS LISTENERS
   * ------------------------------------------------------------- */
  onTimerTick(secondsLeft, totalSeconds) {
    const formatted = PomodoroTimer.formatTime(secondsLeft);
    const mode = this.timer.mode;

    // Update main grid timers
    if (mode === 'focus') {
      document.getElementById('timeFocus').textContent = formatted;
    } else {
      document.getElementById('timeBreak').textContent = formatted;
    }

    // Update Fullscreen Focus panel timer text
    document.getElementById('focusScreenTimerText').textContent = formatted;

    // Update SVG progress circle rings (Radius is 98, Circumference is 615.75)
    const ring = mode === 'focus' ? document.getElementById('ringFocus') : document.getElementById('ringBreak');
    const circumference = 615.75;
    const progress = (secondsLeft / totalSeconds) * circumference;
    ring.style.strokeDashoffset = circumference - progress;

    // Update tab browser title
    const emoji = mode === 'focus' ? '🍅' : '☕';
    const label = mode === 'focus' ? 'Focus' : 'Break';
    document.title = `${emoji} ${formatted} - ${label} Pro`;
  }

  onTimerComplete(mode) {
    // 1. Play alert chimes
    this.audio.playAlert(this.customAlertUrl);

    const isIndo = this.config.language === 'id';
    
    // 2. Trigger desktop notification alerts
    if (mode === 'focus') {
      const title = isIndo ? LOCALES.id.notif_focus_title : LOCALES.en.notif_focus_title;
      const body = isIndo ? LOCALES.id.notif_focus_body : LOCALES.en.notif_focus_body;
      NotificationManager.show(title, body);

      // Record Stats values (complete focus session minutes)
      this.stats.recordFocusSession(this.config.focusDuration);
      this.updateStatsUI();

      // Confetti animation if daily target completed!
      if (this.config.completedSessionsToday === this.config.dailyTarget && this.config.enableConfetti) {
        this.triggerTargetConfetti();
      }

    } else {
      const title = isIndo ? LOCALES.id.notif_break_title : LOCALES.en.notif_break_title;
      const body = isIndo ? LOCALES.id.notif_break_body : LOCALES.en.notif_break_body;
      NotificationManager.show(title, body);
    }

    // 3. Switch timer mode
    this.timer.switchMode();
    this.syncModeCardsUI();

    // 4. Check auto start settings rules
    const nextMode = this.timer.mode;
    const shouldAutoStart = nextMode === 'focus' ? this.config.autoStartFocus : this.config.autoStartBreak;
    
    if (shouldAutoStart) {
      setTimeout(() => {
        this.timer.start();
      }, 1000);
    }
  }

  onTimerStatusChange(status) {
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const playFocusBtn = document.getElementById('btnFocusPlay');
    
    if (status === 'running') {
      btnStart.classList.add('hidden');
      btnPause.classList.remove('hidden');
      playFocusBtn.innerHTML = '<i data-lucide="pause"></i>';
      
      // Start focus music if mode is Focus
      if (this.timer.mode === 'focus') {
        this.audio.playMusic();
      }
      
      document.getElementById('focusScreenOverlay').classList.add('playing');

    } else {
      btnStart.classList.remove('hidden');
      btnPause.classList.add('hidden');
      playFocusBtn.innerHTML = '<i data-lucide="play"></i>';
      
      // Stop background music
      this.audio.stopMusic();
      
      document.getElementById('focusScreenOverlay').classList.remove('playing');
    }
    
    this.syncModeCardsUI();
    lucide.createIcons();
  }

  syncModeCardsUI() {
    const currentMode = this.timer.mode;
    document.body.setAttribute('data-mode', currentMode);

    const isFocus = currentMode === 'focus';
    const cardFocus = document.getElementById('cardFocus');
    const cardBreak = document.getElementById('cardBreak');

    if (isFocus) {
      cardFocus.classList.add('active');
      cardBreak.classList.remove('active');
      document.getElementById('focusScreenBadge').textContent = this.config.language === 'id' ? 
        LOCALES.id.badge_focus : LOCALES.en.badge_focus;
    } else {
      cardFocus.classList.remove('active');
      cardBreak.classList.add('active');
      document.getElementById('focusScreenBadge').textContent = this.config.language === 'id' ? 
        LOCALES.id.badge_break : LOCALES.en.badge_break;
    }
    
    this.resetRingProgress();
  }

  resetRingProgress() {
    const ringFocus = document.getElementById('ringFocus');
    const ringBreak = document.getElementById('ringBreak');
    const circumference = 615.75;
    
    ringFocus.style.strokeDashoffset = 0;
    ringBreak.style.strokeDashoffset = 0;
  }

  /* -------------------------------------------------------------
   * TASK LIST MANAGER METHODS
   * ------------------------------------------------------------- */
  loadTaskList() {
    const container = document.getElementById('taskList');
    container.innerHTML = '';

    const sortedTasks = [...this.config.tasks].sort((a,b) => a.completed - b.completed);
    
    let completedCount = 0;
    sortedTasks.forEach(task => {
      if (task.completed) completedCount++;
      
      const item = document.createElement('li');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <div class="task-item-left">
          <div class="task-checkbox-wrapper">
            <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task done">
            <div class="task-checkbox-custom"></div>
          </div>
          <span class="task-text">${task.text}</span>
        </div>
        <button class="btn-task-delete" aria-label="Delete task">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      // Complete toggle check
      item.querySelector('.task-checkbox-wrapper input').addEventListener('change', (e) => {
        task.completed = e.target.checked;
        StorageManager.save(this.config);
        this.loadTaskList();
        this.updateActiveFocusTaskIndicator();
      });

      // Delete action click
      item.querySelector('.btn-task-delete').addEventListener('click', () => {
        this.config.tasks = this.config.tasks.filter(t => t.id !== task.id);
        StorageManager.save(this.config);
        this.loadTaskList();
        this.updateActiveFocusTaskIndicator();
      });

      container.appendChild(item);
    });

    const isIndo = this.config.language === 'id';
    document.getElementById('taskCount').textContent = isIndo ? 
      `${completedCount} tugas selesai` : `${completedCount} completed`;

    this.updateActiveFocusTaskIndicator();
    lucide.createIcons();
  }

  addTask(text) {
    const newTask = {
      id: Date.now().toString(),
      text: text,
      completed: false
    };

    this.config.tasks.push(newTask);
    StorageManager.save(this.config);
    this.loadTaskList();
  }

  updateActiveFocusTaskIndicator() {
    const focusLabel = document.getElementById('focusScreenTask');
    const isIndo = this.config.language === 'id';
    
    const activeTasks = this.config.tasks.filter(t => !t.completed);
    
    if (activeTasks.length > 0) {
      focusLabel.textContent = isIndo ? `Fokus Saat Ini: ${activeTasks[0].text}` : `Current Focus: ${activeTasks[0].text}`;
      focusLabel.style.opacity = 1;
    } else {
      focusLabel.textContent = isIndo ? "Tidak ada tugas aktif." : "No active task.";
      focusLabel.style.opacity = 0.5;
    }
  }

  loadNotes() {
    document.getElementById('notesArea').value = this.config.notes || '';
  }

  /* -------------------------------------------------------------
   * SCREEN LAYOUT ACTIONS
   * ------------------------------------------------------------- */
  toggleWindowFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          document.getElementById('btnFullscreen').innerHTML = '<i data-lucide="minimize"></i>';
          lucide.createIcons();
        })
        .catch(err => console.error("Could not trigger Fullscreen API", err));
    } else {
      document.exitFullscreen();
      document.getElementById('btnFullscreen').innerHTML = '<i data-lucide="expand"></i>';
      lucide.createIcons();
    }
  }

  toggleFullscreen() {
    const focusOverlay = document.getElementById('focusScreenOverlay');
    this.isFullscreenFocus = !this.isFullscreenFocus;

    if (this.isFullscreenFocus) {
      focusOverlay.classList.add('open');
      focusOverlay.setAttribute('aria-hidden', 'false');
      
      // Load current timer tick state
      const currentFormatted = PomodoroTimer.formatTime(this.timer.timeLeft);
      document.getElementById('focusScreenTimerText').textContent = currentFormatted;

      const isPlaying = this.timer.status === 'running';
      if (isPlaying) focusOverlay.classList.add('playing');
      else focusOverlay.classList.remove('playing');

      this.updateActiveFocusTaskIndicator();
    } else {
      focusOverlay.classList.remove('open');
      focusOverlay.setAttribute('aria-hidden', 'true');
    }
    
    lucide.createIcons();
  }

  // Draw floating particles backdrop for premium moving visuals
  setupBackgroundBubbles() {
    const container = document.getElementById('particlesContainer');
    const count = 15;

    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bg-particle';
      
      const size = Math.random() * 8 + 4;
      const left = Math.random() * 100;
      const duration = Math.random() * 12 + 8;
      const delay = Math.random() * 8;

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `-${delay}s`;

      container.appendChild(bubble);
    }
  }

  /* -------------------------------------------------------------
   * CONFETTI CELEBRATION EFFECT (Canvas-based)
   * ------------------------------------------------------------- */
  triggerTargetConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#D9B382', '#F3D8B4', '#27AE60', '#C0392B', '#FFD700', '#FF69B4'];
    const particles = [];

    // Create 120 confetti pieces
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let active = true;
    const animateConfetti = () => {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let finishedCount = 0;
      particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

        if (p.y > canvas.height) {
          finishedCount++;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (finishedCount >= particles.length) {
        active = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        requestAnimationFrame(animateConfetti);
      }
    };
    
    animateConfetti();
    
    // Stop loop after 6 seconds safety
    setTimeout(() => {
      active = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);
  }
}

// App Launch on Document Loaded
document.addEventListener('DOMContentLoaded', () => {
  window.App = new PomodoroApp();
  window.App.init();
});
