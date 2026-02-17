import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }, // long life
  );
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendError(res, "No refresh token provided", 401);
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return sendError(res, "Invalid refresh token", 403);
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, "Refresh token mismatch", 403);
    }

    const newAccessToken = generateAccessToken(user._id);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    return sendSuccess(
      res,
      {
        accessToken: newAccessToken,
      },
      200,
    );
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Basic validation
    if (!name || !username || !email || !password) {
      return sendError(res, "All fields are required", 400, null);
    }

    // Check existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return sendError(res, "Email already in use", 409, null);

    // Check existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return sendError(res, "Username already taken", 409, null);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      avatar: "",
      bio: "",
      isOnline: false,
      lastSeen: null,
      role: "user",
      isVerified: false,
    });

    // Generate JWT cookie
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    //setting tokens in cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Remove sensitive fields manually (since password has select:false)
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    };

    // we are sending accesstoken here also for socket handshake
    return sendSuccess(
      res,
      {
        user: userResponse,
        accessToken,
      },
      201,
    );
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    // select +password because schema hides it
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Generate JWT cookie
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    //setting tokens in cookies
    setAuthCookies(res, accessToken, refreshToken);

    // safe response
    const userResponse = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    };

    // we are sending accesstoken here also for socket handshake
    return sendSuccess(
      res,
      {
        user: userResponse,
        accessToken,
      },
      200,
    );
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

export const logoutUser = async (req, res) => {
  try {
    // req.user comes from protect middleware
    const user = await User.findById(req.user._id).select("+refreshToken");

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    return sendSuccess(res, { message: "Logged out successfully" }, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

export const getMe = async (req, res) => {
  try {
    return sendSuccess(res, req.user, 200);
  } catch (error) {
    return sendError(res, "Server Error", 500, error);
  }
};

//reset passoword functionality have to be implimented
