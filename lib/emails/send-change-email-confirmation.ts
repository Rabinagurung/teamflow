import transporter from "../auth/nodemailer";
import { sendEmail } from "./send-email";

interface EmailVerificationData {
  user: {
    name: string;
    email: string;
  };
  link: string;
  newEmail: string;
}

export async function sendChangeEmailConfirmation({
  user,
  link,
  newEmail,
}: EmailVerificationData) {
  await sendEmail({
    to: user.email,
    subject: "Approve email change",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Click the link to approve the change to ${newEmail} :</p>
        <a href="${link}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Your App Team</p>
      </div>
      
    `,
    text: `Hello ${user.name},\n\nClick the link to approve the change to ${newEmail} : ${link}\n\nIf you didn't create an account, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  });
}
