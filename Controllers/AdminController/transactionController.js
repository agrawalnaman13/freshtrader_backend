const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
exports.getTransactions = async (req, res) => {
  try {
    const { from, till } = req.body;
    const transactions = await SubscriptionHistory.find({
      $and: [
        from ? { createdAt: { $gte: new Date(from) } } : {},
        till ? { createdAt: { $lte: new Date(till) } } : {},
      ],
    })
      .populate(["plan", "buyer"])
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json(
        success(
          "Transactions Fetched Successfully",
          { transactions },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
