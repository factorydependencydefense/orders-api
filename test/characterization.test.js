// These assertions pinned the alg:none forgery that jsonwebtoken 8.5.1 accepted; they now pin its rejection on 9.0.3.
import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { verifyOrderToken } from '../src/auth.js';
import { createApp } from '../src/index.js';

function algNoneToken(payload) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'none', typ: 'JWT' })}.${part(payload)}.`;
}

async function withoutSecret(fn) {
  const previous = process.env.ORDERS_JWT_SECRET;
  delete process.env.ORDERS_JWT_SECRET;
  try {
    return await fn();
  } finally {
    if (previous !== undefined) process.env.ORDERS_JWT_SECRET = previous;
  }
}

test('secure now: an alg:none token is rejected when ORDERS_JWT_SECRET is unset', async () => {
  await withoutSecret(() => {
    assert.throws(
      () => verifyOrderToken(algNoneToken({ sub: 'attacker', role: 'admin' })),
      jwt.JsonWebTokenError,
    );
  });
});

test('secure now: POST /orders rejects a forged alg:none bearer token when ORDERS_JWT_SECRET is unset', async () => {
  await withoutSecret(async () => {
    const res = await request(createApp())
      .post('/orders')
      .set('Authorization', `Bearer ${algNoneToken({ sub: 'attacker' })}`)
      .send({ lines: [{ qty: 1, unitPrice: 9 }] })
      .expect(401);
    assert.equal(res.body.error, 'invalid token');
  });
});
