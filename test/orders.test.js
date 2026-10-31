import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { normalizeOrder, orderTotal, publicOrderView, summarizeByStatus } from '../src/orders.js';

test('normalizeOrder fills defaults without losing input', () => {
  const order = normalizeOrder({ id: 'ord_1', shipping: { insured: true }, customer: { email: 'a@b.com' } });
  assert.equal(order.currency, 'USD');
  assert.equal(order.shipping.method, 'standard');
  assert.equal(order.shipping.insured, true);
  assert.equal(order.customerEmail, 'a@b.com');
});

test('normalizeOrder falls back when customer email is missing', () => {
  assert.equal(normalizeOrder({ id: 'ord_2' }).customerEmail, 'unknown@example.com');
});

test('orderTotal sums line items', () => {
  const order = normalizeOrder({ lines: [{ qty: 2, unitPrice: 5 }, { qty: 1, unitPrice: 3.5 }] });
  assert.equal(orderTotal(order), 13.5);
});

test('summarizeByStatus groups orders and defaults to new', () => {
  const grouped = summarizeByStatus([{ id: 'a' }, { id: 'b', status: 'paid' }]);
  assert.deepEqual(Object.keys(grouped).sort(), ['new', 'paid']);
});

test('publicOrderView hides internal fields', () => {
  const view = publicOrderView(normalizeOrder({ id: 'ord_3', internalNote: 'secret' }));
  assert.equal(view.internalNote, undefined);
  assert.equal(view.id, 'ord_3');
});

test('POST /orders returns the created order and total', async () => {
  const previous = process.env.ORDERS_JWT_SECRET;
  process.env.ORDERS_JWT_SECRET = 'orders-test-secret';
  try {
    const res = await request(createApp())
      .post('/orders')
      .set('Authorization', `Bearer ${jwt.sign({ sub: 'u1' }, 'orders-test-secret', { algorithm: 'HS256' })}`)
      .send({ lines: [{ qty: 3, unitPrice: 2 }] })
      .expect(201);
    assert.equal(res.body.total, 6);
    assert.equal(res.body.order.currency, 'USD');
  } finally {
    if (previous === undefined) delete process.env.ORDERS_JWT_SECRET;
    else process.env.ORDERS_JWT_SECRET = previous;
  }
});
