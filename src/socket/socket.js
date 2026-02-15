import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createMessageService } from "../services/message.service.js";

const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      credentials: true,
    },
  });

  //authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // find user if exist
      const user = await User.findById(decoded.id);

      if (!user) return next(new Error("user not found"));

      socket.user = {
        _id: user._id,
        name: user.name,
      };

      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  //on connection
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    //store online user
    onlineUsers.set(userId, socket.id);

    console.log(`user connected ${userId}`);

    //handle send message
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, conversationId, content } = data;

        const message = await createMessageService({
          senderId: userId,
          receiverId,
          conversationId,
          content,
        });

        //send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId)
          io.to(receiverSocketId).emit("receive_message", message);

        //send back to sender
        socket.emit("message_sent", message);
      } catch (error) {
        socket.emit("error_message", { message: error.message });
      }
    });

    //on disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User Disconnected ${userId}`);
    });
  });
};
