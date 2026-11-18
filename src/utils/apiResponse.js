/**
 * Standard API response helper functions
 */
export const sendSuccess = (res, statusCode = 200, message = 'Operation successful', data = null, pagination = null) => {
  const response = {
    success: true,
    message,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
