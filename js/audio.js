/* -------------------------------------------------------------
 * POMODORO PRO - AUDIO CONTROLLER & PROCEDURAL AMBIENT SYNTH
 * ------------------------------------------------------------- */

class AudioController {
  constructor() {
    this.musicVolume = 0.7;
    this.notifVolume = 0.8;
    this.isMuted = false;
    
    // Core music player
    this.audioElement = new Audio();
    this.audioElement.loop = false;
    
    // Playlist logic variables
    this.tracks = [{ name: 'Default Focus Track', isDefault: true }];
    this.currentTrackIndex = 0;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
    
    // Web Audio API context for Procedural Ambient Sounds
    this.audioCtx = null;
    this.ambientNodes = {}; // { rain: { source, gain }, ... }
    this.activeAmbient = null; // 'rain', 'forest', 'cafe', 'typing', 'noise'
    
    // Dynamic Synth chord drone player (when default music plays and files are missing)
    this.droneOscillators = [];
    this.droneGain = null;
    this.isDronePlaying = false;

    // Track state listeners
    this.onTrackEndedCallback = null;
    this.audioElement.addEventListener('ended', () => this.handleTrackEnded());
  }

  init() {
    // Audio Context is initialized on first user click to bypass browser security
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setMusicVolume(value) {
    this.musicVolume = value / 100;
    if (!this.isMuted) {
      this.fadeVolume(this.audioElement, this.musicVolume, 200);
      if (this.droneGain) {
        this.droneGain.gain.setValueAtTime(this.musicVolume * 0.15, this.audioCtx.currentTime);
      }
    }
  }

  setNotifVolume(value) {
    this.notifVolume = value / 100;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const targetVol = this.isMuted ? 0 : this.musicVolume;
    
    this.audioElement.volume = targetVol;
    
    if (this.droneGain) {
      this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.15, this.audioCtx.currentTime);
    }
    
    // Mute procedural sounds
    for (let key in this.ambientNodes) {
      const node = this.ambientNodes[key];
      if (node && node.masterGain) {
        node.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.audioCtx.currentTime);
      }
    }

    return this.isMuted;
  }

  // Smoothly fade audio volume
  fadeVolume(audio, targetVolume, durationMs) {
    if (isNaN(audio.volume)) audio.volume = 0.5;
    const startVolume = audio.volume;
    const diff = targetVolume - startVolume;
    if (diff === 0) return;

    const steps = 20;
    const stepTime = durationMs / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const val = startVolume + (diff * (currentStep / steps));
      audio.volume = Math.max(0, Math.min(1, val));
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);
  }

  /* -------------------------------------------------------------
   * PLAYLIST CONTROLLER METHODS
   * ------------------------------------------------------------- */
  setTracks(trackList, currentIndex = 0) {
    this.tracks = trackList;
    this.currentTrackIndex = currentIndex;
  }

  playMusic() {
    this.init();
    if (this.tracks.length === 0) return;

    const currentTrack = this.tracks[this.currentTrackIndex];
    
    if (currentTrack.isDefault) {
      // Play procedural background ambient synth drone
      this.stopMusicFile();
      this.playSynthDrone();
    } else if (currentTrack.fileUrl) {
      this.stopSynthDrone();
      this.audioElement.src = currentTrack.fileUrl;
      this.audioElement.volume = 0;
      this.audioElement.play()
        .then(() => {
          this.fadeVolume(this.audioElement, this.isMuted ? 0 : this.musicVolume, 800);
        })
        .catch(err => {
          console.warn("Could not play custom audio file, playing fallback drone", err);
          this.playSynthDrone();
        });
    }
  }

  stopMusic() {
    this.stopSynthDrone();
    this.stopMusicFile();
  }

  stopMusicFile() {
    if (!this.audioElement.paused) {
      this.fadeVolume(this.audioElement, 0, 500);
      setTimeout(() => {
        this.audioElement.pause();
      }, 550);
    }
  }

  handleTrackEnded() {
    if (this.onTrackEndedCallback) {
      this.onTrackEndedCallback();
    }
  }

  playNext() {
    if (this.tracks.length <= 1) {
      this.playMusic();
      return;
    }

    if (this.isShuffle) {
      this.currentTrackIndex = Math.floor(Math.random() * this.tracks.length);
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    }
    this.playMusic();
  }

  playPrevious() {
    if (this.tracks.length <= 1) {
      this.playMusic();
      return;
    }

    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    this.playMusic();
  }

  /* -------------------------------------------------------------
   * PROCEDURAL SOUND GENERATORS (Web Audio API)
   * ------------------------------------------------------------- */

  // Helper: generates a White Noise Buffer
  createNoiseBuffer(type = 'white') {
    const bufferSize = 2 * this.audioCtx.sampleRate;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0; // For brown noise filtering
    
    // Pink noise coefficients
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      if (type === 'white') {
        output[i] = white;
      } else if (type === 'pink') {
        // Kellet's refinement formula for Pink Noise
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // normalization gain
        b6 = white * 0.115926;
      } else if (type === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // normalise volume
      }
    }
    return noiseBuffer;
  }

  // Play custom ambient synthesizer chime chords as background focus drone
  playSynthDrone() {
    if (this.isDronePlaying) return;
    this.init();
    this.isDronePlaying = true;
    
    this.droneGain = this.audioCtx.createGain();
    this.droneGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.musicVolume * 0.15, this.audioCtx.currentTime + 3);
    this.droneGain.connect(this.audioCtx.destination);

    // Warm minor 7th chords: F3 (174Hz), C4 (261Hz), Eb4 (311Hz), G4 (392Hz)
    const frequencies = [174.61, 261.63, 311.13, 392.00];
    
    frequencies.forEach((freq) => {
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      
      // LFO modulation to simulate a breathing synth
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      
      lfo.frequency.value = 0.1 + Math.random() * 0.1; // Slow LFO speed
      lfoGain.gain.value = 1.5; // Detune value
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      
      osc.connect(filter);
      filter.connect(this.droneGain);
      
      lfo.start();
      osc.start();
      
      this.droneOscillators.push({ osc, lfo });
    });
  }

  stopSynthDrone() {
    if (!this.isDronePlaying) return;
    this.isDronePlaying = false;
    
    if (this.droneGain) {
      try {
        this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.audioCtx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1);
      } catch(e){}
    }
    
    setTimeout(() => {
      this.droneOscillators.forEach(d => {
        try {
          d.osc.stop();
          d.lfo.stop();
        } catch(e){}
      });
      this.droneOscillators = [];
      if (this.droneGain) {
        try { this.droneGain.disconnect(); } catch(e){}
        this.droneGain = null;
      }
    }, 1100);
  }

  toggleAmbient(type) {
    this.init();
    
    // If active is clicked, turn it off
    if (this.activeAmbient === type) {
      this.stopAmbient(type);
      this.activeAmbient = null;
      return null;
    }
    
    // Stop any other active ambient sounds
    if (this.activeAmbient) {
      this.stopAmbient(this.activeAmbient);
    }
    
    this.startAmbient(type);
    this.activeAmbient = type;
    return type;
  }

  startAmbient(type) {
    const nodeData = {};
    nodeData.masterGain = this.audioCtx.createGain();
    nodeData.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    nodeData.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.6, this.audioCtx.currentTime + 1.5);
    nodeData.masterGain.connect(this.audioCtx.destination);
    
    nodeData.sources = [];
    nodeData.timers = [];

    if (type === 'rain') {
      // 1. Rain base rumble (pink noise + filter)
      const rainSource = this.audioCtx.createBufferSource();
      rainSource.buffer = this.createNoiseBuffer('pink');
      rainSource.loop = true;
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, this.audioCtx.currentTime);
      
      rainSource.connect(filter);
      filter.connect(nodeData.masterGain);
      rainSource.start();
      nodeData.sources.push(rainSource);

      // 2. Highfrequency droplets generator
      const dropletInterval = setInterval(() => {
        if (!this.ambientNodes['rain']) return;
        this.playProceduralDroplet(nodeData.masterGain);
      }, 350);
      nodeData.timers.push(dropletInterval);

    } else if (type === 'forest') {
      // 1. Gentle forest breeze (brownian noise + slow LFO filter modulation)
      const breezeSource = this.audioCtx.createBufferSource();
      breezeSource.buffer = this.createNoiseBuffer('brown');
      breezeSource.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);

      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, this.audioCtx.currentTime);
      
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(150, this.audioCtx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      breezeSource.connect(filter);
      filter.connect(nodeData.masterGain);
      
      lfo.start();
      breezeSource.start();
      nodeData.sources.push(breezeSource, lfo);

      // 2. Birds chirping triggers
      const chirpInterval = setInterval(() => {
        if (!this.ambientNodes['forest']) return;
        this.playProceduralBirdChirp(nodeData.masterGain);
      }, 5000);
      nodeData.timers.push(chirpInterval);

    } else if (type === 'cafe') {
      // 1. Cafe rumble (brown noise base)
      const rumble = this.audioCtx.createBufferSource();
      rumble.buffer = this.createNoiseBuffer('brown');
      rumble.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, this.audioCtx.currentTime);

      rumble.connect(filter);
      filter.connect(nodeData.masterGain);
      rumble.start();
      nodeData.sources.push(rumble);

      // 2. Clinking coffee cups simulator
      const clinkInterval = setInterval(() => {
        if (!this.ambientNodes['cafe']) return;
        this.playProceduralClink(nodeData.masterGain);
      }, 4000);
      nodeData.timers.push(clinkInterval);

    } else if (type === 'typing') {
      // Keyboard clicking noise generator
      const typeInterval = setInterval(() => {
        if (!this.ambientNodes['typing']) return;
        // Generate small cluster of typing clicks
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (this.ambientNodes['typing']) {
              this.playProceduralTypingClick(nodeData.masterGain);
            }
          }, i * 150 + Math.random() * 80);
        }
      }, 1200);
      nodeData.timers.push(typeInterval);

    } else if (type === 'noise') {
      // Continuous clean Brown noise
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = this.createNoiseBuffer('brown');
      noise.loop = true;
      
      noise.connect(nodeData.masterGain);
      noise.start();
      nodeData.sources.push(noise);
    }

    this.ambientNodes[type] = nodeData;
  }

  stopAmbient(type) {
    const node = this.ambientNodes[type];
    if (!node) return;

    // Clear timers
    node.timers.forEach(t => clearInterval(t));
    
    // Fade out ambient gain
    try {
      node.masterGain.gain.setValueAtTime(node.masterGain.gain.value, this.audioCtx.currentTime);
      node.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1);
    } catch(e){}

    setTimeout(() => {
      node.sources.forEach(src => {
        try { src.stop(); } catch(e){}
      });
      try { node.masterGain.disconnect(); } catch(e){}
      delete this.ambientNodes[type];
    }, 1100);
  }

  // Synthesize rain droplet clicks
  playProceduralDroplet(destination) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sine';
    // Random high frequencies for splash
    osc.frequency.setValueAtTime(1000 + Math.random() * 2000, this.audioCtx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, this.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.02 + Math.random() * 0.05, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.06);
  }

  // Synthesize organic bird chirping sweeps
  playProceduralBirdChirp(destination) {
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000 + Math.random() * 200, now);
    // Rapid sweep upwards
    osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 500, now + 0.15);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(destination);

    osc.start();
    osc.stop(now + 0.16);

    // Occasional double chirp
    if (Math.random() > 0.4) {
      setTimeout(() => {
        if (!this.ambientNodes['forest']) return;
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        const now2 = this.audioCtx.currentTime;

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2100, now2);
        osc2.frequency.exponentialRampToValueAtTime(3400, now2 + 0.12);

        gain2.gain.setValueAtTime(0.04, now2);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.12);

        osc2.connect(gain2);
        gain2.connect(destination);
        
        osc2.start();
        osc2.stop(now2 + 0.13);
      }, 200);
    }
  }

  // Synthesize metallic coffee cup clinks
  playProceduralClink(destination) {
    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1480, now); // Metallic resonate freq 1
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2200, now); // Metallic resonate freq 2

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.13);
    osc2.stop(now + 0.13);
  }

  // Synthesize keyboard clicks
  playProceduralTypingClick(destination) {
    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.05; // 50ms click
    const clickBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = clickBuffer.getChannelData(0);

    // Create high-pass click envelope
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / 100);
    }

    const bufferSource = this.audioCtx.createBufferSource();
    bufferSource.buffer = clickBuffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 300, now);
    filter.Q.setValueAtTime(4, now);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);

    bufferSource.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    bufferSource.start();
  }

  /* -------------------------------------------------------------
   * BEEP ALERTS & NOTIFICATIONS
   * ------------------------------------------------------------- */
  playAlert(customUrl = null) {
    this.init();

    if (customUrl) {
      const alertAudio = new Audio(customUrl);
      alertAudio.volume = this.isMuted ? 0 : this.notifVolume;
      alertAudio.play().catch(e => this.playProceduralBeepChime(3));
    } else {
      // Play procedural premium chimes 3 times
      this.playProceduralBeepChime(3);
    }
  }

  // Beautiful dynamic sound synthesis (Tibetan Singing Bowl / Coffee chime)
  playProceduralBeepChime(repeatsCount) {
    let played = 0;
    const triggerNext = () => {
      if (played >= repeatsCount) return;
      
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const subOsc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5 Chime
      
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(261.63, now); // C4 support note

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.notifVolume * 0.4, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      subOsc.start();
      
      osc.stop(now + 1.3);
      subOsc.stop(now + 1.3);

      played++;
      setTimeout(triggerNext, 1500); // 1.5 seconds intervals
    };
    triggerNext();
  }
}
window.AudioController = AudioController;
