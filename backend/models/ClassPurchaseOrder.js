const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassPurchaseOrder = sequelize.define('ClassPurchaseOrder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  synced_to_class_site: {
    type: DataTypes.BOOLEAN, // TINYINT(1) equivalent
    defaultValue: false
  }
}, {
  tableName: 'class_purchase_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ClassPurchaseOrder;
