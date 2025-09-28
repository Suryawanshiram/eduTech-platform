const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: "EduTech || Techies - RamS",
      to: `${email}`,
      subject: `${title}`,
      html: `<h1>${body}</h1>`,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = mailSender;
