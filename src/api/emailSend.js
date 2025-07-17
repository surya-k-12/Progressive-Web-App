// src/api/emailSend.js
import emailjs from '@emailjs/browser';

export async function sendApplicationConfirmation({ to, jobTitle, companyName }) {
  try {
    const templateParams = {
      to_email: to,
      job_title: jobTitle,
      company_name: companyName,
    };

    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      throw new Error('Failed to send confirmation email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send confirmation email');
  }
}
