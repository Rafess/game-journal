import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import {authenticateToken} from "../../middlewares/auth.middleware.js";
const authRoutes = Router();

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function createAccessToken(
  userId: number,
  username: string,
  secret: string,
): string {
  return jwt.sign(
    { username },
    secret,
    {
      subject: String(userId),
      expiresIn: "1h",
    },
  );
}

// Register a new user
authRoutes.post("/register", async (req, res) => {
  const { username, email, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Username, email, and password are required.",
    });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 30 ||
    !/^[a-z0-9_.-]+$/.test(normalizedUsername)
  ) {
    return res.status(400).json({
      message:
        "Username must contain 3-30 characters and use only letters, numbers, dots, hyphens, or underscores.",
    });
  }

  if (
    normalizedEmail.length > 191 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({
      message: "A valid email address is required.",
    });
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "Password must contain at least 8 characters and no more than 72 bytes.",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email is already in use.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    const token = createAccessToken(
      user.id,
      user.username,
      jwtSecret,
    );

    return res.status(201).json({
      message: "User registered successfully.",
      user,
      token,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({
        message: "Username or email is already in use.",
      });
    }

    console.error("User registration failed:", error);

    return res.status(500).json({
      message: "Failed to register user.",
    });
  }
});

// Log in an existing user
authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return res.status(401).json({
      message: "Invalid email or password.",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createAccessToken(
      user.id,
      user.username,
      jwtSecret,
    );

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("User login failed:", error);

    return res.status(500).json({
      message: "Failed to log in.",
    });
  }
});
// Get the authenticated user's profile
authRoutes.get("/me", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "Authentication is required.",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Failed to fetch authenticated user:", error);

    return res.status(500).json({
      message: "Failed to retrieve user profile.",
    });
  }
});

export default authRoutes;