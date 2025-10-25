const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587, // ✅ recommended for Brevo
      secure: false, // ✅ use STARTTLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // ✅ Proper "from" field
    const info = await transporter.sendMail({
      from: `"EduTech || Techies - RamS" <98d74a001@smtp-brevo.com>`,
      to: email,
      subject: title,
      html: `<h1>${body}</h1>`,
    });

    console.log("✅ Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail send failed:", error.message);
  }
};

module.exports = mailSender;
