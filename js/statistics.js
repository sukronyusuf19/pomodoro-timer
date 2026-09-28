/* -------------------------------------------------------------
 * POMODORO PRO - STATISTICS & CANVAS CHART CONTROLLER
 * ------------------------------------------------------------- */

class StatisticsController {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.settings = null; // Reference to app settings state
  }

  init(canvasElement, settingsReference) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.settings = settingsReference;
    
    // Add resize listener to dynamically adapt canvas scale
    window.addEventListener('resize', () => this.renderChart());
  }

  // Update statistics values and streak when a focus session completes
  recordFocusSession(durationMinutes) {
    const todayStr = this.getLocalDateString(new Date());
    const yesterdayStr = this.getLocalDateString(new Date(Date.now() - 86400000));

    // 1. Increment counters
    this.settings.totalFocusSessions++;
    this.settings.totalFocusTime += durationMinutes;
    
    if (durationMinutes > this.settings.longestFocusSession) {
      this.settings.longestFocusSession = durationMinutes;
    }

    // 2. Daily sessions counter increment
    this.settings.completedSessionsToday++;

    // 3. Streak calculation logic
    if (this.settings.lastSessionDate === yesterdayStr) {
      this.settings.streak++;
    } else if (this.settings.lastSessionDate !== todayStr) {
      // First session in a while or brand new
      this.settings.streak = 1;
    }
    this.settings.lastSessionDate = todayStr;

    // 4. Update weekly productivity logs
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = dayNames[new Date().getDay()];
    
    if (this.settings.weeklyProductivity[currentDay] !== undefined) {
      this.settings.weeklyProductivity[currentDay] += durationMinutes;
    } else {
      this.settings.weeklyProductivity[currentDay] = durationMinutes;
    }

    // Save updated statistics to storage
    StorageManager.save(this.settings);
    this.renderChart();
  }

  getLocalDateString(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  // Draw crisp, custom high-DPI bar charts on the Canvas
  renderChart() {
    if (!this.canvas || !this.ctx || !this.settings) return;

    const canvas = this.canvas;
    const ctx = this.ctx;
    
    // Resolve Retina High DPI Blur
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    // Extract Theme Colors from CSS variables
    const style = getComputedStyle(document.body);
    const accentColor = style.getPropertyValue('--accent').trim() || '#D9B382';
    const highlightColor = style.getPropertyValue('--highlight').trim() || '#F3D8B4';
    const textMuted = style.getPropertyValue('--text-muted').trim() || 'rgba(255, 255, 255, 0.4)';
    const textMain = style.getPropertyValue('--text-main').trim() || '#FFF8F0';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = days.map(day => this.settings.weeklyProductivity[day] || 0);
    const maxValue = Math.max(...values, 60); // Default grid max at 60 mins

    const padding = { top: 25, right: 10, bottom: 25, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 1. Draw horizontal gridlines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = textMuted;
    ctx.font = '9px var(--font-body)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const val = Math.round(maxValue - (maxValue / gridLines) * i);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Axis label
      ctx.fillText(`${val}m`, padding.left - 8, y);
    }

    // 2. Draw bars & Day labels
    const barCount = days.length;
    const barWidth = Math.min(24, (chartWidth / barCount) * 0.5);
    const gap = (chartWidth - (barWidth * barCount)) / (barCount - 1);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    days.forEach((day, index) => {
      const val = values[index];
      const x = padding.left + index * (barWidth + gap);
      const barHeight = (val / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // X-Axis text
      ctx.fillStyle = textMuted;
      ctx.font = '10px var(--font-body)';
      ctx.fillText(day, x + barWidth / 2, padding.top + chartHeight + 6);

      // Skip drawing empty bars
      if (val > 0) {
        // Create vertical gradient for bar fill
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, accentColor);
        grad.addColorStop(1, 'rgba(217, 179, 130, 0.15)');

        ctx.fillStyle = grad;
        
        // Draw rounded rectangle top
        const radius = Math.min(barWidth / 2, 6);
        ctx.beginPath();
        ctx.moveTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.closePath();
        ctx.fill();

        // Label value on top of bar
        ctx.fillStyle = textMain;
        ctx.font = 'bold 9px var(--font-body)';
        ctx.fillText(`${Math.round(val)}m`, x + barWidth / 2, y - 12);
      }
    });
  }

  // Export productivity logs to a local CSV file
  exportCSV() {
    if (!this.settings) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\r\n";
    csvContent += `Total Focus Sessions,${this.settings.totalFocusSessions}\r\n`;
    csvContent += `Total Focus Time (Minutes),${this.settings.totalFocusTime}\r\n`;
    csvContent += `Longest Focus Session (Minutes),${this.settings.longestFocusSession}\r\n`;
    csvContent += `Current Streak (Days),${this.settings.streak}\r\n`;
    
    // Append weekly breakdown
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(d => {
      csvContent += `${d} Focus Time (Minutes),${this.settings.weeklyProductivity[d] || 0}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pomodoro-pro-stats-${this.getLocalDateString(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
window.StatisticsController = StatisticsController;
