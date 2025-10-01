const Tag = require("../models/Tags");

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Tag name and description are required",
      });
    }

    // create new tag
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });
    console.log(tagDetails);
    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      tag: tagDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create tag",
    });
  }
};

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true });

    return res.status(200).json({
      success: true,
      message: "All tags fetched successfully",
      allTags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tags",
    });
  }
};
