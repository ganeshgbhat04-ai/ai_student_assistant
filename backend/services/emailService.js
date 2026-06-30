const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

    if (hasCredentials) {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"AI Study Assistant" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log("\n=================== MOCK EMAIL SENT ===================");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text Body: ${text}`);
      if (html) {
        console.log(`HTML Body Snippet: ${html.substring(0, 300)}...`);
      }
      console.log("========================================================\n");
      return { success: true, mock: true };
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
