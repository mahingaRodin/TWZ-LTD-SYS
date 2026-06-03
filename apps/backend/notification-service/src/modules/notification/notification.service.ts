import nodemailer, { Transporter } from 'nodemailer';
import { env, smtpConfigured } from '../../config/env';
import { logger } from '../../utils/logger';

let transporter: Transporter | null = null;

/** Lazily create the SMTP transport (only when SMTP is actually configured). */
function getTransporter(): Transporter | null {
  if (!smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const notificationService = {
  /**
   * Send an email. When SMTP is configured it is delivered via nodemailer;
   * otherwise the message is logged so flows (OTP, inspection notices) still
   * work in development without a mail server.
   */
  async sendEmail({ to, subject, body, html }: EmailMessage): Promise<{ delivered: boolean }> {
    const tx = getTransporter();
    if (!tx) {
      logger.info('[email:logged] SMTP not configured — message not actually sent', {
        to,
        subject,
        preview: body.slice(0, 120),
      });
      return { delivered: false };
    }

    await tx.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text: body,
      html: html ?? body,
    });
    logger.info('[email:sent]', { to, subject });
    return { delivered: true };
  },
};
