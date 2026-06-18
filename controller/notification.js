const { Notification } = require('../models');
const { createNotification, progressMessages } = require('../services/notifications');
const { Op } = require('sequelize');


exports.getNotifications = async (req, res) => {
  try {
    const customerId = req.user.id;
    const notifications = await Notification.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      notifications,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to get notifications' });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, customerId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRead: true });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};


exports.markAllAsRead = async (req, res) => {
  try {
    const customerId = req.user.id;

    await Notification.update(
      { isRead: true },
      { where: { customerId, isRead: false } }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to mark all as read' });
  }
};


exports.getUnreadCount = async (req, res) => {
  try {
    const customerId = req.user.id;

    const count = await Notification.count({
      where: { customerId, isRead: false },
    });

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to get unread count' });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { orderId, progress } = req.body;
    const { Order, Customer } = require('../models');

    const validProgress = ['still_sewing', 'cutting_material', 'rounding_up', 'finished', 'delivery'];
    if (!validProgress.includes(progress)) {
      return res.status(400).json({
        message: 'Invalid progress status',
        valid: validProgress,
      });
    }

    const foundOrder = await Order.findByPk(orderId);
    if (!foundOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { title, message } = progressMessages[progress];

    await createNotification({
      customerId: foundOrder.customerId,
      userType: 'customer',
      title,
      message,
      type: progress === 'finished' ? 'ready_for_delivery' : 
            progress === 'delivery' ? 'delivery_update' : 'progress_update',
      orderId,
    });

    return res.status(200).json({
      success: true,
      message: 'Progress updated and customer notified',
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Failed to update progress' });
  }
};