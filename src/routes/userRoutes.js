import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { searchUsers } from '../controllers/userController.js';

const router = express.Router();

router.get("/search", protect, searchUsers);

export default router;
