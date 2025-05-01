import nodemailer from "nodemailer";
import { getOtpEmailTemplate } from "../utils/templates/otpTemplate";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (email: string, otp: string) => {
  return await transporter.sendMail({
    from: `"StyleHut" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Hello Admin",
    html: getOtpEmailTemplate(otp, email),
    headers: { "X-Entity-Ref-ID": "newmail" },
  });
};

export { sendOTPEmail };
