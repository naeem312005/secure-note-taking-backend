import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'careguide_super_secret_jwt_key_2026';

/**
 * Generate a signed JWT token
 * @param {Object} payload 
 * @param {string} expiresIn 
 * @returns {string} token
 */
export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {string} token 
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return jwt.verify(token, secret);
};
