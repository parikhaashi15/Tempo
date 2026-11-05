export interface LofiTrack {
  id: string;
  title: string;
  artist: string;
  vibe: string;
  durationSeconds: number;
  bpm: number;
  coverHue: string;
  progression: number[][]; // Frequencies for chord steps
}

// 5 Curated Lo-Fi Ambient Study Tracks
export const CURATED_TRACKS: LofiTrack[] = [
  {
    id: 'track-1',
    title: 'Midnight Coffee & Gentle Rain',
    artist: 'Tempo Study Room',
    vibe: 'Warm Rhodes & Vinyl Crackle',
    durationSeconds: 184,
    bpm: 72,
    coverHue: '#6C8270',
    // Ebmaj7 -> Cm7 -> Fm7 -> Bb7
    progression: [
      [155.56, 196.00, 233.08, 293.66], // Eb3, G3, Bb3, D4
      [130.81, 196.00, 233.08, 261.63], // C3, G3, Bb3, C4
      [174.61, 207.65, 261.63, 311.13], // F3, Ab3, C4, Eb4
      [116.54, 174.61, 233.08, 293.66], // Bb2, F3, Bb3, D4
    ],
  },
  {
    id: 'track-2',
    title: 'Library Lamp & Late Thoughts',
    artist: 'Aashi & The Chill Collective',
    vibe: 'Mellow Tape Arpeggios',
    durationSeconds: 210,
    bpm: 66,
    coverHue: '#8675A9',
    // Fmaj7 -> Am7 -> Dm7 -> Bbmaj7
    progression: [
      [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
      [220.00, 261.63, 329.63, 392.00], // A3, C4, E4, G4
      [146.83, 220.00, 261.63, 349.23], // D3, A3, C4, F4
      [116.54, 174.61, 233.08, 293.66], // Bb2, F3, Bb3, D4
    ],
  },
  {
    id: 'track-3',
    title: 'Sunset Train Through Shibuya',
    artist: 'Tokyo Lo-fi Station',
    vibe: 'Nostalgic Analog Synth Pads',
    durationSeconds: 195,
    bpm: 78,
    coverHue: '#D47A60',
    // C#m7 -> Aadd9 -> Emaj7 -> Bsus4
    progression: [
      [138.59, 207.65, 246.94, 329.63], // C#3, Ab3, B3, E4
      [110.00, 164.81, 220.00, 277.18], // A2, E3, A3, C#4
      [164.81, 246.94, 329.63, 415.30], // E3, B3, E4, Ab4
      [123.47, 185.00, 246.94, 329.63], // B2, F#3, B3, E4
    ],
  },
  {
    id: 'track-4',
    title: 'Autumn Leaves & Warm Tea',
    artist: 'Nordic Study Sessions',
    vibe: 'Acoustic Harmonics & Soft Shaker',
    durationSeconds: 228,
    bpm: 70,
    coverHue: '#5F6B72',
    // Gmaj7 -> Em7 -> Cmaj7 -> D9
    progression: [
      [196.00, 246.94, 293.66, 369.99], // G3, B3, D4, F#4
      [164.81, 246.94, 293.66, 392.00], // E3, B3, D4, G4
      [130.81, 196.00, 261.63, 329.63], // C3, G3, C4, E4
      [146.83, 220.00, 293.66, 369.99], // D3, A3, D4, F#4
    ],
  },
  {
    id: 'track-5',
    title: 'Celestial Window Reflections',
    artist: 'Cosmic Library',
    vibe: 'Subtle E-Piano & Deep Sub Bass',
    durationSeconds: 240,
    bpm: 64,
    coverHue: '#D6A461',
    // Dmaj7 -> Bm7 -> Gmaj7 -> A7sus4
    progression: [
      [146.83, 220.00, 277.18, 369.99], // D3, A3, C#4, F#4
      [123.47, 185.00, 246.94, 369.99], // B2, F#3, B3, F#4
      [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
      [110.00, 164.81, 220.00, 293.66], // A2, E3, A3, D4
    ],
  },
];

class LofiMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrackIndex = 0;
  private currentChordIndex = 0;
  private sequenceTimer: NodeJS.Timeout | null = null;
  private progressTimer: NodeJS.Timeout | null = null;
  private elapsedSeconds = 0;
  private volume = 0.5;

  private onTrackChangeCallbacks: ((track: LofiTrack, index: number) => void)[] = [];
  private onPlaybackStateCallbacks: ((isPlaying: boolean) => void)[] = [];
  private onTimeUpdateCallbacks: ((elapsed: number, duration: number) => void)[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Subscribe to track changes
  onTrackChange(cb: (track: LofiTrack, index: number) => void) {
    this.onTrackChangeCallbacks.push(cb);
    cb(CURATED_TRACKS[this.currentTrackIndex], this.currentTrackIndex);
    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter(c => c !== cb);
    };
  }

  // Subscribe to playback state
  onPlaybackState(cb: (isPlaying: boolean) => void) {
    this.onPlaybackStateCallbacks.push(cb);
    cb(this.isPlaying);
    return () => {
      this.onPlaybackStateCallbacks = this.onPlaybackStateCallbacks.filter(c => c !== cb);
    };
  }

  // Subscribe to elapsed time
  onTimeUpdate(cb: (elapsed: number, duration: number) => void) {
    this.onTimeUpdateCallbacks.push(cb);
    return () => {
      this.onTimeUpdateCallbacks = this.onTimeUpdateCallbacks.filter(c => c !== cb);
    };
  }

  getCurrentTrack(): LofiTrack {
    return CURATED_TRACKS[this.currentTrackIndex];
  }

  getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    }
  }

  // Play current track
  play() {
    const ctx = this.getContext();
    if (!ctx) return;

    this.isPlaying = true;
    this.onPlaybackStateCallbacks.forEach(cb => cb(true));

    this.startSequencer();
  }

  // Pause
  pause() {
    this.isPlaying = false;
    this.stopSequencer();
    this.onPlaybackStateCallbacks.forEach(cb => cb(false));
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Skip to next track
  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % CURATED_TRACKS.length;
    this.currentChordIndex = 0;
    this.elapsedSeconds = 0;
    const track = CURATED_TRACKS[this.currentTrackIndex];
    this.onTrackChangeCallbacks.forEach(cb => cb(track, this.currentTrackIndex));

    if (this.isPlaying) {
      this.stopSequencer();
      this.startSequencer();
    }
  }

  // Previous track
  prevTrack() {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
    this.currentChordIndex = 0;
    this.elapsedSeconds = 0;
    const track = CURATED_TRACKS[this.currentTrackIndex];
    this.onTrackChangeCallbacks.forEach(cb => cb(track, this.currentTrackIndex));

    if (this.isPlaying) {
      this.stopSequencer();
      this.startSequencer();
    }
  }

  selectTrack(index: number) {
    if (index >= 0 && index < CURATED_TRACKS.length) {
      this.currentTrackIndex = index;
      this.currentChordIndex = 0;
      this.elapsedSeconds = 0;
      const track = CURATED_TRACKS[this.currentTrackIndex];
      this.onTrackChangeCallbacks.forEach(cb => cb(track, this.currentTrackIndex));
      if (this.isPlaying) {
        this.stopSequencer();
        this.startSequencer();
      }
    }
  }

  // Generative chord voice synthesis (vintage Rhodes e-piano harmonic model)
  private playChordStep(freqs: number[], durationSec: number) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    const masterGain = this.masterGain;

    const now = ctx.currentTime;

    // Soft tape vinyl crackle tone
    const vinylBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = vinylBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.015;
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = vinylBuffer;
    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.08, now);
    crackle.connect(crackleGain);
    crackleGain.connect(masterGain);
    crackle.start(now);

    // Synthesize Rhodes electric piano harmonic layers
    freqs.forEach((freq, idx) => {
      // Base sine oscillator for fundamental warmth
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Subtle vintage chorus detune
      const detune = (idx - 1.5) * 3;
      osc1.detune.setValueAtTime(detune, now);

      // Bell chime overtone layer (adds iconic Rhodes tines bell character)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.01, now);

      // Warm low-pass filter to simulate tape warmth & vintage amp
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + durationSec * 0.8);

      // ADSR Envelope
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.22 / freqs.length, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.95);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.08 / freqs.length, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(filter);
      gain2.connect(filter);

      filter.connect(masterGain);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
    });

    // Gentle sub bass fundamental on root note
    const rootFreq = freqs[0] * 0.5; // one octave below
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(rootFreq, now);

    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.9);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(now);
    subOsc.stop(now + durationSec);
  }

  private startSequencer() {
    const track = CURATED_TRACKS[this.currentTrackIndex];
    // Each chord lasts 4 beats (e.g. 72 BPM = 60/72 * 4 ~= 3.33 seconds)
    const chordDurationSec = (60 / track.bpm) * 4;

    const playNext = () => {
      if (!this.isPlaying) return;
      const progression = track.progression;
      const chord = progression[this.currentChordIndex % progression.length];
      this.playChordStep(chord, chordDurationSec);

      this.currentChordIndex = (this.currentChordIndex + 1) % progression.length;

      this.sequenceTimer = setTimeout(playNext, chordDurationSec * 1000);
    };

    playNext();

    // Elapsed timer updater
    this.progressTimer = setInterval(() => {
      if (this.isPlaying) {
        this.elapsedSeconds += 1;
        if (this.elapsedSeconds >= track.durationSeconds) {
          this.nextTrack();
        } else {
          this.onTimeUpdateCallbacks.forEach(cb => cb(this.elapsedSeconds, track.durationSeconds));
        }
      }
    }, 1000);
  }

  private stopSequencer() {
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }
}

export const lofiEngine = new LofiMusicEngine();
