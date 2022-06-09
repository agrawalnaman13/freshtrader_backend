const mongoose = require("mongoose");
const Support = require("../../Models/SellerModels/supportSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.createSupport = async (req, res, next) => {
  try {
    const { email, subject, concern, type } = req.body;

    if (!email) {
      return res
        .status(200)
        .json(error("Please provide email", res.statusCode));
    }
    if (!subject) {
      return res
        .status(200)
        .json(error("Please provide subject", res.statusCode));
    }
    if (!concern) {
      return res
        .status(200)
        .json(error("Please provide concern", res.statusCode));
    }
    if (!type) {
      return res.status(200).json(error("Please provide type", res.statusCode));
    }
    const support = await Support.create({ email, subject, concern, type });

    res
      .status(200)
      .json(
        success("Ticket Created Successfully", { support }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.replySupport = async (req, res, next) => {
  try {
    const { ticketId, reply } = req.body;
    if (!ticketId) {
      return res
        .status(200)
        .json(error("Please provide ticket id", res.statusCode));
    }
    if (!reply) {
      return res
        .status(200)
        .json(error("Please provide reply", res.statusCode));
    }
    const support = await Support.findById(ticketId);
    if (!support) {
      return res.status(200).json(error("Invalid ticket id", res.statusCode));
    }
    support.reply.push(reply);
    await support.save();

    res
      .status(200)
      .json(success("Replied Successfully", { support }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeSupportStatus = async (req, res, next) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) {
      return res.status(200).json(error("Invalid ticket id", res.statusCode));
    }
    support.status = !support.status;
    await support.save();

    res
      .status(200)
      .json(
        success(
          "Ticket Status Changed Successfully",
          { support },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSupport = async (req, res, next) => {
  try {
    const seller = await Wholeseller.findById(req.seller._id);
    const support = await Support.find({ email: seller.email, type: "Seller" });
    res
      .status(200)
      .json(
        success("Support Fetched Successfully", { support }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteSupport = async (req, res, next) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) {
      return res.status(200).json(error("Invalid ticket id", res.statusCode));
    }
    await Support.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json(success("Ticket Deleted Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSupportDetail = async (req, res, next) => {
  try {
    const support = await Support.findById(req.params.id);
    if (!support) {
      return res.status(200).json(error("Invalid ticket id", res.statusCode));
    }
    res
      .status(200)
      .json(
        success("Support Fetched Successfully", { support }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
