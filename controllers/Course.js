const Course = require("../models/Course");
const Tag = require("../models/Tag");
const User = require("../models/User");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};
