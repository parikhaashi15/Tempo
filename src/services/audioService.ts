class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Harmonic singing bowl / zen bell chime
  playChime(volume = 0.5) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const baseFreq = 528; // Solfeggio frequency: gentle restorative tone
      const harmonics = [1, 1.5, 2.02, 2.76, 3.8];
      const gains = [0.4, 0.25, 0.15, 0.08, 0.04];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.7, now);
      masterGain.connect(ctx.destination);

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        gain.gain.setValueAtTime(gains[i], now);
        // Exponential decay for realistic bell resonance
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 3.3);
      });
    } catch (e) {
      console.warn('Audio playback not permitted yet:', e);
    }
  }

  // Soft ascending tone when starting study sessions
  playStartTone(volume = 0.4) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5 (Major triad)

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(volume * 0.25, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.85);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Joyful chord when checking off a daily goal
  playGoalSuccess(volume = 0.45) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright octave)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(volume * 0.3, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.25);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  private crackleTimer: ReturnType<typeof setTimeout> | null = null;
  private currentVolume = 0.25;

  // Generative lo-fi study noise (rain, pink/white noise, or crackling fireplace)
  startAmbient(type: 'rain' | 'whitenoise' | 'fireplace', volume = 0.25) {
    this.stopAmbient();
    this.currentVolume = volume;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (type === 'fireplace') {
        // 5-second buffer of deep warm combustion roar with embedded ember snaps
        const bufferSize = ctx.sampleRate * 5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Deep brown noise for warm low-end air draft and combustion
          data[i] = (lastOut + 0.018 * white) / 1.018;
          lastOut = data[i];
          data[i] *= 2.8;

          // Occasional micro ember sizzle in background
          if (Math.random() < 0.0006) {
            data[i] += (Math.random() - 0.5) * 0.4;
          }
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        // Warm resonant lowpass filter simulating fireplace hearth chamber
        const lowFilter = ctx.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.setValueAtTime(420, ctx.currentTime);
        lowFilter.Q.setValueAtTime(1.1, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume * 0.22, ctx.currentTime);

        noiseSource.connect(lowFilter);
        lowFilter.connect(gain);
        gain.connect(ctx.destination);

        noiseSource.start();
        this.ambientSource = noiseSource;
        this.ambientGain = gain;
        this.isAmbientPlaying = true;

        // Schedule continuous stochastic wood snaps and crackles
        this.scheduleFireCrackle(volume);
        return;
      }

      // 4-second buffer of generated noise for rain / whitenoise
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain') {
          // Pink-ish filtered noise for rain
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        } else {
          // Gentle white noise
          data[i] = white * 0.2;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter to simulate soft raindrops or steady atmospheric hum
      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Could not start ambient noise:', e);
    }
  }

  // Realistic non-periodic wood log crackles & ember spark snaps
  private scheduleFireCrackle(volume: number) {
    if (!this.isAmbientPlaying) return;

    const ctx = this.getContext();
    if (!ctx) return;

    // Trigger next crackle in 150ms to 950ms
    const nextDelay = 150 + Math.random() * 800;

    this.crackleTimer = setTimeout(() => {
      if (!this.isAmbientPlaying) return;
      this.playSingleCrackle(volume);
      this.scheduleFireCrackle(this.currentVolume);
    }, nextDelay);
  }

  private playSingleCrackle(volume: number) {
    const ctx = this.getContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      // Duration of a snap is very short (10ms - 35ms)
      const duration = 0.012 + Math.random() * 0.025;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const channel = buffer.getChannelData(0);

      // Sharp burst with quick exponential decay
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (bufferSize * 0.3));
        channel[i] = (Math.random() * 2 - 1) * decay;
      }

      const burst = ctx.createBufferSource();
      burst.buffer = buffer;

      // Bandpass filter to tune the snap frequency (warm dry wood sound)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + Math.random() * 2200, now);
      filter.Q.setValueAtTime(1.8 + Math.random() * 1.5, now);

      const gain = ctx.createGain();
      const popIntensity = (0.08 + Math.random() * 0.28) * (volume * 1.2);
      gain.gain.setValueAtTime(popIntensity, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      burst.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      burst.start(now);
      burst.stop(now + duration + 0.01);
    } catch {
      // ignore transient audio context blips
    }
  }

  setAmbientVolume(volume: number) {
    this.currentVolume = volume;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(volume * 0.18, this.ctx.currentTime);
    }
  }

  stopAmbient() {
    if (this.crackleTimer) {
      clearTimeout(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.ambientSource) {
      try {
        (this.ambientSource as AudioBufferSourceNode).stop();
        this.ambientSource.disconnect();
      } catch {
        // already stopped
      }
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
  }

  getIsAmbientPlaying() {
    return this.isAmbientPlaying;
  }
}

export const soundEngine = new SoundEngine();
