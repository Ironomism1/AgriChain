/**
 * SMS Service using Twilio
 * Sends SMS notifications to users
 * Falls back gracefully if Twilio is not configured
 */

let twilio = null;
let isConfigured = false;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    isConfigured = true;
    console.log('✓ Twilio SMS service initialized');
  } else {
    console.log('⚠️ Twilio SMS service not configured (SMS notifications disabled)');
  }
} catch (error) {
  console.error('⚠️ Twilio initialization error:', error.message);
}

/**
 * Send SMS notification to buyer interested
 */
/**
 * Format phone number for Twilio (E.164 format)
 */
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it's an Indian number (10 digits) and doesn't start with country code
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return null;
}

async function sendBuyerInterestedSMS(phoneNumber, crop, quantity) {
  try {
    if (!isConfigured || !twilio) {
      console.warn('⚠️ Twilio SMS service not available, skipping SMS');
      return { success: false, error: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE in .env file' };
    }

    if (!phoneNumber) {
      console.warn('⚠️ No phone number provided');
      return { success: false, error: 'No phone number provided' };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      console.warn('⚠️ Invalid phone number format:', phoneNumber);
      return { success: false, error: 'Invalid phone number format. Please provide a valid phone number' };
    }

    // Check if TWILIO_PHONE is configured
    const twilioPhone = process.env.TWILIO_PHONE;
    if (!twilioPhone || twilioPhone === '+15556667777') {
      console.warn('⚠️ TWILIO_PHONE not configured. Using default (this will fail). Please set TWILIO_PHONE in .env');
      return { success: false, error: 'Twilio phone number not configured. Please set TWILIO_PHONE in .env file' };
    }

    const message = `🌾 AgriChain: A buyer is interested in your ${crop} listing (${quantity}kg). Check the app for details.`;

    const result = await twilio.messages.create({
      body: message,
      to: formattedPhone,
      from: twilioPhone
    });

    console.log('✓ SMS sent successfully to', formattedPhone, 'SID:', result.sid);
    return { success: true, sid: result.sid, phone: formattedPhone };
  } catch (error) {
    console.error('⚠️ SMS sending error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS payment release notification
 */
async function sendPaymentReleasedSMS(phoneNumber, amount, crop) {
  try {
    if (!isConfigured || !twilio) {
      return { success: false, error: 'SMS service not configured' };
    }

    if (!phoneNumber) {
      return { success: false, error: 'No phone number provided' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const twilioPhone = process.env.TWILIO_PHONE;
    if (!twilioPhone || twilioPhone === '+15556667777') {
      return { success: false, error: 'Twilio phone number not configured' };
    }

    const message = `✅ AgriChain: Payment of ₹${amount} released for ${crop}. It will be transferred within 1-2 business days.`;

    const result = await twilio.messages.create({
      body: message,
      to: formattedPhone,
      from: twilioPhone
    });

    console.log('✓ SMS payment notification sent to', formattedPhone);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('⚠️ SMS payment notification error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send generic SMS
 */
async function sendSMS(phoneNumber, message) {
  try {
    if (!isConfigured || !twilio) {
      return { success: false, error: 'SMS service not configured' };
    }

    if (!phoneNumber || !message) {
      return { success: false, error: 'Missing phone number or message' };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const twilioPhone = process.env.TWILIO_PHONE;
    if (!twilioPhone || twilioPhone === '+15556667777') {
      return { success: false, error: 'Twilio phone number not configured' };
    }

    const result = await twilio.messages.create({
      body: message,
      to: formattedPhone,
      from: twilioPhone
    });

    console.log('✓ SMS sent successfully to', formattedPhone);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('⚠️ SMS sending error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBuyerInterestedSMS,
  sendPaymentReleasedSMS,
  sendSMS,
  isConfigured
};
