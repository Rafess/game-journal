import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authenticateToken } from "../../middlewares/auth.middleware.js";

const libraryRoutes = Router();

const GAME_STATUSES = [
  "WANT_TO_PLAY",
  "PLAYING",
  "COMPLETED",
  "DROPPED",
] as const;

type GameStatusValue = (typeof GAME_STATUSES)[number];

function isGameStatus(value: unknown): value is GameStatusValue {
  return (
    typeof value === "string" &&
    GAME_STATUSES.includes(value as GameStatusValue)
  );
}

function getPrismaErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

// Get the authenticated user's library
libraryRoutes.get("/", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "Authentication is required.",
    });
  }

  try {
    const library = await prisma.userGame.findMany({
      where: {
        userId,
      },
      include: {
        game: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      count: library.length,
      library,
    });
  } catch (error) {
    console.error("Failed to fetch user library:", error);

    return res.status(500).json({
      message: "Failed to retrieve library.",
    });
  }
});

// Add a game to the authenticated user's library
libraryRoutes.post("/", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "Authentication is required.",
    });
  }

  const gameId: unknown = req.body?.gameId;
  const requestedStatus: unknown = req.body?.status;

  if (
    typeof gameId !== "number" ||
    !Number.isSafeInteger(gameId) ||
    gameId <= 0
  ) {
    return res.status(400).json({
      message: "gameId must be a positive integer.",
    });
  }

  let status: GameStatusValue = "WANT_TO_PLAY";

  if (requestedStatus !== undefined) {
    if (!isGameStatus(requestedStatus)) {
      return res.status(400).json({
        message: "Invalid game status.",
        allowedStatuses: GAME_STATUSES,
      });
    }

    status = requestedStatus;
  }

  try {
    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
      },
    });

    if (!game) {
      return res.status(404).json({
        message: "Game not found.",
      });
    }

    const libraryEntry = await prisma.userGame.create({
      data: {
        userId,
        gameId,
        status,
      },
      include: {
        game: true,
      },
    });

    return res.status(201).json({
      message: "Game added to your library.",
      libraryEntry,
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2002") {
      return res.status(409).json({
        message: "This game is already in your library.",
      });
    }

    console.error("Failed to add game to library:", error);

    return res.status(500).json({
      message: "Failed to add game to library.",
    });
  }
});

// Update a game's status in the authenticated user's library
libraryRoutes.patch(
  "/:gameId",
  authenticateToken,
  async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication is required.",
      });
    }

    const gameId = Number(req.params.gameId);
    const requestedStatus: unknown = req.body?.status;

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        message: "A valid gameId is required.",
      });
    }

    if (!isGameStatus(requestedStatus)) {
      return res.status(400).json({
        message: "A valid status is required.",
        allowedStatuses: GAME_STATUSES,
      });
    }

    try {
      const libraryEntry = await prisma.userGame.update({
        where: {
          userId_gameId: {
            userId,
            gameId,
          },
        },
        data: {
          status: requestedStatus,
        },
        include: {
          game: true,
        },
      });

      return res.status(200).json({
        message: "Game status updated successfully.",
        libraryEntry,
      });
    } catch (error) {
      if (getPrismaErrorCode(error) === "P2025") {
        return res.status(404).json({
          message: "Game not found in your library.",
        });
      }

      console.error("Failed to update library entry:", error);

      return res.status(500).json({
        message: "Failed to update game status.",
      });
    }
  },
);

export default libraryRoutes;