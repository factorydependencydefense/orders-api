import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { verifyOrderToken } from '../../src/auth.js';
import { createApp } from '../../src/index.js';

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

test('verifyOrderToken rejects an alg:none token when no secret is configured', async () => {
  await withoutSecret(() => {
    assert.throws(() => verifyOrderToken(algNoneToken({ sub: 'attacker', role: 'admin' })));
  });
});

test('POST /orders returns 401 for a forged alg:none bearer token', async () => {
  await withoutSecret(async () => {
    await request(createApp())
      .post('/orders')
      .set('Authorization', `Bearer ${algNoneToken({ sub: 'attacker' })}`)
      .send({ lines: [{ qty: 1, unitPrice: 9 }] })
      .expect(401);
  });
});
