import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.post('/send-email', async (req, res) => {
  try {
    const { to, jobTitle, companyName } = req.body;

    // Verify transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Job Application Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Application Submitted Successfully!</h2>
          <p style="margin-bottom: 15px;">Dear Applicant,</p>
          <p style="margin-bottom: 15px;">Thank you for applying to the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
          <p style="margin-bottom: 15px;">We have received your application and will review it shortly. If your profile matches our requirements, we will contact you for the next steps.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">Best regards,<br><strong>${companyName} Hiring Team</strong></p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.code === 'EAUTH') {
      res.status(500).json({ error: 'Email authentication failed. Please check your email credentials.' });
    } else if (error.code === 'ECONNECTION') {
      res.status(500).json({ error: 'Could not connect to email server. Please check your internet connection.' });
    } else {
      res.status(500).json({ error: 'Failed to send confirmation email. Please try again later.' });
    }
  }
});

export default router; 