import transporter from "../auth/nodemailer"

interface SendEmailProps {
  to: string
  subject: string
  html: string
  text: string
}

export function sendEmail({ to, subject, html, text }: SendEmailProps) {
  try {
    return transporter.sendMail({
      from: process.env.NODEMAILER_USER!,
      to,
      subject,
      html,
      text,
    })
  } catch (error) {
    console.error("sendEmailAction", error)
    return { success: false }
  }
}
