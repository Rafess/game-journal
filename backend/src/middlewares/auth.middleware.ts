import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedUser {
  id: number;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token is required.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is required.",
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      id: userId,
      username: payload.username,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
}