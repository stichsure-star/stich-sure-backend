// services/notification.service.js
const { Notification } = require('../models');

exports.createNotification = async ({ customerId, userType, title, message, type, requestId, orderId }) => {
  return await Notification.create({
    customerId,
    userType,
    title,
    message,
    type,
    requestId: requestId || null,
    orderId: orderId || null,
    userType
  });
};

exports.progressMessages = {
  still_sewing: {
    title: 'Order Update ',
    message: 'Your designer is still sewing your outfit. Hang tight!',
  },
  cutting_material: {
    title: 'Order Update ',
    message: 'Your designer is currently cutting the material for your outfit.',
  },
  rounding_up: {
    title: 'Order Update ',
    message: 'Your designer is rounding up your outfit. Almost there!',
  },
  finished: {
    title: 'Order Ready ',
    message: 'Your outfit is finished and ready for delivery!',
  },
  delivery: {
    title: 'Out for Delivery ',
    message: 'Your outfit is on its way to you!',
  },
};

