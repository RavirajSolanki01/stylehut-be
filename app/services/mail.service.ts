import nodemailer from "nodemailer";
import { getOtpEmailTemplate } from "../utils/templates/otpTemplate";
import { getUserActivationStatusTemplate } from "../utils/templates/activationOtpStatusTemplate";
import { contactSupportDeactivatedUserTemplate } from "../utils/templates/contactSupportDeactivatedUserTemplate";

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

const sendUserActivationStausEmail = async (email: string, message: string) => {
  return await transporter.sendMail({
    from: `"StyleHut" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Hello Admin",
    html: getUserActivationStatusTemplate(message, email),
    headers: { "X-Entity-Ref-ID": "newmail" },
  });
};

const sendDeativatedUserContactSupportEmail = async (email: string, name: string) => {
  return await transporter.sendMail({
    from: `"StyleHut" <${process.env.SMTP_USER}>`,
    to: ["superadmin@yopmail.com", "superadmin@stylehut.com"],
    subject: "Hello Admin",
    html: contactSupportDeactivatedUserTemplate(email, name),
    headers: { "X-Entity-Ref-ID": "newmail" },
  });
};

export { sendOTPEmail, sendUserActivationStausEmail, sendDeativatedUserContactSupportEmail };
