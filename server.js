const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const { cloudinaryConnect } = require("./config/cloudinary");
const database = require("./config/database");

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 4000;

// ✅ 1. Connect to database FIRST
database.connect();

// ✅ 2. Apply CORS middleware BEFORE any JSON or cookie parsing
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://edu-tech-frontend-indol.vercel.app",
      "https://rs-edu-tech.vercel.app",
    ],
    credentials: true,
  })
);

// ✅ 3. Then parse cookies & JSON
app.use(express.json());
app.use(cookieParser());

// ✅ 4. Handle file uploads
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./temp",
  })
);

// ✅ 5. Connect to Cloudinary
cloudinaryConnect();

// ✅ 6. Import routes AFTER middlewares
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");

// ✅ 7. Use routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/reach", contactUsRoute);

// ✅ 8. Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Your EduTech backend server is running successfully 🚀",
  });
});

// ✅ 9. Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
