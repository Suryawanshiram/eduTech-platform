const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
  courseID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  completedVideos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSection",
    },
  ],
});

module.exports =
  mongoose.models.CourseProgress ||
  mongoose.model("CourseProgress", courseProgressSchema);

// const mongoose = require("mongoose");

// const courseProgress = new mongoose.Schema({
//   courseID: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Course",
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "user",
//   },
//   completedVideos: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "SubSection",
//     },
//   ],
// });

// module.exports = mongoose.model("courseProgress", courseProgress);
