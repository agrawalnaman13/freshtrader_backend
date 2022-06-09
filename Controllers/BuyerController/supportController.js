const mongoose = require("mongoose");
const Support = require("../../Models/SellerModels/supportSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
exports.getSupport = async (req, res, next) => {
  try {
    const buyer = await Buyer.findById(req.buyer._id);
    const support = await Support.find({ email: buyer.email, type: "Buyer" });
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
