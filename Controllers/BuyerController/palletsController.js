const mongoose = require("mongoose");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const { success, error } = require("../../service_response/adminApiResponse");
exports.getPallets = async (req, res, next) => {
  try {
    const sellerPallets = await SellerPallets.aggregate([
      {
        $match: {
          taken_by: mongoose.Types.ObjectId(req.buyer._id),
        },
      },
      {
        $lookup: {
          localField: "seller",
          foreignField: "_id",
          from: "wholesellers",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
    ]);
    res
      .status(200)
      .json(
        success(
          "Pallets fetched successfully",
          { sellerPallets },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
