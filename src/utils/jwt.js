import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {Object} payload 
 * @param {string} expiresIn 
 * @returns {string} token
 */
export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token 
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return jwt.verify(token, secret);
};
