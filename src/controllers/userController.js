import User from "../models/User.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") return sendSuccess(res, [], 200);

    const users = await User.find({
      _id: { $ne: req.user._id },
      deletedAt: null,
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id username name avatar email")
      .limit(10);

    return sendSuccess(res, users, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    const { bio, username, avatar } = req.body;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (username !== undefined) user.username = username;
    await user.save();

    return sendSuccess(res, user, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};
