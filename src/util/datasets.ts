export type Dataset = {
  name: string;
  file: string;
  columns: string[];
  indexes: string[];
};

export const DATASETS: Dataset[] = [
  {
    name: 'title_basics',
    file: 'title.basics.tsv.gz',
    columns: [
      'tconst TEXT PRIMARY KEY',
      'title_type TEXT',
      'primary_title TEXT',
      'original_title TEXT',
      'is_adult BOOLEAN',
      'start_year INT',
      'end_year INT',
      'runtime_minutes INT',
      'genres TEXT',
    ],
    indexes: ['title_type', 'start_year', 'genres'],
  },
  {
    name: 'title_ratings',
    file: 'title.ratings.tsv.gz',
    columns: ['tconst TEXT PRIMARY KEY', 'average_rating FLOAT', 'num_votes INT'],
    indexes: ['average_rating', 'num_votes'],
  },
  {
    name: 'title_episode',
    file: 'title.episode.tsv.gz',
    columns: ['tconst TEXT PRIMARY KEY', 'parent_tconst TEXT', 'season_number INT', 'episode_number INT'],
    indexes: ['parent_tconst', 'season_number', 'episode_number'],
  },
];
