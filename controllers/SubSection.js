const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadVideoToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async (req, res) => {
  try {
    // fetch data
    const { sectionId, title, timeDuration, description } = req.body;
    // extract file / video
    const video = req.files.videoFile;
    // validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    console.log("video file", video);
    // upload video to cloudinary
    const uploadDetails = await uploadVideoToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    // create sub-section
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });
    // update section with sub-section id

    // Update the corresponding section with the newly created sub-section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: SubSectionDetails._id } },
      { new: true }
    ).populate("subSection");

    // Return the updated section in the response
    return res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create subsection. Please try again later.",
    });
  }
};

// update sub-section
exports.updatedSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, timeDuration, description } =
      req.body;

    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    if (!title !== undefined) {
      subSection.title = title;
    }
    if (!timeDuration !== undefined) {
      subSection.timeDuration = timeDuration;
    }

    if (!description !== undefined) {
      subSection.description = description;
    }
    if (req.files && req.files.videoFile !== undefined) {
      const video = req.files.videoFile;
      const uploadDetails = await uploadVideoToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }
    await subSection.save();

    // find the updated course and return
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );
    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update subsection. Please try again later.",
    });
  }
};

// delete sub-section

exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId } = req.body;

    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    );
    const subSection = await SubSection.findByIdAndDelete({
      _id: subSectionId,
    });

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete subsection. Please try again later.",
    });
  }
};
