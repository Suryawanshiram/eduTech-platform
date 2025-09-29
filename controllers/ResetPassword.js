// Reset Password token
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");

exports.resetPasswordToken = async (req, res) => {
  try {
    // get email from req.body
    const { email } = req.body;
    // check if user exists, email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Your email is not registered" });
    }

    //generate token
    const token = crypto.randomBytes(20).toString("hex");

    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { new: true }
    );
    console.log("DETAILS", updatedDetails);

    const url = `http://localhost:3000/update-password${token}`;

    await mailSender(
      email,
      "Password Reset Request",
      `Click on the link to reset your password: ${url}. This link is valid for 1 hour.`
    );
    res.status(200).json({
      success: true,
      message:
        "Email sent Successfully. Please check your inbox for the password reset link.",
    });
  } catch (error) {
    console.error("Error in resetPasswordToken:", error);
    res.status(500).json({
      success: false,
      message: "Error in sending email. Please try again later.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    if (confirmPassword !== password) {
      return res.json({
        success: false,
        message: "Password and Confirm Password Does not Match",
      });
    }
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is Invalid",
      });
    }
    if (!(userDetails.resetPasswordExpires > Date.now())) {
      return res.status(403).json({
        success: false,
        message: `Token is Expired, Please Regenerate Your Token`,
      });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { token: token },
      { password: encryptedPassword },
      { new: true }
    );
    res.json({
      success: true,
      message: `Password Reset Successful`,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      message: `Some Error in Updating the Password`,
    });
  }
};
