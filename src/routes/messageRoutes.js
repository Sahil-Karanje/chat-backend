import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMessages, getMyConversations, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/conversations", protect, getMyConversations);
router.get("/messages/:conversationId", protect, getMessages);

export default router;
