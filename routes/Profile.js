const express = require("express");
const router = express.Router();
const { auth, isInstructor } = require("../middleware/auth");

const {
  updateProfile,
  instructorDashboard,
  getAllUsersDetails,
  deleteProfile,
} = require("../controllers/Profile");
const { getEnrolledCourses } = require("../controllers/Profile");
const { updateDisplayPicture } = require("../controllers/Profile");

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
// Delete User Account
router.delete("/deleteProfile", auth, deleteProfile);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getAllUsersDetails);
// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateDisplayPicture", auth, updateDisplayPicture);
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

module.exports = router;
