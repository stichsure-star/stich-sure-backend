// utils/sms.js
const axios = require('axios');

const sendSMS = async ({ to, message }) => {
  try {
    if (!to) {
      console.log('No phone number provided — skipping SMS');
      return null;
    }

    // Normalize phone number to international format
    const phone = to.startsWith('0')
      ? `234${to.slice(1)}`
      : to.startsWith('+')
      ? to.slice(1)
      : to;

    const response = await axios.post(
      'https://api.ng.termii.com/api/sms/send',
      {
        to: phone,
        from: process.env.TERMII_SENDER_ID || 'StitchSure',
        sms: message,
        type: 'plain',
        api_key: process.env.TERMII_API_KEY,
        channel: 'generic',
      }
    );

    console.log('SMS sent:', response.data);
    return response.data;
  } catch (error) {
    console.log('SMS error:', error.response?.data || error.message);
    return null;
  }
};

module.exports = { sendSMS };