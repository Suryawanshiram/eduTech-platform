const cloudinary = require("cloudinary").v2;

exports.cloudinaryConnect = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY, // corrected
      api_secret: process.env.CLOUD_API_SECRET, // corrected
    });
    console.log("✅ Cloudinary configured successfully");
  } catch (error) {
    console.error("❌ Cloudinary configuration error:", error);
  }
};
