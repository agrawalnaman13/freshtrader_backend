const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.searchBuyers = async (req, res, next) => {
  try {
    const { search } = req.body;
    if (!search) {
      return res
        .status(200)
        .json(error("Please provide search key", res.statusCode));
    }
    const buyers = await Buyer.find({
      business_trading_name: { $regex: search, $options: "$i" },
    }).sort({ createdAt: 1 });
    res
      .status(200)
      .json(success("Buyer fetched successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
