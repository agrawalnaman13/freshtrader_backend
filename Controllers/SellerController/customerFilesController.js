const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
exports.getCustomerInfo = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res.status(200).json(error("Buyer is required", res.statusCode));
    }
    const buyer_data = await Buyer.findById(req.params.id);
    if (!buyer_data) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          buyer: 1,
          total: 1,
          status: 1,
          type: 1,
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
          buyer: mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $project: {
          seller: 1,
          buyer: 1,
          total: 1,
          status: 1,
          type: 1,
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
          bought_today: {
            $cond: [
              {
                $and: [
                  { $eq: ["$year", new Date().getFullYear()] },
                  { $eq: ["$month", new Date().getMonth() + 1] },
                  { $eq: ["$day", new Date().getDate()] },
                ],
              },
              "$total",
              0,
            ],
          },
          paid_total: { $cond: [{ $eq: ["$status", "PAID"] }, "$total", 0] },
          credit_total: {
            $cond: [{ $eq: ["$type", "CREDIT NOTE"] }, "$total", 0],
          },
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
        $group: {
          _id: {
            buyer: "$buyer",
            year: "$year",
            month: "$month",
            day: "$day",
          },
          total_owed: { $sum: "$total" },
          bought: { $sum: "$bought_today" },
          paid: { $sum: "$paid_total" },
          credit: { $sum: "$credit_total" },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    console.log(transactions);
    const total_owed = transactions.reduce(function (a, b) {
      return a + b.total_owed;
    }, 0);
    const customer = {
      buyer: transactions[0]._id.buyer,
      opening: total_owed - transactions[1]?.credit,
      bought: transactions[0].bought,
      paid: transactions[0].paid,
      credit: transactions[0].credit,
      closing:
        total_owed -
        transactions[1]?.credit -
        transactions[0].paid -
        transactions[0].credit,
    };

    res
      .status(200)
      .json(
        success(
          "Customer information fetched Successfully",
          { customer },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getCustomerTransactions = async (req, res, next) => {
  try {
    const { buyerId, date, sortBy, filterBy } = req.body;
    console.log(req.body);
    if (!buyerId) {
      return res.status(200).json(error("Buyer is required", res.statusCode));
    }
    const buyer_data = await Buyer.findById(buyerId);
    if (!buyer_data) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
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
          buyer: mongoose.Types.ObjectId(buyerId),
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
        $addFields: {
          total_owed: { $subtract: ["$total", "$payment_received"] },
        },
      },
      {
        $match: {
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
              ? { $and: [{ is_smcs: true }, { type: "INVOICE" }] }
              : {},
            filterBy === 3
              ? { $and: [{ is_smcs: false }, { type: "INVOICE" }] }
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

exports.receivePayment = async (req, res, next) => {
  try {
    const { transactionId, payment } = req.body;
    console.log(req.body);
    if (!transactionId) {
      return res
        .status(200)
        .json(error("Transaction id is required", res.statusCode));
    }
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res
        .status(200)
        .json(error("Invalid transaction id", res.statusCode));
    }
    if (!payment) {
      return res.status(200).json(error("Payment is required", res.statusCode));
    }
    transaction.payment_received = payment;
    await transaction.save();
    res
      .status(200)
      .json(
        success(
          "Transaction status changed Successfully",
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
