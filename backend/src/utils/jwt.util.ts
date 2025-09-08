import jwt from 'jsonwebtoken';

/**
 * Sign a JWT token
 * @param payload Payload to sign
 * @param secret Secret to use for signing
 * @param expiresIn Token expiration time
 * @returns Signed JWT token
 */
export const sign = (
  payload: { sub: string },
  secret: string = process.env.JWT_SECRET || 'default_secret_for_development',
  expiresIn: string = process.env.JWT_EXPIRES_IN || '15m'
): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
};

/**
 * Verify a JWT token
 * @param token Token to verify
 * @param secret Secret to use for verification
 * @returns Decoded token payload
 */
export const verify = (
  token: string,
  secret: string = process.env.JWT_SECRET || 'default_secret_for_development'
): { sub: string } => {
  try {
    const decoded = jwt.verify(token, secret) as { sub: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};