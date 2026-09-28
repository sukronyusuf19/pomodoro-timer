/* -------------------------------------------------------------
 * POMODORO PRO - NOTIFICATION MANAGER (SYSTEM ALERTS)
 * ------------------------------------------------------------- */

const NotificationManager = {
  isEnabled: false,

  init(allowNotifSetting) {
    if (!('Notification' in window)) {
      console.warn("This browser does not support desktop notifications.");
      return;
    }
    
    if (Notification.permission === 'granted' && allowNotifSetting) {
      this.isEnabled = true;
    }
  },

  requestPermission() {
    if (!('Notification' in window)) return Promise.resolve(false);

    return Notification.requestPermission().then((permission) => {
      this.isEnabled = (permission === 'granted');
      return this.isEnabled;
    });
  },

  show(title, body) {
    if (!this.isEnabled || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const icon = 'assets/icons/icon-192.png';
    const options = {
      body: body,
      icon: icon,
      badge: icon,
      vibrate: [200, 100, 200]
    };

    try {
      // Try standard Notification builder
      new Notification(title, options);
    } catch (e) {
      // Fallback for Chrome/Firefox on mobile which require registering through Service Worker
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      }
    }
  }
};
window.NotificationManager = NotificationManager;
