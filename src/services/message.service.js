import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const createMessageService = async ({
  senderId,
  receiverId,
  conversationId,
  content,
}) => {
  let conversation;

  // If conversationId provided
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
  } else {
    if (!receiverId) {
      throw new Error("Receiver required");
    }

    conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
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

  return message;
};
