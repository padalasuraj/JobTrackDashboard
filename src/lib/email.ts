import nodemailer from "nodemailer";

type Email = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function verificationUrl(token: string) {
  return `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export function resetPasswordUrl(token: string) {
  return `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendEmail(email: Email) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "JobTrack <noreply@example.com>";

  if (!host || !user || !pass) {
    console.log(`[email:console] To: ${email.to}\nSubject: ${email.subject}\n${email.text}`);
    return { provider: "console" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });

  await transporter.sendMail({ from, ...email });
  return { provider: "smtp" };
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = verificationUrl(token);
  return sendEmail({
    to,
    subject: "Verify your JobTrack email",
    text: `Verify your JobTrack email: ${url}`,
    html: `<p>Verify your JobTrack email:</p><p><a href="${url}">${url}</a></p>`
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = resetPasswordUrl(token);
  return sendEmail({
    to,
    subject: "Reset your JobTrack password",
    text: `Reset your JobTrack password: ${url}`,
    html: `<p>Reset your JobTrack password:</p><p><a href="${url}">${url}</a></p>`
  });
}
