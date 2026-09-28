/* -------------------------------------------------------------
 * POMODORO PRO - STORAGE CONTROLLER (LOCAL STORAGE MANAGER)
 * ------------------------------------------------------------- */

const StorageManager = {
  KEY: 'pomodoro_pro_settings',

  getDefaults() {
    return {
      focusDuration: 50, // in minutes
      breakDuration: 10, // in minutes
      musicVolume: 70, // 0 to 100
      notifVolume: 80, // 0 to 100
      isMuted: false,
      theme: 'coffee',
      language: 'en', // 'en' or 'id'
      autoStartFocus: false,
      autoStartBreak: false,
      enableBrowserNotifications: true,
      enableConfetti: true,
      dailyTarget: 8,
      streak: 0,
      lastSessionDate: '', // 'YYYY-MM-DD'
      totalFocusSessions: 0,
      totalFocusTime: 0, // in minutes
      longestFocusSession: 0, // in minutes
      completedSessionsToday: 0,
      weeklyProductivity: {
        'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
      },
      playlist: [
        { name: 'Default Focus Track', duration: 'Loop', isDefault: true }
      ],
      currentPlaylistIndex: 0,
      isShuffle: false,
      repeatMode: 'none', // 'none', 'one', 'all'
      tasks: [],
      notes: ''
    };
  },

  load() {
    try {
      const data = localStorage.getItem(this.KEY);
      if (!data) {
        const defaults = this.getDefaults();
        this.save(defaults);
        return defaults;
      }
      const parsed = JSON.parse(data);
      const defaults = this.getDefaults();

      // Deep merge fallback keys in case version mismatch
      const merged = { ...defaults, ...parsed };
      
      // Validate streak longevity on load
      this.validateStreak(merged);
      return merged;
    } catch (e) {
      console.error("Error loading LocalStorage settings", e);
      return this.getDefaults();
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving settings to LocalStorage", e);
    }
  },

  validateStreak(data) {
    if (!data.lastSessionDate) return;

    const todayStr = this.getLocalDateString(new Date());
    const lastSessionStr = data.lastSessionDate;

    if (todayStr === lastSessionStr) return;

    const todayDate = new Date(todayStr);
    const lastSessionDate = new Date(lastSessionStr);
    
    // Check difference in days
    const diffTime = Math.abs(todayDate - lastSessionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Streak broken
      data.streak = 0;
      this.save(data);
    }

    // Reset daily sessions counter if it's a new day
    if (diffDays >= 1) {
      data.completedSessionsToday = 0;
      this.save(data);
    }
  },

  getLocalDateString(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  },

  // Export configurations to download as JSON
  exportData() {
    const data = this.load();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-pro-settings-${this.getLocalDateString(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Import configuration and replace settings
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          
          // Validate schema briefly (check key attributes)
          const defaults = this.getDefaults();
          const hasRequiredKeys = Object.keys(defaults).every(key => key in parsed || key === 'tasks' || key === 'notes');
          
          if (!hasRequiredKeys) {
            return reject("Invalid config file structure.");
          }

          this.save(parsed);
          resolve(parsed);
        } catch (err) {
          reject("Error parsing JSON file contents.");
        }
      };
      reader.onerror = () => reject("Error reading settings file.");
      reader.readAsText(file);
    });
  },

  clearAll() {
    localStorage.removeItem(this.KEY);
  }
};
