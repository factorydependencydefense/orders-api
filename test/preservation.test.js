import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { bearerToken, verifyOrderToken } from '../src/auth.js';
import { createApp } from '../src/index.js';

const SECRET = 'orders-preservation-secret';

async function withSecret(secret, fn) {
  const previous = process.env.ORDERS_JWT_SECRET;
  process.env.ORDERS_JWT_SECRET = secret;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.ORDERS_JWT_SECRET;
    else process.env.ORDERS_JWT_SECRET = previous;
  }
}

function sign(payload, secret = SECRET) {
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

test('verifyOrderToken accepts a token signed with the configured secret', async () => {
  const claims = await withSecret(SECRET, () => verifyOrderToken(sign({ sub: 'u1' })));
  assert.equal(claims.sub, 'u1');
});

test('verifyOrderToken rejects a token signed with another secret', async () => {
  await withSecret(SECRET, () => {
    assert.throws(() => verifyOrderToken(sign({ sub: 'u1' }, 'not-the-secret')), jwt.JsonWebTokenError);
  });
});

test('bearerToken reads only the Bearer scheme', () => {
  assert.equal(bearerToken('Bearer abc'), 'abc');
  assert.equal(bearerToken('Basic abc'), undefined);
  assert.equal(bearerToken(undefined), undefined);
});

test('POST /orders accepts a legitimate HS256 bearer token', async () => {
  await withSecret(SECRET, async () => {
    const res = await request(createApp())
      .post('/orders')
      .set('Authorization', `Bearer ${sign({ sub: 'u1' })}`)
      .send({ lines: [{ qty: 2, unitPrice: 4 }] })
      .expect(201);
    assert.equal(res.body.total, 8);
    assert.equal(res.body.actor, 'u1');
  });
});

test('POST /orders returns 401 without a bearer token', async () => {
  await withSecret(SECRET, async () => {
    await request(createApp()).post('/orders').send({ lines: [] }).expect(401);
  });
});

test('GET /orders/summary stays open', async () => {
  const res = await request(createApp()).get('/orders/summary').expect(200);
  assert.deepEqual(res.body, {});
});
