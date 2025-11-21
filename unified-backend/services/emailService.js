const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 * Sends transactional emails to users
 */

// Create transporter with fallback for testing
let transporter = null;

try {
  // Initialize transporter only if credentials are provided
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('✓ Email service initialized with real Gmail credentials');
  } else {
    // Don't use fake credentials - require real ones
    console.warn('⚠️ Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.warn('⚠️ For Gmail, you need to use an App Password (not your regular password)');
    console.warn('⚠️ Go to: Google Account > Security > 2-Step Verification > App Passwords');
    transporter = null;
  }
} catch (error) {
  console.error('⚠️ Email transporter initialization failed:', error.message);
  transporter = null;
}

/**
 * Send buyer interested notification
 */
async function sendBuyerInterestedEmail(farmerEmail, farmerName, buyerName, crop, quantity) {
  try {
    if (!transporter) {
      console.warn('⚠️ Email transporter not available, skipping email');
      return { success: false, error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file' };
    }

    if (!farmerEmail) {
      console.warn('⚠️ No farmer email provided');
      return { success: false, error: 'No recipient email' };
    }

    const mailOptions = {
      from: `AgriChain <${process.env.EMAIL_USER || 'agrichain@localhost'}>`,
      to: farmerEmail,
      subject: `🌾 Buyer Interested in Your ${crop} Listing!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #2ecc71; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Good News! 🎉</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Dear ${farmerName},</p>
            
            <p>A buyer is interested in your listing!</p>
            
            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2ecc71;">
              <h3 style="margin-top: 0; color: #2ecc71;">Listing Details</h3>
              <p><strong>Crop:</strong> ${crop}</p>
              <p><strong>Quantity:</strong> ${quantity} kg</p>
              <p><strong>Interested Buyer:</strong> ${buyerName || 'A buyer'}</p>
            </div>
            
            <p>🔗 <strong>Next Steps:</strong></p>
            <ol>
              <li>Log in to AgriChain app</li>
              <li>Go to your listings</li>
              <li>View buyer details and send a price quote</li>
              <li>Negotiate terms and finalize the deal</li>
            </ol>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/listings" 
                 style="background-color: #2ecc71; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View on AgriChain
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This is an automated message from AgriChain. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✓ Email sent successfully:', farmerEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('⚠️ Email sending error (buyer interested):', error.message);
    // Don't throw - return error object so main function continues
    return { success: false, error: error.message };
  }
}

/**
 * Send payment release notification
 */
async function sendPaymentReleasedEmail(farmerEmail, farmerName, amount, crop) {
  try {
    const mailOptions = {
      from: `AgriChain <${process.env.EMAIL_USER || 'noreply@agrichain.com'}>`,
      to: farmerEmail,
      subject: `✅ Payment Released - ₹${amount} Received!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #27ae60; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Payment Released ✅</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Dear ${farmerName},</p>
            
            <p>Great news! Your payment has been released from escrow.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <h3 style="margin-top: 0; color: #27ae60;">Payment Details</h3>
              <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
              <p><strong>Crop:</strong> ${crop}</p>
              <p><strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">Completed</span></p>
            </div>
            
            <p>The funds will be transferred to your registered bank account within 1-2 business days.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/transactions" 
                 style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Transaction Details
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Thank you for using AgriChain for secure agricultural transactions.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error (payment released):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send contract created notification
 */
async function sendContractCreatedEmail(buyerEmail, buyerName, crop, quantity, amount) {
  try {
    const mailOptions = {
      from: `AgriChain <${process.env.EMAIL_USER || 'noreply@agrichain.com'}>`,
      to: buyerEmail,
      subject: `📋 Contract Created - ${crop} Purchase Agreement`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Contract Created 📋</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Dear ${buyerName},</p>
            
            <p>Your purchase agreement has been created and is ready for execution.</p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
              <h3 style="margin-top: 0; color: #3498db;">Contract Details</h3>
              <p><strong>Product:</strong> ${crop}</p>
              <p><strong>Quantity:</strong> ${quantity} kg</p>
              <p><strong>Total Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
            </div>
            
            <p>📝 <strong>What happens next:</strong></p>
            <ol>
              <li>Review contract terms and conditions</li>
              <li>Confirm payment details</li>
              <li>Make payment via Razorpay</li>
              <li>Funds will be held in secure escrow</li>
              <li>Farmer will deliver the product</li>
            </ol>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts" 
                 style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Contract
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              AgriChain - Connecting Farmers and Buyers Securely
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error (contract created):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send harvest verification notification
 */
async function sendHarvestVerificationEmail(buyerEmail, buyerName, crop, quantity) {
  try {
    const mailOptions = {
      from: `AgriChain <${process.env.EMAIL_USER || 'noreply@agrichain.com'}>`,
      to: buyerEmail,
      subject: `🌾 Harvest Submitted - Please Verify Quality`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #f39c12; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">Harvest Submitted 🌾</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Dear ${buyerName},</p>
            
            <p>The farmer has submitted the harvest for your approval. Please review and verify the quality.</p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <h3 style="margin-top: 0; color: #f39c12;">Harvest Details</h3>
              <p><strong>Product:</strong> ${crop}</p>
              <p><strong>Quantity:</strong> ${quantity} kg</p>
              <p><strong>Action Required:</strong> Verify quality photos and GPS</p>
            </div>
            
            <p>⏱️ <strong>Important:</strong> Please verify within 5 days of submission.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/harvest-verification" 
                 style="background-color: #f39c12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Harvest
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Once verified, payment will be released to the farmer automatically.
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error (harvest verification):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send review notification
 */
async function sendReviewNotificationEmail(userEmail, userName, reviewerName, rating, crop) {
  try {
    const mailOptions = {
      from: `AgriChain <${process.env.EMAIL_USER || 'noreply@agrichain.com'}>`,
      to: userEmail,
      subject: `⭐ New Review Received - ${rating}/5 stars`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background-color: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">New Review ⭐</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Dear ${userName},</p>
            
            <p>${reviewerName} left a review for your ${crop} transaction.</p>
            
            <div style="background-color: #ffe0e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
              <h3 style="margin-top: 0; color: #e74c3c;">Review Summary</h3>
              <p><strong>Rating:</strong> ${'⭐'.repeat(rating)} ${rating}/5</p>
              <p><strong>Product:</strong> ${crop}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reviews" 
                 style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Review
              </a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This helps build trust in the AgriChain community!
            </p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error (review):', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  transporter,
  sendBuyerInterestedEmail,
  sendPaymentReleasedEmail,
  sendContractCreatedEmail,
  sendHarvestVerificationEmail,
  sendReviewNotificationEmail
};
