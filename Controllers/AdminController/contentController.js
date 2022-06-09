const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Content = require("../../Models/AdminModels/contentSchema");
exports.createContent = async (req, res, next) => {
  try {
    const { type, content } = req.body;
    if (!type) {
      return res.status(200).json(error("Please provide type", res.statusCode));
    }
    if (!content) {
      return res
        .status(200)
        .json(error("Please provide content", res.statusCode));
    }
    const isContent = await Content.findOne({
      type: type,
    });
    let newContent;
    if (!isContent) {
      newContent = await Content.create({
        type: type,
        content: content,
      });
    } else {
      newContent = await Content.findByIdAndUpdate(isContent._id, {
        content: content,
      });
    }
    res
      .status(200)
      .json(
        success(
          "Content Added Successfully",
          { content: newContent },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateContent = async (req, res, next) => {
  try {
    const { contentId, content } = req.body;
    if (!contentId) {
      return res
        .status(200)
        .json(error("Please provide content id", res.statusCode));
    }
    const isContent = await Content.findById(contentId);
    if (!isContent) {
      return res.status(200).json(error("Invalid content id", res.statusCode));
    }
    if (!content) {
      return res
        .status(200)
        .json(error("Please provide content", res.statusCode));
    }
    const newContent = await Content.findByIdAndUpdate(contentId, {
      content: content,
    });
    res
      .status(200)
      .json(
        success(
          "Content Updated Successfully",
          { content: newContent },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    const isContent = await Content.findById(req.params.id);
    if (!isContent) {
      return res.status(200).json(error("Invalid content id", res.statusCode));
    }

    await Content.findByIdAndDelete(contentId);
    res
      .status(200)
      .json(success("Content Deleted Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getContents = async (req, res, next) => {
  try {
    const { type } = req.body;
    let query = {};
    if (type) query = { type };
    const contents = await Content.find(query);
    res
      .status(200)
      .json(
        success("Content Fetched Successfully", { contents }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
