import jwt from 'jsonwebtoken';

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
  return jwt.verify(token, secret);
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
