const mongoose = require("mongoose");
const Support = require("../../Models/SellerModels/supportSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
exports.getSupport = async (req, res, next) => {
  try {
    const { type, from, till } = req.body;
    if (!type) {
      return res.status(200).json(error("Please provide type", res.statusCode));
    }
    const supports = await Support.find({
      type: type,
      $and: [
        from ? { createdAt: { $gte: new Date(from) } } : {},
        till ? { createdAt: { $lte: new Date(till) } } : {},
      ],
    })
      .sort({ createdAt: -1 })
      .lean();
    for (const support of supports) {
      if (type === "Seller") {
        support.user = await Wholeseller.findOne({ email: support.email });
      } else {
        support.user = await Buyer.findOne({ email: support.email });
      }
    }
    res
      .status(200)
      .json(
        success("Support Fetched Successfully", { supports }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
