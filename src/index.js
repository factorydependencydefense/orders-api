import express from 'express';
import { normalizeOrder, orderTotal, publicOrderView, summarizeByStatus } from './orders.js';

export function createApp() {
  const app = express();
  const orders = [];

  app.use(express.json());

  app.post('/orders', (req, res) => {
    const order = normalizeOrder({ id: `ord_${orders.length + 1}`, ...req.body });
    orders.push(order);
    res.status(201).json({ order: publicOrderView(order), total: orderTotal(order) });
  });

  app.get('/orders/summary', (_req, res) => {
    res.json(summarizeByStatus(orders));
  });

  return app;
}

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, () => console.log(`orders-api listening on ${port}`));
}
