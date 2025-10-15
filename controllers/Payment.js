const { instance } = require("../config/razorpay");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const courseEnrollmentEmail = require("../mail/templates/courseEnrollmentEmail");
const paymentSuccessEmail = require("../mail/templates/paymentSuccessEmail");

// Capture the payment and initiate the Razorpay order

exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (!courses || courses.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide Course IDs",
    });
  }

  let totalAmount = 0;
  for (const course_id of courses) {
    try {
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course ${course_id} not found`,
        });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({
          success: false,
          message: `Already enrolled in course ${course.courseName}`,
        });
      }

      if (!course.price || isNaN(course.price)) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for course ${course.courseName}`,
        });
      }

      totalAmount += Number(course.price);
    } catch (error) {
      console.error("Error fetching course:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }

  if (isNaN(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid total amount for payment",
    });
  }

  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    console.log("Razorpay Order:", paymentResponse);
    return res.status(200).json({
      success: true,
      message: paymentResponse, // frontend expects message.id, message.amount, message.currency
    });
  } catch (error) {
    console.error("Razorpay Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create payment",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courses,
  } = req.body;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    courses.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all the details",
    });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (razorpay_signature === expectedSignature) {
    await enrollStudents(courses, userId, res);
    return res.status(200).json({
      success: true,
      message: "Payment Successful",
    });
  }

  return res.status(400).json({
    success: false,
    message: "Payment Failed",
  });
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" });
  }

  try {
    const enrolledStudent = await User.findById(userId);

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment success email sent",
    });
  } catch (error) {
    console.log("error in sending mail", error);
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" });
  }
};

const enrollStudents = async (courses, userId, res) => {
  //
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please Provide Course ID and User ID",
    });
  }

  for (const courseId of courses) {
    try {
      // find the course enroll the student
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }
      // find the student and add the course to their list of enrolled courses
      const enrolledStudents = await User.findByIdAndUpdate(
        userId,
        { $push: { courses: courseId } },
        { new: true }
      );

      // send mail to student for enrollment
      const emailResponse = await mailSender(
        enrolledStudents.email,
        `Congrats! from Techie EdTech Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudents.firstName} }`
        )
      );
      console.log("Email sent successfully: ", emailResponse.response);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

// exports.capturePayment = async (req, res) => {
//   const { courses } = req.body;
//   const userId = req.user.id;

//   if (!courses.length === 0) {
//     return res.json({ message: "Please provide Course ID" });
//   }

//   let totalAmount = 0;
//   for (const course_id of courses) {
//     let course;

//     try {
//       course = await Course.findById(course_id);

//       if (!course) {
//         return res.status(200).json({ message: "Course not found" });
//       }

//       // user already pay for the same course
//       const uid = new mongoose.Types.ObjectId(userId);
//       if (course.studentsEnrolled.includes(uid)) {
//         return res.status(200).json({
//           success: false,
//           message: "Student has already enrolled for the course",
//         });
//       }

//       totalAmount += course.price;
//     } catch (error) {
//       console.log("error in fetching course", error);
//       return res.status(500).json({
//         success: false,
//         message: "Internal Server Error",
//       });
//     }
//   }

//   // create an options
//   const options = {
//     amount: totalAmount * 100,
//     currency: "INR",
//     receipt: Math.random(Date.now().toString()),
//   };

//   // create order on razorpay
//   try {
//     const paymentResponse = await instance.orders.create(options);
//     res.status(200).json({
//       success: true,
//       message: "Payment initiated successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Could not create payment",
//     });
//   }
// };

// verify payment

// exports.verifyPayment = async (req, res) => {
//   const razorpay_order_id = req.body.razorpay_order_id;
//   const razorpay_payment_id = req.body.razorpay_payment_id;
//   const razorpay_signature = req.body.razorpay_signature;
//   const courses = req.body?.courses;
//   const userId = req.user.id;

//   if (
//     !razorpay_order_id ||
//     !razorpay_payment_id ||
//     !razorpay_signature ||
//     !courses.length === 0
//   ) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide all the details",
//     });
//   }

//   let body = razorpay_order_id + "|" + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_SECRET)
//     .update(body.toString())
//     .digest("hex");

//   if (signature === expectedSignature) {
//     // enroll the student in the course
//     await enrollStudents(courses, userId, res);
//     return res.status(200).json({
//       success: true,
//       message: "Payment Successful",
//     });
//   }
//   return res.status(400).json({
//     success: false,
//     message: "Payment Failed",
//   });
// };

// exports.capturePayment = async (req, res) => {
//   // get userID and courseID
//   const { course_id } = req.body;
//   const userId = req.user.id;

//   // validation
//   if (!course_id) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide Course ID",
//     });
//   }

//   let course;
//   try {
//     course = await Course.findById(course_id);
//     //validation course details

//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: "Course not found",
//       });
//     }

//     // user already pay for the same course
//     const uid = new mongoose.Types.ObjectId(userId);
//     if (course.studentsEnrolled.includes(uid)) {
//       return res.status(200).json({
//         success: false,
//         message: "Student has already enrolled for the course",
//       });
//     }
//     // return response
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }

//   // create order on razorpay
//   const amount = course.price;
//   const currency = "INR";
//   const options = {
//     amount: amount * 100, // amount in the smallest currency unit
//     currency,
//     receipt: Math.random(Date.now()).toString(),
//     notes: {
//       course_id: course_id,
//       userId: userId,
//     },
//   };

//   try {
//     // initialize order using razorpay instance
//     const paymentResponse = await instance.orders.create(options);
//     console.log("Razorpay Order:", paymentResponse);
//     return res.status(200).json({
//       success: true,
//       message: "Payment initiated successfully",
//       courseName: course.courseName,
//       courseId: course._id,
//       courseDescription: course.courseDescription,
//       thumbnail: course.thumbnail,
//       orderId: paymentResponse.id,
//       currency: paymentResponse.currency,
//       amount: paymentResponse.amount,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Could not create payment",
//     });
//   }
// };

// verify payment
// exports.verifyPayment = async (req, res) => {
//   const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//   const signature = req.headers["x-razorpay-signature"];
//   const shasum = crypto.createHmac("sha256", webhookSecret);
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest("hex");

//   if (signature === digest) {
//     console.log("Request is Authentic");

//     const { course_id, userId } = req.body.payload.payment.entity.notes;

//     try {
//       // Find the Student & enroll the student
//       const enrolledCourse = await Course.findOneAndUpdate(
//         { _id: course_id },
//         { $push: { studentsEnrolled: userId } },
//         { new: true }
//       );

//       if (!enrolledCourse) {
//         return res.status(500).json({
//           success: false,
//           message: "Course not found",
//         });
//       }

//       console.log(enrolledCourse);

//       // Find the user and update their list of enrolled courses
//       const enrolledStudent = await User.findOneAndUpdate(
//         { _id: userId },
//         { $push: { courses: course_id } },
//         { new: true }
//       );
//       console.log(enrolledStudent);

//       // send mail to student for enrollment
//       const emailResponse = await mailSender({
//         to: enrolledStudent.email,
//         subject: "Congrats! from Techie EdTech",
//         text: `You have been successfully enrolled in the course: ${Course.courseName}`,
//       });
//       console.log(emailResponse);
//       return res.status(200).json({
//         success: true,
//         message: "Signature Verified, Student enrolled successfully",
//         enrolledCourse,
//         enrolledStudent,
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Internal Server Error",
//       });
//     }
//   } else {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid signature",
//     });
//   }
// };

// Send Payment Success Email
// exports.sendPaymentSuccessEmail = async (req, res) => {
//   const { orderId, paymentId, amount } = req.body;

//   const userId = req.user.id;

//   if (!orderId || !paymentId || !amount || !userId) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Please provide all the details" });
//   }

//   try {
//     const enrolledStudent = await User.findById(userId);

//     await mailSender(
//       enrolledStudent.email,
//       `Payment Received`,
//       paymentSuccessEmail(
//         `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
//         amount / 100,
//         orderId,
//         paymentId
//       )
//     );
//   } catch (error) {
//     console.log("error in sending mail", error);
//     return res
//       .status(400)
//       .json({ success: false, message: "Could not send email" });
//   }
// };

// enroll the student in the courses
// const enrollStudents = async (courses, userId, res) => {
//   if (!courses || !userId) {
//     return res.status(400).json({
//       success: false,
//       message: "Please Provide Course ID and User ID",
//     });
//   }

//   for (const courseId of courses) {
//     try {
//       // Find the course and enroll the student in it
//       const enrolledCourse = await Course.findOneAndUpdate(
//         { _id: courseId },
//         { $push: { studentsEnrolled: userId } },
//         { new: true }
//       );

//       if (!enrolledCourse) {
//         return res
//           .status(500)
//           .json({ success: false, error: "Course not found" });
//       }
//       console.log("Updated course: ", enrolledCourse);

//       const courseProgress = await CourseProgress.create({
//         courseID: courseId,
//         userId: userId,
//         completedVideos: [],
//       });
//       // Find the student and add the course to their list of enrolled courses
//       const enrolledStudent = await User.findByIdAndUpdate(
//         userId,
//         {
//           $push: {
//             courses: courseId,
//             courseProgress: courseProgress._id,
//           },
//         },
//         { new: true }
//       );

//       console.log("Enrolled student: ", enrolledStudent);
//       // Send an email notification to the enrolled student
//       const emailResponse = await mailSender(
//         enrolledStudent.email,
//         `Successfully Enrolled into ${enrolledCourse.courseName}`,
//         courseEnrollmentEmail(
//           enrolledCourse.courseName,
//           `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
//         )
//       );

//       console.log("Email sent successfully: ", emailResponse.response);
//     } catch (error) {
//       console.log(error);
//       return res.status(400).json({ success: false, error: error.message });
//     }
//   }
// };
