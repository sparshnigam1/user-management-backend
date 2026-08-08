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

export const sendOtpEmail = async (
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
