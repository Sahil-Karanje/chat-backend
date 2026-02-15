import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { createMessageService } from "../services/message.service.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, receiverId } = req.body;
    if (!content) return sendError(res, "Content is required", 400);

    const message = await createMessageService({
      senderId: req.user._id,
      receiverId,
      conversationId,
      content,
    });

    return sendSuccess(res, message, 201);
  } catch (error) {
    return sendError(res, "Sever Error", 500, error);
  }
};

// for fetching all messages of individual conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId) return sendError(res, "Conversation Id required", 400);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return sendError(res, "Conversation Not Found", 404);

    //check logged in user is a part of the conversation
    if (
      !conversation.participants.some(
        (id) => id.toString() === req.user._id.toString(),
      )
    )
      return sendError(res, "Not Authorized", 403);

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name username avatar")
      .sort({ createdAt: 1 });

    return sendSuccess(res, messages, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

//for fetching all conversations
export const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name username avatar")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name username",
        },
      })
      .sort({ updatedAt: -1 });

    return sendSuccess(res, conversations, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};
