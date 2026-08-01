const PIPE17_API_BASE_URL = 'https://api-v3.pipe17.com/api/v3';

const PIPE17_API_SANDBOX_BASE_URL = 'https://api-v3.develop.pipe17.com/api/v3';

const DEFAULT_PAGE_SIZE = 100;

const JOB_TYPES = [
  'report',
  'import',
  'prepare',
  'update',
  'delete',
  'export',
  'automation',
  'sync',
];

const JOB_SUBTYPES = [
  'inventory',
  'replenishment',
  'oos_sku_on_order',
  'open_orders',
  'purchases',
  'transfers',
  'arrivals',
  'receipts',
  'products',
  'organizations',
  'orders',
  'shipments',
  'fulfillments',
  'locations',
  'shipping_methods',
  'returns',
  'exceptions',
  'lookup_objects',
  'statements',
  'users',
];

module.exports = {
  PIPE17_API_BASE_URL,
  PIPE17_API_SANDBOX_BASE_URL,
  DEFAULT_PAGE_SIZE,
  JOB_TYPES,
  JOB_SUBTYPES,
};
