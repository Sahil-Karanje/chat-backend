import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendError } from "../utils/responseHandler.js";

export const protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return sendError(res, "Not authenticated", 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (err) {
      return sendError(res, "Invalid or expired token", 401);
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (user.deletedAt) {
      return sendError(res, "Account deleted", 403);
    }

    // attach user safely
    req.user = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    };

    next();
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};
