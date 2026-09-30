const Order = require('../models/Order');
const Product = require('../models/Product');
const ClassPurchaseOrder = require('../models/ClassPurchaseOrder');
const User = require('../models/User');

const createOrder = async (req, res) => {
  const { items, total, paymentMethod, customerInfo } = req.body;

  if (!items || !total) {
    return res.status(400).json({ message: 'Items and total are required' });
  }

  try {
    // Validate stock first for all items
    const itemsToProcess = [];
    
    for (const item of items) {
      const baseProductId = parseInt(item.id, 10);
      if (isNaN(baseProductId)) continue;
      
      const product = await Product.findByPk(baseProductId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      
      if (product.stock !== null && product.stock !== undefined) {
        const qty = item.quantity || 1;
        if (product.stock < qty) {
          return res.status(400).json({ 
            message: `Insufficient stock for product "${product.name}". Only ${product.stock} left in stock.` 
          });
        }
        itemsToProcess.push({ product, qty });
      }
    }
    
    // Decrement stock for all processed items
    for (const { product, qty } of itemsToProcess) {
      product.stock = Math.max(0, product.stock - qty);
      await product.save();
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      paymentMethod: paymentMethod || 'QR',
      customerInfo: customerInfo || null,
      status: 'CONFIRMED'
    });

    // Send order confirmation email asynchronously
    const { sendOrderConfirmation } = require('../utils/emailService');
    sendOrderConfirmation(order.toJSON()).catch(err => console.error('Failed to send order email:', err));

    // Handle Tarot Class Sync Background Task
    const hasTarotClass = items.some(item => {
      const name = (item.name || '').toLowerCase();
      return name.includes('class') || name.includes('workshop') || name.includes('testing');
    });

    if (hasTarotClass) {
      const syncClassPurchase = async () => {
        try {
          const user = await User.findByPk(req.user.id);
          const customerName = (customerInfo && customerInfo.name) || (user && user.name) || 'Unknown';
          const phoneNumber = (customerInfo && customerInfo.phone) || (user && user.phone) || 'Not Provided';
          
          const classOrder = await ClassPurchaseOrder.create({
            customer_name: customerName,
            phone_number: phoneNumber,
            order_id: `ORD_${order.id}`,
            amount: total,
            payment_status: order.status,
            synced_to_class_site: false
          });

          const SECRET_TOKEN = process.env.CLASS_SYNC_SECRET || 'tarot_class_sec_901b2a4x8';
          try {
            const response = await fetch('https://amigowebster.in/api/save-student', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customer_name: classOrder.customer_name,
                phone_number: classOrder.phone_number,
                order_id: classOrder.order_id,
                secret_token: SECRET_TOKEN
              })
            });

            if (response.ok || response.status === 200 || response.status === 201) {
              classOrder.synced_to_class_site = true;
              await classOrder.save();
              console.log(`Successfully synced class order ${classOrder.order_id} to class site.`);
            } else {
              console.error(`Class API returned status: ${response.status}`);
            }
          } catch (apiError) {
            console.error(`Failed to sync order ${classOrder.order_id} to class site. Network error:`, apiError.message);
          }
        } catch (error) {
          console.error('Error in syncClassPurchase:', error);
        }
      };
      
      syncClassPurchase();
    }

    return res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json({ orders });
  } catch (err) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json({ orders });
  } catch (err) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders
};
