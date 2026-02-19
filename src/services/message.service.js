import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const createMessageService = async ({
  senderId,
  receiverId,
  conversationId,
  content,
}) => {
  let conversation = null;

  // Only try findById if it's a real Mongo ObjectId (temp IDs like "temp-abc" will fail this)
  if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
    conversation = await Conversation.findById(conversationId);
  }

  // If no conversation found (temp ID, invalid ID, or just not found), find or create one
  if (!conversation) {
    if (!receiverId) throw new Error("Receiver required to create a conversation");

    conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        isGroup: false,
      });
    }
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    content,
    readBy: [senderId],
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  // Return message with the real conversationId attached
  // so the socket layer can emit it back to the frontend
  return {
    ...message.toObject(),
    conversationId: conversation._id,
  };
};