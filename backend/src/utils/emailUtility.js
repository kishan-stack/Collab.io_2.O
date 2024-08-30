import nodemailer from "nodemailer"
import { ApiError} from "./ApiError.js"
const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL,
        pass:process.env.EMAIL_PASSWORD,
    },
});


const sendEmail = async ( to, subject, html ) =>{
    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        html: html
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.log(`Error while sending email to ${to} :`,error)
        throw new ApiError(500,"Email sending failed")
    }

}

export { sendEmail }
