/** A Spotify artist as it appears on a track. */
export interface ArtistRef {
  id: string | null;
  name: string;
}

/** A track as read from Spotify, reduced to the fields AutoSort uses. */
export interface TrackRef {
  /** Spotify track id. */
  id: string;
  /** `spotify:track:{id}` */
  uri: string;
  name: string;
  artists: ArtistRef[];
  album: {
    name: string;
    /** "1997", "1997-08" or "1997-08-26" */
    releaseDate: string | null;
    releaseDatePrecision: 'year' | 'month' | 'day' | null;
    imageUrl: string | null;
  };
  durationMs: number;
  explicit: boolean;
  isrc: string | null;
  /** When the track was added to the playlist it was read from (ISO 8601). */
  addedAt: string | null;
}

/** Audio descriptors on Spotify's original 0–1 scales (tempo in BPM, key as pitch class). */
export interface AudioFeatures {
  tempo: number;
  /** Pitch class 0 = C … 11 = B; -1 when unknown. */
  key: number;
  /** 1 = major, 0 = minor. */
  mode: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  loudness: number;
}

export const GENRE_BUCKETS = [
  'country',
  'hip-hop',
  'worship',
  'pop',
  'rock',
  'metal',
  'r&b',
  'electronic',
  'latin',
  'jazz',
  'classical',
  'folk',
  'reggae',
  'blues',
  'indie',
  'soundtrack',
] as const;
export type GenreBucket = (typeof GENRE_BUCKETS)[number];

export const MOODS = ['happy', 'sad', 'chill', 'energetic', 'party', 'workout', 'focus'] as const;
export type Mood = (typeof MOODS)[number];

export const THEMES = ['love', 'breakup', 'worship', 'christmas'] as const;
export type Theme = (typeof THEMES)[number];

export interface Tag {
  name: string;
  /** Relative weight 0–100 (Last.fm scale). */
  count: number;
}

/** A track plus everything AutoSort knows about it. Rules and sorting run on this. */
export interface TrackFacts extends TrackRef {
  /** Raw genre strings from the track's artists (Spotify). */
  genres: string[];
  /** Crowd tags (lowercased): the song's and album's first, then the artist's. */
  tags: string[];
  /** The song's genres: its main genre plus any close second. Empty when the evidence is thin. */
  genreBuckets: GenreBucket[];
  /** Likely genres that didn't make the cut, for an optional review. */
  genreNear: GenreBucket[];
  /** Analyzer score per genre. */
  genreScores: Partial<Record<GenreBucket, number>>;
  genreConfidence: 'high' | 'medium' | 'low';
  /** Plain-English reasons for the genre, e.g. "Album tagged country". */
  genreReasons: string[];
  /** Best-known original release year. */
  year: number | null;
  /** Where `year` came from: the recording's first release, or the album it's on. */
  yearSource: 'original' | 'album' | null;
  /** e.g. 1990 for 1990–1999. */
  decade: number | null;
  audio: AudioFeatures | null;
  /** Camelot code, e.g. "8A". */
  camelot: string | null;
  moods: Mood[];
  themes: Theme[];
}
