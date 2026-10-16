import express from "express";
import cors from "cors";
import gameRoutes from "./modules/games/game.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import libraryRoutes from "./modules/library/library.route.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "GameJournal API is running",
  });
});
app.use("/games", gameRoutes);
app.use("/auth", authRoutes);
app.use("/library", libraryRoutes)
export default app;