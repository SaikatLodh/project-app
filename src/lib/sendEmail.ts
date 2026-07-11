import nodemailer from 'nodemailer';

interface MailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendEmail = async ({ email, subject, message }: MailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMPT_PORT) || 587,
    service: process.env.SMPT_SERVICE,
    secure: false,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"CollabDocs" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject,
    html: message,
  });
};

export default sendEmail;
