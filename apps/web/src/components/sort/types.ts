/** One row of the sort view: a playlist entry plus the audio data the sorts need. */
export interface SortRow {
  /** Unique per row: the track id, or "id#2" for a repeat of the same song. */
  key: string;
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  addedAt: string | null;
  releaseDate: string | null;
  durationMs: number;
  tempo: number | null;
  camelot: string | null;
  energy: number | null;
  valence: number | null;
}

export interface SortPlaylistInfo {
  id: string;
  name: string;
  /** Items in the playlist that AutoSort can't read (local files, podcast episodes, unavailable songs). */
  hidden: number;
  /** Set when this is one of the user's AutoSort smart playlists. */
  smartPlaylistId: string | null;
}
