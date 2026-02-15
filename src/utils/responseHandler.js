export const sendError = (res, message, statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : undefined,
  });
};

export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};
