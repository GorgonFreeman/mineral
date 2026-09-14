const DEFAULT_API_VERSION = '2026-04';

module.exports = {
  DEFAULT_API_VERSION,
  MAX_PER_PAGE: 250,
  MAX_METAFIELDS_PER_SET: 25,
  MAX_INVENTORY_QUANTITIES_PER_SET: 250,
  INVENTORY_TYPES: [
    'available',
    'on_hand',
  ],
  // https://shopify.dev/docs/apps/build/orders-fulfillment/inventory-management-apps/manage-quantities-states#set-inventory-quantities-on-hand
  INVENTORY_REASONS: [
    'correction',
    'cycle_count_available',
    'damaged',
    'movement_created',
    'movement_updated',
    'movement_received',
    'movement_canceled',
    'other',
    'promotion',
    'quality_control',
    'received',
    'reservation_created',
    'reservation_deleted',
    'reservation_updated',
    'restock',
    'safety_stock',
    'shrinkage',
  ],
};
