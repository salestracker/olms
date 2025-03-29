import jwt from 'jsonwebtoken';
import { AuthUser } from '../core/trpc';

// Constants (in production, get from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'zenith-jwt-secret-key';
const TOKEN_EXPIRY = '24h';

/**
 * Generate a JWT token for a user
 * 
 * @param user The user to generate a token for
 * @returns A JWT token string
 */
export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Verify a JWT token and extract the user information
 * 
 * @param token JWT token to verify
 * @returns The user payload if valid, null otherwise
 */
export const verifyToken = (token: string): { 
  id: string;
  email: string;
  role: string; 
} | null => {
  if (!token) {
    console.error('No token provided for verification');
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Validate the decoded payload has required fields
    if (!decoded.id || !decoded.email || !decoded.role) {
      console.error('Invalid token payload structure', decoded);
      return null;
    }
    
    // Check if token is expired (redundant with jwt.verify but added for clarity)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.error('Token has expired', { expiry: new Date(decoded.exp * 1000) });
      return null;
    }
    
    console.log('Token successfully verified for user:', decoded.email);
    return decoded;
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};
