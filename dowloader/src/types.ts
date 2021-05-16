export type Anime = {
  id: string;
  title: string;
};

export type Result<T> = { error: Error } | { success: T };

export type Episode = {
  episodeNumber: number;
  dataSource: string;
};
