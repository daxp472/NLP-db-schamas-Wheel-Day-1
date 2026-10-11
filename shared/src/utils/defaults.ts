import { CanonicalSchema } from '../types/schema';

export const SAMPLE_ECOMMERCE_SCHEMA: CanonicalSchema = {
  version: '1.0.0',
  projectName: 'Modern E-Commerce Engine',
  targetDialect: 'postgresql',
  assumptions: [
    'Orders can contain multiple products via order_items junction table.',
    'Customers can maintain multiple shipping addresses.',
    'Product inventory is tracked per product record.'
  ],
  unresolvedQuestions: [
    'Should payment transaction logs support partial refunds?',
    'Is tax calculated at order line level or cart level?'
  ],
  entities: [
    {
      id: 'e_users',
      name: 'users',
      description: 'System user accounts and customers',
      fields: [
        { id: 'f_u_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
        { id: 'f_u_email', name: 'email', dataType: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: true },
        { id: 'f_u_name', name: 'full_name', dataType: 'varchar(100)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
        { id: 'f_u_role', name: 'role', dataType: 'varchar(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: "'customer'" },
        { id: 'f_u_created_at', name: 'created_at', dataType: 'timestamptz', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'e_orders',
      name: 'orders',
      description: 'Placed customer orders and statuses',
      fields: [
        { id: 'f_o_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
        { id: 'f_o_user_id', name: 'user_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
        { id: 'f_o_total_amount', name: 'total_amount', dataType: 'numeric(10,2)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
        { id: 'f_o_status', name: 'status', dataType: 'varchar(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: "'pending'" },
        { id: 'f_o_created_at', name: 'created_at', dataType: 'timestamptz', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'e_products',
      name: 'products',
      description: 'Store catalog items and pricing',
      fields: [
        { id: 'f_p_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
        { id: 'f_p_sku', name: 'sku', dataType: 'varchar(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: true },
        { id: 'f_p_name', name: 'name', dataType: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
        { id: 'f_p_price', name: 'price', dataType: 'numeric(10,2)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
        { id: 'f_p_stock_qty', name: 'stock_quantity', dataType: 'integer', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: '0' }
      ]
    },
    {
      id: 'e_order_items',
      name: 'order_items',
      description: 'Junction table linking orders to purchased products',
      isJunctionTable: true,
      fields: [
        { id: 'f_oi_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
        { id: 'f_oi_order_id', name: 'order_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
        { id: 'f_oi_product_id', name: 'product_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
        { id: 'f_oi_unit_price', name: 'unit_price', dataType: 'numeric(10,2)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
        { id: 'f_oi_quantity', name: 'quantity', dataType: 'integer', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: '1' }
      ]
    }
  ],
  relationships: [
    {
      id: 'rel_orders_users',
      sourceEntityId: 'e_orders',
      sourceFieldId: 'f_o_user_id',
      targetEntityId: 'e_users',
      targetFieldId: 'f_u_id',
      cardinality: '1:N',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    {
      id: 'rel_order_items_orders',
      sourceEntityId: 'e_order_items',
      sourceFieldId: 'f_oi_order_id',
      targetEntityId: 'e_orders',
      targetFieldId: 'f_o_id',
      cardinality: '1:N',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    {
      id: 'rel_order_items_products',
      sourceEntityId: 'e_order_items',
      sourceFieldId: 'f_oi_product_id',
      targetEntityId: 'e_products',
      targetFieldId: 'f_p_id',
      cardinality: '1:N',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    }
  ],
  layout: {
    positions: {
      e_users: { x: 50, y: 150 },
      e_orders: { x: 420, y: 150 },
      e_order_items: { x: 790, y: 150 },
      e_products: { x: 790, y: 480 }
    },
    zoom: 0.95
  }
};
