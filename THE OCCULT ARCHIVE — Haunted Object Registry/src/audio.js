/**
 * THE OCCULT ARCHIVE - CINEMATIC HORROR AUDIO SYSTEM
 * Site-19 Sub-Terra // Acoustic Surveillance & Paranormal Soundscape Engine
 * 
 * Features:
 * - Real audio assets loaded from assets/audio/ (WAV/MP3) with seamless fallback synthesis
 * - Deep horror drone & haunted mansion wind ambient soundscape
 * - Randomized environmental horror events (footsteps, whispers, creaks, distant thunder)
 * - Lightning & thunder natural synchronization with distance travel delay
 * - Interactive artifact telemetry sounds (dossier reveal, critical warning, breach alarm, stamp, seal)
 * - Independent master, ambient, and SFX volume busses with localStorage persistence
 * - Respects autoplay policies: starts smoothly upon first explicit user interaction
 */

window.OccultAudio = (function () {
  // Storage keys
  const KEY_ENABLED = 'occult_audio_enabled';
  const KEY_MASTER_VOL = 'occult_audio_master_vol';
  const KEY_AMBIENCE_VOL = 'occult_audio_ambience_vol';
  const KEY_SFX_VOL = 'occult_audio_sfx_vol';
  const KEY_SOUNDSCAPE = 'occult_audio_soundscape';
  const KEY_ENV_ENABLED = 'occult_audio_env_enabled';

  // State
  let audioCtx = null;
  let isMuted = localStorage.getItem(KEY_ENABLED) === 'false';
  let isAudioEnabled = localStorage.getItem(KEY_ENABLED) === 'true'; // Requires explicit enable or interaction
  let masterVolume = parseFloat(localStorage.getItem(KEY_MASTER_VOL) || '0.70');
  let ambienceVolume = parseFloat(localStorage.getItem(KEY_AMBIENCE_VOL) || '0.50');
  let sfxVolume = parseFloat(localStorage.getItem(KEY_SFX_VOL) || '0.75');
  let currentSoundscape = localStorage.getItem(KEY_SOUNDSCAPE) || 'mansion'; // 'mansion' | 'dark-drone' | 'procedural'
  let isEnvEnabled = localStorage.getItem(KEY_ENV_ENABLED) !== 'false';

  // Ambient audio elements and Web Audio nodes
  let ambientAudioEl = null;
  let proceduralDroneNodes = null;
  let isAmbientPlaying = false;
  let envTimer = null;
  let lastEnvSoundIdx = -1;
  let lastEnvPlayTime = 0;

  // Master gain bus
  let masterGainNode = null;
  let ambienceGainNode = null;
  let sfxGainNode = null;

  // Audio asset paths
  const AUDIO_FILES = {
    'ambience-mansion': 'assets/audio/ambience-haunted-mansion.wav',
    'ambience-dark-drone': 'assets/audio/ambience-dark-drone.wav',
    'thunder': 'assets/audio/effect-thunder.wav',
    'lightning': 'assets/audio/effect-lightning.wav',
    'door-creak': 'assets/audio/effect-door-creak.wav',
    'footsteps': 'assets/audio/effect-footsteps.wav',
    'whisper': 'assets/audio/effect-whisper.wav',
    'containment-alarm': 'assets/audio/effect-containment-alarm.wav',
    'artifact-discovery': 'assets/audio/effect-artifact-discovery.wav',
    'archive-confirmation': 'assets/audio/effect-archive-confirmation.wav'
  };

  // Preloaded audio elements cache
  const audioCache = {};

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        setupBuses();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function setupBuses() {
    if (!audioCtx) return;
    try {
      masterGainNode = audioCtx.createGain();
      ambienceGainNode = audioCtx.createGain();
      sfxGainNode = audioCtx.createGain();

      masterGainNode.gain.setValueAtTime(isMuted ? 0.0 : masterVolume, audioCtx.currentTime);
      ambienceGainNode.gain.setValueAtTime(ambienceVolume, audioCtx.currentTime);
      sfxGainNode.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);

      ambienceGainNode.connect(masterGainNode);
      sfxGainNode.connect(masterGainNode);
      masterGainNode.connect(audioCtx.destination);
    } catch (e) {}
  }

  function getEffectiveVolume(type = 'sfx') {
    if (isMuted || !isAudioEnabled) return 0;
    if (type === 'ambience') return masterVolume * ambienceVolume;
    return masterVolume * sfxVolume;
  }

  // Preload an audio asset safely
  function loadAudioElement(key) {
    if (audioCache[key]) return audioCache[key];
    const src = AUDIO_FILES[key];
    if (!src) return null;

    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audioCache[key] = audio;
      return audio;
    } catch (e) {
      return null;
    }
  }

  // Play audio file with smooth fallback to procedural synthesis
  function playFileSound(key, volumeScale = 1.0, onFallback = null) {
    if (isMuted || !isAudioEnabled) return;
    const vol = getEffectiveVolume('sfx') * volumeScale;
    if (vol <= 0.001) return;

    const audio = loadAudioElement(key);
    if (audio) {
      try {
        const soundClone = audio.cloneNode();
        soundClone.volume = Math.min(1.0, Math.max(0.0, vol));
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (typeof onFallback === 'function') onFallback();
          });
        }
        return;
      } catch (e) {
        if (typeof onFallback === 'function') onFallback();
      }
    } else if (typeof onFallback === 'function') {
      onFallback();
    }
  }

  // =========================================================================
  // BACKGROUND AMBIENCE SYSTEM
  // =========================================================================
  function startAmbience() {
    if (!isAudioEnabled || isMuted) return;
    stopAmbience();

    if (currentSoundscape === 'procedural') {
      startProceduralDrone();
      isAmbientPlaying = true;
      scheduleNextEnvironmentalSound();
      return;
    }

    const fileKey = currentSoundscape === 'dark-drone' ? 'ambience-dark-drone' : 'ambience-mansion';
    const src = AUDIO_FILES[fileKey];

    try {
      ambientAudioEl = new Audio(src);
      ambientAudioEl.loop = true;
      ambientAudioEl.volume = Math.min(1.0, Math.max(0.0, getEffectiveVolume('ambience')));

      const playPromise = ambientAudioEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isAmbientPlaying = true;
          scheduleNextEnvironmentalSound();
        }).catch(() => {
          // Fallback to Web Audio synthesized drone
          startProceduralDrone();
          isAmbientPlaying = true;
          scheduleNextEnvironmentalSound();
        });
      }
    } catch (e) {
      startProceduralDrone();
      isAmbientPlaying = true;
      scheduleNextEnvironmentalSound();
    }
  }

  function stopAmbience() {
    if (ambientAudioEl) {
      try {
        ambientAudioEl.pause();
        ambientAudioEl.currentTime = 0;
      } catch (e) {}
      ambientAudioEl = null;
    }
    stopProceduralDrone();
    isAmbientPlaying = false;
    if (envTimer) {
      clearTimeout(envTimer);
      envTimer = null;
    }
  }

  function updateAmbienceVolume() {
    const vol = getEffectiveVolume('ambience');
    if (ambientAudioEl) {
      try { ambientAudioEl.volume = Math.min(1.0, Math.max(0.0, vol)); } catch (e) {}
    }
    if (proceduralDroneNodes && proceduralDroneNodes.gain) {
      try {
        const ctx = getAudioContext();
        proceduralDroneNodes.gain.gain.setValueAtTime(vol * 0.12, ctx.currentTime);
      } catch (e) {}
    }
  }

  // Synthesized fallback procedural drone
  function startProceduralDrone() {
    stopProceduralDrone();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Deep 48Hz / 55Hz sub-bass Gothic drone
      const baseFreq = currentSoundscape === 'dark-drone' ? 42 : 55;
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq + 0.75, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime);

      const vol = getEffectiveVolume('ambience') * 0.12;
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      proceduralDroneNodes = {
        osc1, osc2, gain,
        stop: function () {
          try {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            setTimeout(() => {
              try { osc1.stop(); osc2.stop(); } catch (e) {}
            }, 380);
          } catch (e) {}
        }
      };
    } catch (e) {}
  }

  function stopProceduralDrone() {
    if (proceduralDroneNodes) {
      try { proceduralDroneNodes.stop(); } catch (e) {}
      proceduralDroneNodes = null;
    }
  }

  // =========================================================================
  // RANDOM ENVIRONMENTAL SOUNDS
  // =========================================================================
  function scheduleNextEnvironmentalSound() {
    if (envTimer) clearTimeout(envTimer);
    if (!isAudioEnabled || isMuted || !isEnvEnabled) return;

    // Random interval between 24 and 45 seconds
    const interval = Math.floor(Math.random() * 21000) + 24000;
    envTimer = setTimeout(() => {
      triggerRandomEnvironmentalSound();
      scheduleNextEnvironmentalSound();
    }, interval);
  }

  function triggerRandomEnvironmentalSound() {
    if (!isAudioEnabled || isMuted || !isEnvEnabled) return;
    const now = Date.now();
    if (now - lastEnvPlayTime < 14000) return; // Prevent rapid overlapping

    const envSoundTypes = ['door-creak', 'footsteps', 'whisper', 'thunder', 'metallic-resonance'];
    let idx = Math.floor(Math.random() * envSoundTypes.length);
    if (idx === lastEnvSoundIdx) {
      idx = (idx + 1) % envSoundTypes.length;
    }
    lastEnvSoundIdx = idx;
    lastEnvPlayTime = now;

    const chosen = envSoundTypes[idx];
    switch (chosen) {
      case 'door-creak':
        playFileSound('door-creak', 0.55, () => synthDoorCreak());
        break;
      case 'footsteps':
        playFileSound('footsteps', 0.45, () => synthFootsteps());
        break;
      case 'whisper':
        playFileSound('whisper', 0.50, () => synthWhisper());
        break;
      case 'thunder':
        playFileSound('thunder', 0.40, () => synthThunder('distant'));
        break;
      case 'metallic-resonance':
        synthMetallicResonance();
        break;
    }
  }

  // =========================================================================
  // SYNTHESIZED PROCEDURAL FALLBACKS (Web Audio API)
  // =========================================================================

  function synthThunder(intensity = 'medium') {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const isHard = intensity === 'hard' || intensity === 'striking';
      const duration = isHard ? 3.4 : (intensity === 'medium' ? 2.2 : 1.6);
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let brown = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        brown = (brown + 0.028 * white) / 1.028;
        data[i] = brown * 3.4;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isHard ? 120 : 75, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(36, ctx.currentTime + duration);

      const gain = ctx.createGain();
      const peakVol = (isHard ? 0.35 : 0.18) * getEffectiveVolume('sfx');

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peakVol, ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + duration + 0.1);
    } catch (e) {}
  }

  function synthLightningSnap() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25 * getEffectiveVolume('sfx'), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
    } catch (e) {}
  }

  function synthDoorCreak() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(540, ctx.currentTime + 0.6);
      osc.frequency.linearRampToValueAtTime(410, ctx.currentTime + 1.1);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      const vol = 0.12 * getEffectiveVolume('sfx');
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    } catch (e) {}
  }

  function synthFootsteps() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      [0.0, 0.65, 1.35].forEach((delay) => {
        const start = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, start);
        osc.frequency.exponentialRampToValueAtTime(35, start + 0.15);

        const vol = 0.18 * getEffectiveVolume('sfx');
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) {}
  }

  function synthWhisper() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const dur = 1.4;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / bufferSize));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(2400, ctx.currentTime + dur);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14 * getEffectiveVolume('sfx'), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {}
  }

  function synthMetallicResonance() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const freqs = [310, 470, 780];
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const vol = 0.08 * getEffectiveVolume('sfx');
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.9);
      });
    } catch (e) {}
  }

  // =========================================================================
  // PUBLIC API INTERFACE
  // =========================================================================
  return {
    // Initialization & User-Interaction Unlock
    initOnInteraction: function () {
      if (!audioCtx) getAudioContext();
      if (isAudioEnabled && !isMuted && !isAmbientPlaying) {
        startAmbience();
      }
    },

    // Master Toggle
    toggleAudio: function () {
      isAudioEnabled = !isAudioEnabled;
      if (isAudioEnabled) {
        isMuted = false;
        localStorage.setItem(KEY_ENABLED, 'true');
        getAudioContext();
        startAmbience();
        this.playStamp();
      } else {
        localStorage.setItem(KEY_ENABLED, 'false');
        stopAmbience();
      }
      return isAudioEnabled;
    },

    toggleMute: function () {
      isMuted = !isMuted;
      if (isMuted) {
        stopAmbience();
      } else {
        if (!isAudioEnabled) isAudioEnabled = true;
        localStorage.setItem(KEY_ENABLED, 'true');
        getAudioContext();
        startAmbience();
      }
      return isMuted;
    },

    isAudioOn: function () {
      return isAudioEnabled && !isMuted;
    },

    isMuted: function () {
      return isMuted || !isAudioEnabled;
    },

    // Getters & Setters
    getMasterVolume: () => masterVolume,
    setMasterVolume: function (val) {
      masterVolume = Math.min(1.0, Math.max(0.0, parseFloat(val)));
      localStorage.setItem(KEY_MASTER_VOL, masterVolume.toString());
      updateAmbienceVolume();
    },

    getAmbienceVolume: () => ambienceVolume,
    setAmbienceVolume: function (val) {
      ambienceVolume = Math.min(1.0, Math.max(0.0, parseFloat(val)));
      localStorage.setItem(KEY_AMBIENCE_VOL, ambienceVolume.toString());
      updateAmbienceVolume();
    },

    getSfxVolume: () => sfxVolume,
    setSfxVolume: function (val) {
      sfxVolume = Math.min(1.0, Math.max(0.0, parseFloat(val)));
      localStorage.setItem(KEY_SFX_VOL, sfxVolume.toString());
    },

    getSoundscape: () => currentSoundscape,
    setSoundscape: function (type) {
      currentSoundscape = type;
      localStorage.setItem(KEY_SOUNDSCAPE, type);
      if (isAudioEnabled && !isMuted) {
        startAmbience();
      }
    },

    isEnvironmentalActive: () => isEnvEnabled,
    toggleEnvironmental: function () {
      isEnvEnabled = !isEnvEnabled;
      localStorage.setItem(KEY_ENV_ENABLED, isEnvEnabled.toString());
      if (isEnvEnabled && isAudioEnabled && !isMuted) {
        scheduleNextEnvironmentalSound();
      } else if (envTimer) {
        clearTimeout(envTimer);
        envTimer = null;
      }
      return isEnvEnabled;
    },

    // =========================================================================
    // LIGHTNING & THUNDER SYNCHRONIZATION
    // =========================================================================
    playLightningSnap: function () {
      playFileSound('lightning', 0.85, () => synthLightningSnap());
    },

    playThunder: function (intensity = 'hard', distanceDelayMs = 0) {
      const executeThunder = () => {
        playFileSound('thunder', intensity === 'hard' ? 1.0 : 0.65, () => synthThunder(intensity));
      };

      if (distanceDelayMs > 0) {
        setTimeout(executeThunder, distanceDelayMs);
      } else {
        executeThunder();
      }
    },

    // =========================================================================
    // INTERACTIVE ARTIFACT & UI SOUNDS
    // =========================================================================

    // Opening an artifact dossier
    playDossierOpen: function () {
      playFileSound('artifact-discovery', 0.75, () => {
        try {
          const ctx = getAudioContext();
          if (!ctx) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(110, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.6);
          gain.gain.setValueAtTime(0.2 * getEffectiveVolume('sfx'), ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.85);
        } catch (e) {}
      });
    },

    // Critical artifact alert / danger warning
    playCriticalAlert: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(290, ctx.currentTime);
        osc.frequency.setValueAtTime(340, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18 * getEffectiveVolume('sfx'), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } catch (e) {}
    },

    // Containment breach klaxon
    playBreachAlarm: function () {
      playFileSound('containment-alarm', 0.95, () => {
        try {
          const ctx = getAudioContext();
          if (!ctx) return;
          for (let i = 0; i < 3; i++) {
            const start = ctx.currentTime + i * 0.45;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(680, start);
            osc.frequency.linearRampToValueAtTime(940, start + 0.22);
            osc.frequency.linearRampToValueAtTime(520, start + 0.4);
            gain.gain.setValueAtTime(0.22 * getEffectiveVolume('sfx'), start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.42);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.43);
          }
        } catch (e) {}
      });
    },

    // Containment restored / secure confirmation
    playContainmentRestored: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const freqs = [330, 440, 554, 659];
        freqs.forEach((freq, idx) => {
          const startTime = ctx.currentTime + idx * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.12 * getEffectiveVolume('sfx'), startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.38);
        });
      } catch (e) {}
    },

    // Recording an incident or intake relic confirmation
    playArchiveConfirmation: function () {
      playFileSound('archive-confirmation', 0.85, () => this.playStamp());
    },

    // Opening Containment Center / Industrial hum
    playIndustrialHum: function () {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, ctx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);

        gain.gain.setValueAtTime(0.16 * getEffectiveVolume('sfx'), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.95);
      } catch (e) {}
    },

    // Standard tactile archival stamp / button click
    playStamp: function () {
      if (isMuted || !isAudioEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.2 * getEffectiveVolume('sfx'), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } catch (e) {}
    },

    // Geiger counter click
    playGeiger: function () {
      if (isMuted || !isAudioEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const bufferSize = ctx.sampleRate * 0.005;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2400 + Math.random() * 800;
        filter.Q.value = 3.0;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08 * getEffectiveVolume('sfx'), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
      } catch (e) {}
    },

    // Solar dawn vs Midnight Void transition
    playSolarFlare: function (isDaylight) {
      if (isMuted || !isAudioEnabled) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        if (isDaylight) {
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(110, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(220, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.6);
        } else {
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(520, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.7);

          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(260, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.7);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.7);
        }

        gain.gain.setValueAtTime(0.18 * getEffectiveVolume('sfx'), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.76);
        osc2.stop(ctx.currentTime + 0.76);
      } catch (e) {}
    },

    // Standalone test triggers for the Control Panel
    testSound: function (type) {
      this.initOnInteraction();
      switch (type) {
        case 'thunder':
          this.playLightningSnap();
          this.playThunder('hard', 220);
          break;
        case 'creak':
          playFileSound('door-creak', 0.8, () => synthDoorCreak());
          break;
        case 'footsteps':
          playFileSound('footsteps', 0.8, () => synthFootsteps());
          break;
        case 'whisper':
          playFileSound('whisper', 0.85, () => synthWhisper());
          break;
        case 'alarm':
          this.playBreachAlarm();
          break;
        case 'confirmation':
          this.playArchiveConfirmation();
          break;
        case 'dossier':
          this.playDossierOpen();
          break;
      }
    }
  };
})();
