import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}