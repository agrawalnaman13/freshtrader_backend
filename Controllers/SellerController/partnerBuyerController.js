const mongoose = require("mongoose");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getPartnerBuyers = async (req, res, next) => {
  try {
    const buyers = await SellerPartnerBuyers.find({
      seller: req.seller._id,
    }).populate("buyer");
    res
      .status(200)
      .json(success("Buyers Fetched Successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changePartnerBuyer = async (req, res, next) => {
  try {
    const buyer = await SellerPartnerBuyers.findById(req.params.id);
    if (!buyer) {
      return res.status(200).json(error("Invalid partner id", res.statusCode));
    }
    buyer.status = !buyer.status;
    await buyer.save();
    res
      .status(200)
      .json(success("Buyer Status Changed Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
