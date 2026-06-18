const { Notification } = require("../models");

exports.createNotification = async ({
  customerId,
  designerId,
  requestId,
  title,
  message,
  type,
}) => {
  await Notification.create({
    customerId,
    designerId,
    requestId,
    title,
    message,
    type,
  });
};

