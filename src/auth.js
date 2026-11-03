import jwt from 'jsonwebtoken';

const ORDERS_JWT_ALGORITHMS = ['HS256'];

export function ordersJwtSecret() {
  return process.env.ORDERS_JWT_SECRET ?? '';
}

export function bearerToken(authorization) {
  if (typeof authorization !== 'string') return undefined;
  const [scheme, value] = authorization.split(' ');
  if (scheme !== 'Bearer' || !value) return undefined;
  return value;
}

export function verifyOrderToken(token, secret = ordersJwtSecret()) {
  if (!secret) throw new jwt.JsonWebTokenError('ORDERS_JWT_SECRET is not configured');
  return jwt.verify(token, secret, { algorithms: ORDERS_JWT_ALGORITHMS });
}

export function requireOrderToken(req, res, next) {
  const token = bearerToken(req.get('authorization'));
  if (!token) return res.status(401).json({ error: 'missing bearer token' });
  try {
    req.user = verifyOrderToken(token);
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
  return next();
}
