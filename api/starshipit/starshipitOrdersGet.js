// https://api-docs.starshipit.com/#0aef707f-e2f5-493a-a382-8235c00c9c18

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { starshipitGet, starshipitGetter } = require('../starshipit/starshipitGet');

const ORDERS_MAX_PER_PAGE = 500;

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
]);

const starshipitOrdersGet = async (
  returnGetter,

  credsPayload,
  {
    orderId,
    orderNumber,
    status,
    filter,
    include,
    sortColumn,
    sortDirection,
    perPage = ORDERS_MAX_PER_PAGE,
    ...getterOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const getterArgs = [
    credsPayload,
    '/orders',
    {
      nodeName: 'orders',
      perPage,
      params: {
        ...orderId && { order_id: orderId },
        ...orderNumber && { order_number: orderNumber },
        ...status && { status },
        ...filter && { filter },
        ...include && { include },
        ...sortColumn && { sort_column: sortColumn },
        ...sortDirection && { sort_direction: sortDirection },
      },
      digester: (response) => {
        if (!response?.ok) {
          return [];
        }
        const { orders, order } = response.data || {};
        if (Array.isArray(orders)) {
          return orders;
        }
        if (order) {
          return [order];
        }
        return [];
      },
      ...getterOptions,
    },
  ];

  return returnGetter
    ? starshipitGetter(...getterArgs)
    : starshipitGet(...getterArgs);
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  starshipitOrdersGet: (...args) => starshipitOrdersGet(false, ...args),
  starshipitOrdersGetter: (...args) => starshipitOrdersGet(true, ...args),
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/starshipitOrdersGet" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "starshipit.wf" },
    "options": {
      "status": "Shipped",
      "include": ["Items", "Packages"],
      "perPage": 2,
      "limit": 2
    }
  }'
*/
