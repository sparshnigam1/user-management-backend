import { requireEnv } from "@/config/index.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT")) || 587,
  secure: requireEnv("SMTP_SECURE") === "true", // true for 465, false for other ports
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

export const sendPasswordResetOtpEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"E-commerce" <${requireEnv("SMTP_FROM") || requireEnv("SMTP_USER")}>`,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <p>You requested a password reset.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
    `,
  });
};

export const passwordResetSuccessEmail = async (
  email: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"Your App" <${requireEnv("SMTP_FROM") || requireEnv("SMTP_USER")}>`,
    to: email,
    subject: "Password Reset Successful",
    html: `
      <p>This password has been reset. Login and continue withe application.</p>
    `,
  });
};

export const otpLoginEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `"E-commerce" <${requireEnv("SMTP_FROM") || requireEnv("SMTP_USER")}>`,
    to: email,
    subject: "Login OTP",
    html: `
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
    `,
  });
};

export async function loginLinkEmail(email_id: string, link: string) {
  return transporter.sendMail({
    from: `"E-commerce" <${requireEnv("SMTP_FROM") || requireEnv("SMTP_USER")}>`,
    to: email_id,
    subject: "Your login link",
    html: `<p>Click below to log in. This link expires in 15 minutes.</p>
           <a href="${link}">Log in</a>
           <p>If you didn't request this, ignore this email.</p>`,
  });
}
