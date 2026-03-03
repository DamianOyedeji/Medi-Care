import nodemailer from 'nodemailer';
import { logger } from '../config/logger.js';

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Crisis emails will not be sent.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export async function sendCrisisAlert(crisisData) {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, error: 'SMTP not configured' };

    const recipients = process.env.CRISIS_EMAIL_RECIPIENTS || '';
    if (!recipients) return { success: false, error: 'No recipients configured' };

    const { userId, userName, userEmail, riskLevel, riskScore, message, detectedKeywords, timestamp, conversationId } = crisisData;

    const subject = `🚨 CRISIS ALERT: ${riskLevel.toUpperCase()} Risk Detected - User ${userName || userId}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 20px; border: 1px solid #ddd; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .keywords { display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚨 Crisis Alert Notification</h1>
            <p style="margin: 5px 0 0 0;">Immediate attention required</p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <strong>⚠️ Risk Level: ${riskLevel.toUpperCase()}</strong><br>
              Risk Score: ${(riskScore * 100).toFixed(1)}%<br>
              Timestamp: ${new Date(timestamp).toLocaleString()}
            </div>

            <h2>User Information</h2>
            <div class="info-box">
              <strong>User ID:</strong> ${userId}<br>
              <strong>Name:</strong> ${userName || 'Not provided'}<br>
              <strong>Email:</strong> ${userEmail || 'Not provided'}<br>
              <strong>Conversation ID:</strong> ${conversationId || 'N/A'}
            </div>

            <h2>User Message</h2>
            <div class="info-box">
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>

            ${detectedKeywords && detectedKeywords.length > 0 ? `
              <h3>Detected Keywords</h3>
              <div>${detectedKeywords.map(kw => `<span class="keywords">${kw}</span>`).join(' ')}</div>
            ` : ''}

            <h2>Recommended Actions</h2>
            <ol>
              <li><strong>Immediate:</strong> Review the conversation in the admin dashboard</li>
              <li><strong>Follow-up:</strong> Consider reaching out to user's emergency contacts (if configured)</li>
              <li><strong>Documentation:</strong> Log all actions taken in the crisis_logs table</li>
              <li><strong>If critical:</strong> Contact emergency services if user is in immediate danger</li>
            </ol>

            <p style="margin-top: 20px;">
              <a href="${process.env.CLIENT_URL}/admin/crisis-logs" class="button">View Crisis Dashboard</a>
            </p>
          </div>

          <div class="footer">
            <p><strong>Important:</strong> This is an automated alert from Medi-Care mental wellness system. User data is confidential and should be handled according to HIPAA/privacy guidelines.</p>
            <p>System: Medi-Care Backend | Generated: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
CRISIS ALERT - ${riskLevel.toUpperCase()} Risk Detected

User Information:
- ID: ${userId}
- Name: ${userName || 'Not provided'}
- Email: ${userEmail || 'Not provided'}
- Conversation ID: ${conversationId || 'N/A'}

Risk Details:
- Risk Level: ${riskLevel}
- Risk Score: ${(riskScore * 100).toFixed(1)}%
- Timestamp: ${new Date(timestamp).toLocaleString()}

User Message:
${message}

${detectedKeywords && detectedKeywords.length > 0 ? `Detected Keywords: ${detectedKeywords.join(', ')}` : ''}

Recommended Actions:
1. Review the conversation immediately
2. Consider reaching out to emergency contacts
3. Document all actions in crisis_logs
4. If critical, contact emergency services

Dashboard: ${process.env.CLIENT_URL}/admin/crisis-logs
    `.trim();

    const info = await transporter.sendMail({
      from: `"Medi-Care Crisis System" <${process.env.SMTP_FROM}>`,
      to: recipients,
      subject: subject,
      text: textContent,
      html: htmlContent,
      priority: 'high',
      headers: { 'X-Priority': '1', 'X-MSMail-Priority': 'High', 'Importance': 'high' }
    });

    logger.info('Crisis alert email sent successfully', { messageId: info.messageId, recipients, userId, riskLevel });
    return { success: true, messageId: info.messageId };

  } catch (error) {
    logger.error('Failed to send crisis alert email', { error: error.message, userId: crisisData.userId });
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(userData) {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false };

    const { email, fullName } = userData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
          .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1 style="margin: 0;">Welcome to Medi-Care! 💚</h1></div>
          
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>Welcome to Medi-Care, your mental wellness support companion. We're glad you're here!</p>
            <p>Medi-Care is designed to:</p>
            <ul>
              <li>Provide a safe space for you to express your feelings</li>
              <li>Track your mood progress over time</li>
              <li>Offer supportive guidance and resources</li>
              <li>Connect you with professional help when needed</li>
            </ul>
            <p><strong>Remember:</strong> Medi-Care is a support tool, not a replacement for professional mental health care. If you're in crisis, please contact emergency services or call 988 (Suicide & Crisis Lifeline).</p>
            <p style="text-align: center;"><a href="${process.env.CLIENT_URL}" class="button">Start Your Journey</a></p>
            <p>Take care of yourself,<br>The Medi-Care Team</p>
          </div>

          <div class="footer">
            <p>Questions? Contact us at support@medi-care.com</p>
            <p>© 2026 Medi-Care. Your mental wellness matters.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Medi-Care" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Welcome to Medi-Care - Your Mental Wellness Journey Starts Here',
      html: htmlContent
    });

    logger.info('Welcome email sent', { email });
    return { success: true };

  } catch (error) {
    logger.error('Failed to send welcome email', { error: error.message });
    return { success: false };
  }
}

export async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, message: 'SMTP not configured' };

    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return { success: true, message: 'Email configuration is valid' };

  } catch (error) {
    logger.error('Email configuration test failed', { error: error.message });
    return { success: false, message: error.message };
  }
}

export default { sendCrisisAlert, sendWelcomeEmail, testEmailConfig };