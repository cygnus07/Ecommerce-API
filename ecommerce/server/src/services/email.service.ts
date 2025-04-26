// src/services/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // Keep this for simplicity
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  // logger: true, // Keep debug logs for now
});

export const emailService = {

 // Helper function to send email
 sendEmail: async (to: string, subject: string, text: string): Promise<void> => {
   try {
 
     await transporter.sendMail({
       from: `"Shop AI" <${process.env.EMAIL_USER}>`, // Formalized format
       to,
       subject,
       text,
       html: `<p>${text.replace(/\n/g, '<br>')}</p>`, // Keep HTML fallback
     });
 
     logger.info(`Email sent to ${to}`);
   } catch (error) {
     logger.error(`Email failed to ${to}: ${error instanceof Error ? error.stack : error}`);
     throw error; // Re-throw for route handler
   }
 },
  
  /**
   * Send welcome email to new user
  */
   sendWelcomeEmail:  async (to: string, name: string): Promise<void> => {
    try {
      const subject = 'Welcome to Our E-commerce Platform';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Welcome to Our Store, ${name}!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for verifying your email and joining our e-commerce platform. We're excited to have you as a customer!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="font-weight: bold;">With your verified account, you can now:</p>
            <ul style="margin-top: 10px;">
              <li>Browse our latest products</li>
              <li>Save items to your wishlist</li>
              <li>Complete purchases</li>
              <li>Track your orders</li>
              <li>Leave reviews on products you've purchased</li>
            </ul>
          </div>
  
          <p>Start shopping now: <a href="${env.FRONTEND_URL}" style="color: #3498db;">Visit our store</a></p>
          
          <p>If you have any questions, please don't hesitate to contact our support team at <a href="mailto:support@example.com">support@example.com</a>.</p>
          
          <p style="margin-top: 30px;">Happy shopping!</p>
          <p>Best regards,<br>The ${env.APP_NAME} Team</p>
        </div>
      `;
      
      await emailService.sendEmail(to, subject, html);
      logger.info(`Welcome email sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send welcome email to ${to}: ${error instanceof Error ? error.stack : error}`);
      // Don't throw error here as we don't want to block the verification flow
    }
  },

  
sendPasswordChangeNotification: async (to: string, name: string): Promise<void> => {
  const subject = 'Your Password Was Changed';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Change Notification</h2>
      <p>Hello ${name},</p>
      <p>This is to notify you that your account password was recently changed.</p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <p>Thanks,<br>${env.APP_NAME} Team</p>
    </div>
  `;
  await emailService.sendEmail(to, subject, html);
},
  
  /**
   * Send order confirmation email
   */
  sendOrderConfirmationEmail: async (
    to: string,
    name: string,
    orderId: string,
    orderItems: any[],
    totalAmount: number
  ) => {
    const subject = `Order Confirmation #${orderId}`;
    
    // Generate order items HTML
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Hello ${name},</p>
        <p>Thank you for your order! We've received your order and are processing it now.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px;"><strong>$${totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <p>You will receive another email when your order has shipped.</p>
        <p>If you have any questions about your order, please contact our customer service.</p>
        
        <p>Thank you for shopping with us!</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;
    
    return emailService.sendEmail(to, subject, html);
  },
  
  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (to: string, name: string, resetToken: string) => {
    const subject = 'Password Reset Request';
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        
        <p>If you didn't request a password reset, you can ignore this email and your password will remain unchanged.</p>
        <p>Please note that this link will expire in 1 hour for security reasons.</p>
        
        <p>Best regards,<br>The Team</p>
      </div>
    `;
    
    return emailService.sendEmail(to, subject, html);
  }
};