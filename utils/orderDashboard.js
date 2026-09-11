/**
 * A tailoring request has a one-to-one relationship with an order. Older data
 * can contain duplicate rows created by repeated checkout submissions, so use
 * the request as the dashboard identity when it is available. Direct orders
 * have no requestId and are kept distinct by their order id.
 */
const getDistinctOrders = (orders) => {
  const seen = new Set();

  return orders.filter((order) => {
    const key = order.requestId ? `request:${order.requestId}` : `order:${order.id}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

module.exports = { getDistinctOrders };
