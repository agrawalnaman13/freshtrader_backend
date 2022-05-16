const mongoose = require("mongoose");
const Order = require("../../Models/BuyerModels/orderSchema");
const { success, error } = require("../../service_response/adminApiResponse");
exports.getOrders = async (req, res, next) => {
  try {
    const { sortBy } = req.body;
    console.log(req.body);
    const orders = await Order.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
        },
      },
      {
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $sort:
          sortBy === 1
            ? { createdAt: 1 }
            : sortBy === 2
            ? { createdAt: -1 }
            : sortBy === 3
            ? { pick_up_time: 1 }
            : sortBy === 4
            ? { pick_up_time: -1 }
            : { createdAt: 1 },
      },
    ]);
    res
      .status(200)
      .json(success("Order fetched successfully", { orders }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
