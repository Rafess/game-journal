import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import {
  getRawgGameById,
  searchRawgGames,
} from "./rawg.service.js";

const gameRoutes = Router();

// Search games using the external RAWG API
gameRoutes.get("/search", async (req, res) => {
  const query = req.query.query;

  if (typeof query !== "string" || query.trim().length < 2) {
    return res.status(400).json({
      message: "Query must contain at least 2 characters.",
    });
  }

  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    console.error("RAWG_API_KEY is not configured.");

    return res.status(500).json({
      message: "Game catalog integration is not configured.",
    });
  }

  try {
    const result = await searchRawgGames(query.trim(), apiKey);

    return res.status(200).json(result);
  } catch (error) {
    console.error("RAWG search failed:", error);

    return res.status(502).json({
      message: "The external game catalog is currently unavailable.",
    });
  }
});

// Import a game from RAWG into our database
gameRoutes.post("/import", async (req, res) => {
  const rawgId = req.body?.rawgId;

  if (
    typeof rawgId !== "number" ||
    !Number.isSafeInteger(rawgId) ||
    rawgId <= 0
  ) {
    return res.status(400).json({
      message: "rawgId must be a positive integer.",
    });
  }

  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    console.error("RAWG_API_KEY is not configured.");

    return res.status(500).json({
      message: "Game catalog integration is not configured.",
    });
  }

  let rawgGame;

  try {
    rawgGame = await getRawgGameById(rawgId, apiKey);
  } catch (error) {
    console.error("RAWG game lookup failed:", error);

    return res.status(502).json({
      message: "Failed to retrieve game details from RAWG.",
    });
  }

  if (!rawgGame) {
    return res.status(404).json({
      message: "Game not found in RAWG.",
    });
  }

  const releaseDate =
    rawgGame.released &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawgGame.released)
      ? new Date(`${rawgGame.released}T00:00:00.000Z`)
      : null;

  const gameData = {
    slug: rawgGame.slug,
    title: rawgGame.name,
    description: rawgGame.description_raw ?? null,
    coverUrl: rawgGame.background_image ?? null,
    releaseDate,
  };

  try {
    const game = await prisma.game.upsert({
      where: {
        rawgId: rawgGame.id,
      },
      create: {
        rawgId: rawgGame.id,
        ...gameData,
        updatedAt: new Date(),
      },
      update: {
        ...gameData,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Game saved to GameJournal.",
      game,
    });
  } catch (error) {
    console.error("Failed to save game:", error);

    return res.status(500).json({
      message: "Failed to save game to the database.",
    });
  }
});

// Get games saved in our MySQL database
gameRoutes.get("/", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return res.status(200).json(games);
  } catch (error) {
    console.error("Error fetching games:", error);

    return res.status(500).json({
      message: "Failed to fetch games.",
    });
  }
});

export default gameRoutes;