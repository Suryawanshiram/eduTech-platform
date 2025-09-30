const Profile = require("../models/Profile");
const User = require("../models/User");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");

exports.updateProfile = async (req, res) => {
  try {
    // fetch data

    //get UserID
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    const id = req.user.id;
    // create profile

    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    // find profile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);

    // update user with profile id
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;
    await profileDetails.save();

    // return response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create profile. Please try again later.",
    });
  }
};

//detail profile
exports.deleteProfile = async (req, res) => {
  try {
    //get user id
    const id = req.user.id;

    // validation id
    const userDetails = await User.findById(id);
    // find profile id from user delete user
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }
    const profileId = userDetails.additionalDetails;
    if (!profileId) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }
    // Delete Associated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(userDetails.additionalDetails),
    });
    for (const courseId of userDetails.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnrolled: id } },
        { new: true }
      );
    }
    // Now Delete User
    await User.findByIdAndDelete({ _id: id });
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
    await CourseProgress.deleteMany({ userId: id });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete profile. Please try again later.",
    });
  }
};

exports.getAllUsersDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    console.log(userDetails);
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
