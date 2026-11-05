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

  // Generative lo-fi study noise (rain or pink noise)
  startAmbient(type: 'rain' | 'whitenoise', volume = 0.25) {
    this.stopAmbient();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // 5-second buffer of generated noise
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

  setAmbientVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
    }
  }

  stopAmbient() {
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
