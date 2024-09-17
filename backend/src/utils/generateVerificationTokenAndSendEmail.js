// /utils/emailUtils.js
 // Make sure to import your sendEmail function
import crypto from "crypto"
import { sendEmail } from "./emailUtility.js";
const generateAndSendVerificationEmail = async (email) => {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 600000); // Token expires in 10 minutes

    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    const htmlContent = `<p>Please verify your email by clicking the link: <a href="${verificationUrl}">Verify Email</a></p>`;

    await sendEmail(email, "Email Verification", htmlContent);

    return { token: verificationToken, verificationExpiry: tokenExpiry };
};

export { generateAndSendVerificationEmail }