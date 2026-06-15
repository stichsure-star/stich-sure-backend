require('dotenv').config();
const Brevo = require('@getbrevo/brevo');


exports.sendSingleEmail = async (options) => {
  try {
    const apikey = process.env.BREVO_API_KEY;
    if (!apikey) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    if (!process.env.BREVO_SENDER_NAME || !process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO sender name and email are not configured");
    }

    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apikey);
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.to = [{ email: options.email }];
    sendSmtpEmail.htmlContent = options.html;
    if (options.text) {
      sendSmtpEmail.textContent = options.text;
    }
    if (process.env.BREVO_REPLY_TO_EMAIL) {
      sendSmtpEmail.replyTo = {
        email: process.env.BREVO_REPLY_TO_EMAIL,
        name: process.env.BREVO_REPLY_TO_NAME || process.env.BREVO_SENDER_NAME,
      };
    }
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent to:", options.email);
  } catch (error) {
    const status = error?.response?.status;
    const brevoMessage = error?.response?.data?.message || error.message;
    const emailError = new Error(`Email not sent to ${options.email}: ${brevoMessage}`);

    emailError.code = 'BREVO_EMAIL_FAILED';
    emailError.status = status;
    emailError.brevoMessage = brevoMessage;

    console.error('Brevo email failed:', {
      recipient: options.email,
      status,
      message: brevoMessage
    });

    throw emailError;
  }
};
