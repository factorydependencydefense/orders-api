// These assertions pin today's vulnerable behaviour and are expected to be inverted by the remediation PR.
import assert from 'node:assert/strict';
import test from 'node:test';
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

test('vulnerable today: an alg:none token is accepted when ORDERS_JWT_SECRET is unset', async () => {
  const claims = await withoutSecret(() => verifyOrderToken(algNoneToken({ sub: 'attacker', role: 'admin' })));
  assert.equal(claims.sub, 'attacker');
  assert.equal(claims.role, 'admin');
});

test('vulnerable today: POST /orders accepts a forged alg:none bearer token when ORDERS_JWT_SECRET is unset', async () => {
  await withoutSecret(async () => {
    const res = await request(createApp())
      .post('/orders')
      .set('Authorization', `Bearer ${algNoneToken({ sub: 'attacker' })}`)
      .send({ lines: [{ qty: 1, unitPrice: 9 }] })
      .expect(201);
    assert.equal(res.body.actor, 'attacker');
  });
});
