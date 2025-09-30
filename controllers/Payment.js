const { instance } = require("../config/razorpay");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const courseEnrollmentEmail = require("../mail/templates/courseEnrollmentEmail");

// Capture the payment and initiate the Razorpay order logic here
exports.capturePayment = async (req, res) => {
  // get userID and courseID
  const { course_id } = req.body;
  const userId = req.user.id;

  // validation
  if (!course_id) {
    return res.status(400).json({
      success: false,
      message: "Please provide Course ID",
    });
  }

  let course;
  try {
    course = await Course.findById(course_id);
    //validation course details

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // user already pay for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(200).json({
        success: false,
        message: "Student has already enrolled for the course",
      });
    }
    // return response
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }

  // create order on razorpay
  const amount = course.price;
  const currency = "INR";
  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      course_id: course_id,
      userId: userId,
    },
  };

  try {
    // initialize order using razorpay instance
    const paymentResponse = await instance.orders.create(options);
    console.log("Razorpay Order:", paymentResponse);
    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      courseName: course.courseName,
      courseId: course._id,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not create payment",
    });
  }
};

// verify payment
exports.verifySignature = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const shasum = crypto.createHmac("sha256", webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (signature === digest) {
    console.log("Request is Authentic");

    const { course_id, userId } = req.body.payload.payment.entity.notes;

    try {
      // Find the Student & enroll the student
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: course_id },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }

      console.log(enrolledCourse);

      // Find the user and update their list of enrolled courses
      const enrolledStudent = await User.findOneAndUpdate(
        { _id: userId },
        { $push: { courses: course_id } },
        { new: true }
      );
      console.log(enrolledStudent);

      // send mail to student for enrollment
      const emailResponse = await mailSender({
        to: enrolledStudent.email,
        subject: "Congrats! from Techie EdTech",
        text: `You have been successfully enrolled in the course: ${Course.courseName}`,
      });
      console.log(emailResponse);
      return res.status(200).json({
        success: true,
        message: "Signature Verified, Student enrolled successfully",
        enrolledCourse,
        enrolledStudent,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }
};
