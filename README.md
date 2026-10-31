# orders-api

Order intake and pricing API. Part of the dependency-defense demo fleet.

```bash
npm ci
npm test
npm run build
npm start
```

## Tests

`npm test` runs `test/*.test.js` only: the order normalization and pricing unit tests
(`test/orders.test.js`), the legitimate token and HTTP flows that must keep working across a
`jsonwebtoken` upgrade (`test/preservation.test.js`), and `test/characterization.test.js`, which
pins today's behaviour so a dependency change shows up as a diff rather than a surprise.

`npm run test:security` runs `test/security/**/*.test.js` and is deliberately **not** part of
`npm test`. Both of its tests are **red today**:

- `verifyOrderToken rejects an alg:none token when no secret is configured`
- `POST /orders returns 401 for a forged alg:none bearer token`

They are red because `verifyOrderToken` calls `jwt.verify(token, secret)` with no `algorithms`
option, and `ORDERS_JWT_SECRET` defaults to an empty string. On `jsonwebtoken` 8.5.1 that
combination accepts an unsigned `alg: none` token, so anyone can mint an admin identity. The two
corresponding `vulnerable today:` tests in `test/characterization.test.js` assert exactly that and
are expected to be inverted when the issue is fixed.

What these tests do not cover: there is no coverage of key rotation, token expiry or revocation,
and nothing here exercises the service against a real identity provider. The security suite checks
a single forgery shape, not the full JWT threat model.
