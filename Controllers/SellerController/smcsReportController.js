const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");

exports.getSMCSReport = async (req, res, next) => {
  try {
    const { date, sortBy, filterBy } = req.body;
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          buyer: 1,
          total: 1,
          payment_received: 1,
          status: 1,
          ref: 1,
          type: 1,
          smcs_notified: 1,
          createdAt: 1,
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
          day: {
            $dayOfMonth: "$createdAt",
          },
        },
      },
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
        $match: {
          "buyer.is_smcs": true,
          $and: [
            date
              ? {
                  $and: [
                    { year: new Date(date).getFullYear() },
                    { month: new Date(date).getMonth() + 1 },
                    { day: new Date(date).getDate() },
                  ],
                }
              : {},
            filterBy === 1 ? { type: "CASH" } : {},
            filterBy === 2
              ? { $and: [{ "buyer.is_smcs": true }, { type: "INVOICE" }] }
              : {},
            filterBy === 3
              ? { $and: [{ "buyer.is_smcs": false }, { type: "INVOICE" }] }
              : {},
            filterBy === 4 ? { type: "CREDIT NOTE" } : {},
            filterBy === 5 ? { status: "PAID" } : {},
            filterBy === 6 ? { status: "UNPAID" } : {},
            filterBy === 7 ? { status: "OVERDUE" } : {},
          ],
        },
      },
      {
        $sort:
          sortBy === 1
            ? { createdAt: -1 }
            : sortBy === 2
            ? { createdAt: 1 }
            : sortBy === 3
            ? { type: 1 }
            : sortBy === 4
            ? { total: -1 }
            : sortBy === 5
            ? { total: 1 }
            : sortBy === 6
            ? { smcs_notified: 1 }
            : sortBy === 7
            ? { status: 1 }
            : { createdAt: -1 },
      },
    ]);

    res
      .status(200)
      .json(
        success(
          "Customer's transactions fetched Successfully",
          { transactions },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
