export interface SpotifyPlaylist {
  id: string;
  name: string;
  curator: string;
  description: string;
  uri: string;
  embedUrl: string;
  accent: string;
}

export const CURATED_SPOTIFY_PLAYLISTS: SpotifyPlaylist[] = [
  {
    id: 'lofi-beats',
    name: 'Lofi Beats',
    curator: 'Spotify Official',
    description: 'The world\'s most popular chill instrumental beats for studying',
    uri: 'spotify:playlist:37i9dQZF1DX8Uebhn9wzrS',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0',
    accent: '#6C8270',
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    curator: 'Spotify Official',
    description: 'Keep calm and focus with atmospheric ambient post-rock & synth',
    uri: 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0',
    accent: '#8675A9',
  },
  {
    id: 'peaceful-piano',
    name: 'Peaceful Piano',
    curator: 'Spotify Official',
    description: 'Peaceful solo piano to help you concentrate and relax',
    uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
    accent: '#5F6B72',
  },
  {
    id: 'chill-instrumental',
    name: 'Chill Instrumental Beats',
    curator: 'Spotify Official',
    description: 'Downtempo instrumental hip hop and relaxing grooves',
    uri: 'spotify:playlist:37i9dQZF1DXdLEN7aqioXM',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0',
    accent: '#D47A60',
  },
];

// Helper to convert any user-provided Spotify URL to an Embed URL
export const parseSpotifyEmbedUrl = (inputUrlOrUri: string): string | null => {
  if (!inputUrlOrUri) return null;
  const trimmed = inputUrlOrUri.trim();

  // If already embed URL
  if (trimmed.includes('open.spotify.com/embed/')) {
    return trimmed;
  }

  // Handle standard Spotify web URL: https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS...
  const match = trimmed.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
  if (match) {
    const type = match[1];
    const id = match[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  // Handle Spotify URI: spotify:playlist:37i9dQZF1DX8Uebhn9wzrS
  const uriMatch = trimmed.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    const type = uriMatch[1];
    const id = uriMatch[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  return null;
};
