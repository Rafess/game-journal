const RAWG_BASE_URL = "https://api.rawg.io/api";

interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  background_image?: string | null;
  description_raw?: string | null;
  rating?: number;
  ratings_count?: number;
  metacritic?: number | null;
  genres?: {
    id: number;
    name: string;
    slug: string;
  }[];
  platforms?: {
    platform: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
}

interface RawgSearchResponse {
  count: number;
  results: RawgGame[];
}

export async function searchRawgGames(
  query: string,
  apiKey: string,
) {
  const params = new URLSearchParams({
    key: apiKey,
    search: query,
    page_size: "10",
  });

  const response = await fetch(
    `${RAWG_BASE_URL}/games?${params.toString()}`,
    {
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `RAWG API request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as RawgSearchResponse;

  return {
    source: "RAWG",
    count: data.count,
    results: data.results.map((game) => ({
      externalId: game.id,
      name: game.name,
      slug: game.slug,
      released: game.released ?? null,
      coverUrl: game.background_image ?? null,
      rating: game.rating ?? null,
      ratingsCount: game.ratings_count ?? 0,
      metacritic: game.metacritic ?? null,
      genres: game.genres?.map((genre) => genre.name) ?? [],
      platforms:
        game.platforms?.map(({ platform }) => platform.name) ?? [],
    })),
  };
}

export async function getRawgGameById(
  gameId: number,
  apiKey: string,
): Promise<RawgGame | null> {
  const params = new URLSearchParams({
    key: apiKey,
  });

  const response = await fetch(
    `${RAWG_BASE_URL}/games/${gameId}?${params.toString()}`,
    {
      signal: AbortSignal.timeout(8000),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `RAWG API request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as RawgGame;
}