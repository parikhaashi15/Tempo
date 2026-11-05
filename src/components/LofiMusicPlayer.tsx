import React, { useState, useEffect } from 'react';
import {
  lofiEngine,
  CURATED_TRACKS,
  LofiTrack,
} from '../services/lofiAudioEngine';
import {
  CURATED_SPOTIFY_PLAYLISTS,
  SpotifyPlaylist,
  parseSpotifyEmbedUrl,
} from '../services/spotifyService';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc,
  Music2,
  Radio,
  ListMusic,
  ExternalLink,
  Sparkles,
  Link2,
} from 'lucide-react';

export const LofiMusicPlayer: React.FC = () => {
  // Player Source: 'builtin' (Tempo Lo-Fi Radio) vs 'spotify'
  const [source, setSource] = useState<'builtin' | 'spotify'>('builtin');

  // Built-in Player State
  const [currentTrack, setCurrentTrack] = useState<LofiTrack>(lofiEngine.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(lofiEngine.getIsPlaying());
  const [elapsed, setElapsed] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showTracklist, setShowTracklist] = useState<boolean>(false);

  // Spotify State
  const [selectedSpotifyPlaylist, setSelectedSpotifyPlaylist] = useState<SpotifyPlaylist>(
    CURATED_SPOTIFY_PLAYLISTS[0]
  );
  const [customSpotifyUrl, setCustomSpotifyUrl] = useState<string>('');
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>(CURATED_SPOTIFY_PLAYLISTS[0].embedUrl);
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);

  // Subscribe to Lo-Fi engine
  useEffect(() => {
    const unsubTrack = lofiEngine.onTrackChange((track) => {
      setCurrentTrack(track);
    });

    const unsubState = lofiEngine.onPlaybackState((playing) => {
      setIsPlaying(playing);
    });

    const unsubTime = lofiEngine.onTimeUpdate((time) => {
      setElapsed(time);
    });

    return () => {
      unsubTrack();
      unsubState();
      unsubTime();
    };
  }, []);

  const handleTogglePlay = () => {
    lofiEngine.togglePlay();
  };

  const handleNext = () => {
    lofiEngine.nextTrack();
  };

  const handlePrev = () => {
    lofiEngine.prevTrack();
  };

  const handleSelectTrack = (index: number) => {
    lofiEngine.selectTrack(index);
    if (!isPlaying) {
      lofiEngine.play();
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    lofiEngine.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      lofiEngine.setVolume(volume || 0.5);
    } else {
      setIsMuted(true);
      lofiEngine.setVolume(0);
    }
  };

  // Spotify Handlers
  const handleSelectSpotifyPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedSpotifyPlaylist(playlist);
    setActiveEmbedUrl(playlist.embedUrl);
    setCustomUrlError(null);
    // Pause built-in if active
    if (isPlaying) {
      lofiEngine.pause();
    }
  };

  const handleLoadCustomSpotify = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomUrlError(null);
    const parsed = parseSpotifyEmbedUrl(customSpotifyUrl);
    if (parsed) {
      setActiveEmbedUrl(parsed);
      // Pause built-in
      if (isPlaying) lofiEngine.pause();
    } else {
      setCustomUrlError('Please enter a valid Spotify playlist, album, or track link (e.g. https://open.spotify.com/playlist/...)');
    }
  };

  // Format time mm:ss
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = currentTrack.durationSeconds > 0
    ? (elapsed / currentTrack.durationSeconds) * 100
    : 0;

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 sm:p-6 shadow-xs transition-colors">
      {/* Player Header: Title & Source Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
              Study Ambience & Lo-Fi Music
            </h3>
            <span className="text-[11px] text-[var(--theme-text-muted)]">
              Background soundtrack for deep focus sessions
            </span>
          </div>
        </div>

        {/* Source Toggle: Built-in Radio vs Spotify */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
          <button
            onClick={() => {
              setSource('builtin');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              source === 'builtin'
                ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] font-bold shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Music2 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            <span>Built-in Lo-Fi Radio</span>
          </button>

          <button
            onClick={() => {
              setSource('spotify');
              // Pause built-in when switching to Spotify
              if (isPlaying) lofiEngine.pause();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              source === 'spotify'
                ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] font-bold shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-[#1DB954]" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.518 17.304c-.217.356-.677.472-1.034.254-2.83-1.73-6.392-2.122-10.588-1.164-.407.094-.816-.16-.91-.567-.094-.407.16-.816.567-.91 4.58-1.045 8.52-.597 11.71 1.353.357.218.473.677.255 1.034zm1.472-3.272c-.273.444-.855.586-1.3.313-3.24-1.99-8.18-2.568-12.012-1.404-.498.15-1.026-.134-1.178-.632-.15-.497.135-1.025.632-1.177 4.38-1.33 9.83-.69 13.545 1.597.446.273.587.855.313 1.303zm.126-3.41c-3.885-2.307-10.29-2.52-14.004-1.393-.596.182-1.228-.158-1.41-.754-.182-.596.158-1.228.754-1.41 4.264-1.295 11.336-1.044 15.82 1.62.535.317.71 1.01.392 1.545-.317.535-1.01.71-1.545.392z" />
            </svg>
            <span>Connect Spotify</span>
          </button>
        </div>
      </div>

      {/* View A: Built-in Lo-Fi Radio Player */}
      {source === 'builtin' && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Spinning Vinyl & Track Info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                {/* Vinyl record disc */}
                <div
                  className={`w-full h-full rounded-full border-4 border-black/80 bg-slate-900 shadow-md flex items-center justify-center transition-transform ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '4s' }}
                >
                  {/* Vinyl label center */}
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: currentTrack.coverHue }}
                  >
                    <Disc className="w-4 h-4 text-white/90" />
                  </div>
                </div>

                {/* Playing soundwave badge */}
                {isPlaying && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xs">
                    <span className="w-1 h-2.5 bg-[var(--theme-accent)] rounded-full animate-pulse" />
                    <span className="w-1 h-3.5 bg-[var(--theme-accent)] rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-[var(--theme-accent)] rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>

              {/* Title, Artist, Vibe */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-[var(--theme-text-primary)] truncate font-['Plus_Jakarta_Sans']">
                    {currentTrack.title}
                  </h4>
                </div>
                <p className="text-xs text-[var(--theme-text-muted)] truncate mt-0.5">
                  {currentTrack.artist}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--theme-text-muted)] font-mono">
                  <span className="text-[var(--theme-accent)] font-semibold">{currentTrack.vibe}</span>
                  <span>·</span>
                  <span>{currentTrack.bpm} BPM</span>
                </div>
              </div>
            </div>

            {/* Transport Controls (Prev, Play, Next) */}
            <div className="flex items-center gap-3 self-center sm:self-auto shrink-0">
              <button
                onClick={handlePrev}
                className="p-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--theme-accent)] text-white shadow-sm hover:opacity-95 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play Lo-Fi Music'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                className="p-2.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
                title="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowTracklist(!showTracklist)}
                className={`p-2.5 rounded-xl border border-[var(--theme-border)] transition-colors ${
                  showTracklist
                    ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]'
                    : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
                title="View curated tracklist"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--theme-text-muted)] tabular-nums">
              <span>{formatSeconds(elapsed)}</span>
              <span>{formatSeconds(currentTrack.durationSeconds)}</span>
            </div>

            {/* Scrubber bar */}
            <div className="relative w-full h-1.5 bg-[var(--theme-surface-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
              <div
                className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Bottom Row: Volume Slider */}
            <div className="flex items-center justify-end gap-2 pt-1 text-xs text-[var(--theme-text-muted)]">
              <button
                onClick={handleToggleMute}
                className="p-1 hover:text-[var(--theme-text-primary)] transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 sm:w-28 accent-[var(--theme-accent)]"
              />
            </div>
          </div>

          {/* Curated Tracklist Drawer */}
          {showTracklist && (
            <div className="pt-4 border-t border-[var(--theme-border)] space-y-1.5 animate-in fade-in">
              <div className="text-xs font-bold text-[var(--theme-text-primary)] mb-2">
                Curated Ambient Study Tracks
              </div>
              {CURATED_TRACKS.map((track, idx) => {
                const isSelected = track.id === currentTrack.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]/50'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-[var(--theme-text-muted)] w-4 text-center">
                        {isSelected && isPlaying ? (
                          <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] inline-block animate-ping" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                          {track.title}
                        </div>
                        <div className="text-[10px] text-[var(--theme-text-muted)] font-mono">
                          {track.vibe} · {track.bpm} BPM
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[11px] text-[var(--theme-text-muted)] tabular-nums shrink-0">
                      {formatSeconds(track.durationSeconds)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View B: Spotify Connected Player */}
      {source === 'spotify' && (
        <div className="mt-5 space-y-4 animate-in fade-in">
          {/* Quick Curated Playlists Selector */}
          <div>
            <div className="text-xs font-semibold text-[var(--theme-text-primary)] mb-2 flex items-center justify-between">
              <span>Curated Spotify Study Playlists:</span>
              <span className="text-[11px] text-[var(--theme-text-muted)]">Official Spotify Streams</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CURATED_SPOTIFY_PLAYLISTS.map(playlist => {
                const isSelected = selectedSpotifyPlaylist.id === playlist.id && activeEmbedUrl === playlist.embedUrl;
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectSpotifyPlaylist(playlist)}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#1DB954] bg-[#1DB954]/10 ring-1 ring-[#1DB954]'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] hover:border-[#1DB954]/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                      {playlist.name}
                    </div>
                    <div className="text-[10px] text-[var(--theme-text-muted)] truncate mt-0.5">
                      {playlist.curator}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Spotify URL Input */}
          <form onSubmit={handleLoadCustomSpotify} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
              <input
                type="text"
                value={customSpotifyUrl}
                onChange={e => setCustomSpotifyUrl(e.target.value)}
                placeholder="Or paste any Spotify playlist / album URL (https://open.spotify.com/playlist/...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[#1DB954]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#1DB954] rounded-lg hover:bg-[#1AA34A] transition-colors whitespace-nowrap"
            >
              Load Playlist
            </button>
          </form>

          {customUrlError && (
            <p className="text-[11px] text-rose-500">{customUrlError}</p>
          )}

          {/* Spotify Official Embedded Player IFrame */}
          <div className="rounded-xl overflow-hidden border border-[var(--theme-border)] shadow-xs bg-black">
            <iframe
              title="Spotify Study Player"
              src={activeEmbedUrl}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-muted)] pt-1">
            <span>Spotify Web Player stream</span>
            <a
              href="https://open.spotify.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#1DB954] transition-colors"
            >
              <span>Open in Spotify App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
