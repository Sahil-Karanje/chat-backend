import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import http from "http";
import { initSocket } from "./src/socket/socket.js";
import cors from "cors";

// configuring environmental variables
dotenv.config();

//connecting to db
connectDB();

const app = express();

const server = http.createServer(app);

//initialize socket
initSocket(server);

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

//routes
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`server is running on port:${PORT}`);
});
