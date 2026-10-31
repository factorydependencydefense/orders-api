import _ from 'lodash';

const defaultOrder = {
  currency: 'USD',
  channel: 'web',
  shipping: { method: 'standard', insured: false },
  lines: [],
};

export function normalizeOrder(input) {
  const order = _.merge({}, defaultOrder, input);
  order.customerEmail = _.get(order, 'customer.email', 'unknown@example.com');
  return order;
}

export function orderTotal(order) {
  return _.sum(order.lines.map((line) => line.qty * line.unitPrice));
}

export function summarizeByStatus(orders) {
  return _.groupBy(orders, (order) => order.status ?? 'new');
}

export function publicOrderView(order) {
  return _.pick(order, ['id', 'currency', 'channel', 'customerEmail', 'lines']);
}
