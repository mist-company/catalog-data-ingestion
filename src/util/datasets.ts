export type Dataset = {
  file: string;
  collection: string;
  transform: (row: any) => any;
};

export const datasets: Dataset[] = [
  {
    file: 'title.basics.tsv.gz',
    collection: 'titles',
    transform: (row) => ({
      _id: row.tconst,
      titleType: row.titleType,
      primaryTitle: row.primaryTitle,
      originalTitle: row.originalTitle,
      isAdult: row.isAdult === '1',
      startYear: row.startYear ? parseInt(row.startYear, 10) : null,
      endYear: row.endYear ? parseInt(row.endYear, 10) : null,
      runtimeMinutes: row.runtimeMinutes ? parseInt(row.runtimeMinutes, 10) : null,
      genres: row.genres ? row.genres.split(',') : [],
    }),
  },
  {
    file: 'title.episode.tsv.gz',
    collection: 'episodes',
    transform: (row) => ({
      _id: row.tconst,
      parentId: row.parentTconst,
      seasonNumber: row.seasonNumber ? parseInt(row.seasonNumber, 10) : null,
      episodeNumber: row.episodeNumber ? parseInt(row.episodeNumber, 10) : null,
    }),
  },
];
