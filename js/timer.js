/* -------------------------------------------------------------
 * POMODORO PRO - HIGH-PRECISION TIMER MODULE
 * ------------------------------------------------------------- */

class PomodoroTimer {
  constructor() {
    this.mode = 'focus'; // 'focus' or 'break'
    this.status = 'idle'; // 'idle', 'running', 'paused'
    
    this.focusDuration = 50 * 60; // in seconds
    this.breakDuration = 10 * 60; // in seconds
    this.timeLeft = this.focusDuration;
    this.totalDuration = this.focusDuration;

    this.startTime = null;
    this.accumulatedTime = 0; // seconds already elapsed prior to pause
    
    // Callbacks
    this.onTickCallback = null;
    this.onCompleteCallback = null;
    this.onStatusChangeCallback = null;
    
    this.worker = null;
    this.setupWorker();
  }

  setupWorker() {
    // Web Worker script as inline blob to prevent throttling in background tabs
    const workerBlobCode = `
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data.action === 'start') {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => {
            self.postMessage({ type: 'tick' });
          }, 100);
        } else if (e.data.action === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `;
    const blob = new Blob([workerBlobCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
    
    this.worker.onmessage = (e) => {
      if (e.data.type === 'tick' && this.status === 'running') {
        this.tick();
      }
    };
  }

  setDurations(focusMin, breakMin) {
    this.focusDuration = focusMin * 60;
    this.breakDuration = breakMin * 60;
    
    if (this.status === 'idle') {
      this.totalDuration = this.mode === 'focus' ? this.focusDuration : this.breakDuration;
      this.timeLeft = this.totalDuration;
    }
  }

  start() {
    if (this.status === 'running') return;

    this.status = 'running';
    this.startTime = Date.now();
    this.worker.postMessage({ action: 'start' });
    
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.status);
    }
  }

  pause() {
    if (this.status !== 'running') return;

    this.status = 'paused';
    this.worker.postMessage({ action: 'stop' });
    
    // Record current elapsed chunk
    this.accumulatedTime += (Date.now() - this.startTime) / 1000;
    this.startTime = null;

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.status);
    }
  }

  reset() {
    this.status = 'idle';
    if (this.worker) this.worker.postMessage({ action: 'stop' });
    
    this.accumulatedTime = 0;
    this.startTime = null;
    
    this.totalDuration = this.mode === 'focus' ? this.focusDuration : this.breakDuration;
    this.timeLeft = this.totalDuration;

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.status);
    }
    if (this.onTickCallback) {
      this.onTickCallback(this.timeLeft, this.totalDuration);
    }
  }

  skip() {
    this.accumulatedTime = 0;
    this.startTime = null;
    this.status = 'idle';
    this.worker.postMessage({ action: 'stop' });

    // Flip Mode
    this.switchMode();
  }

  restartSession() {
    this.accumulatedTime = 0;
    this.startTime = Date.now();
    this.status = 'running';
    this.timeLeft = this.totalDuration;
    this.worker.postMessage({ action: 'start' });

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.status);
    }
    if (this.onTickCallback) {
      this.onTickCallback(this.timeLeft, this.totalDuration);
    }
  }

  switchMode(targetMode = null) {
    if (targetMode) {
      this.mode = targetMode;
    } else {
      this.mode = this.mode === 'focus' ? 'break' : 'focus';
    }
    this.reset();
  }

  tick() {
    if (this.status !== 'running' || !this.startTime) return;

    const currentElapsed = (Date.now() - this.startTime) / 1000;
    const totalElapsed = this.accumulatedTime + currentElapsed;
    
    this.timeLeft = Math.max(0, this.totalDuration - totalElapsed);

    if (this.onTickCallback) {
      this.onTickCallback(Math.ceil(this.timeLeft), this.totalDuration);
    }

    // Timer Finished
    if (this.timeLeft <= 0) {
      this.complete();
    }
  }

  complete() {
    this.status = 'idle';
    this.worker.postMessage({ action: 'stop' });
    this.accumulatedTime = 0;
    this.startTime = null;

    const finishedMode = this.mode;
    
    if (this.onCompleteCallback) {
      this.onCompleteCallback(finishedMode);
    }
  }

  // Helper formats seconds to MM:SS string
  static formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const minStr = String(min).padStart(2, '0');
    const secStr = String(sec).padStart(2, '0');
    return `${minStr}:${secStr}`;
  }
}
window.PomodoroTimer = PomodoroTimer;
