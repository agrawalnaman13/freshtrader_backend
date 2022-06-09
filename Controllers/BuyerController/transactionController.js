const mongoose = require("mongoose");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const moment = require("moment");
const { parse } = require("json2csv");
exports.getTransactions = async (req, res, next) => {
  try {
    const { from, till, sortBy } = req.body;
    console.log(req.body);
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          buyer: 1,
          products: 1,
          ref: 1,
          type: 1,
          total: 1,
          status: 1,
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
          buyer: mongoose.Types.ObjectId(req.buyer._id),
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
      {
        $match: {
          $and: [
            from
              ? {
                  $and: [
                    { year: { $gte: new Date(date).getFullYear() } },
                    { month: { $gte: new Date(date).getMonth() + 1 } },
                    { day: { $gte: new Date(date).getDate() } },
                  ],
                }
              : {},
            till
              ? {
                  $and: [
                    { year: { $lte: new Date(date).getFullYear() } },
                    { month: { $lte: new Date(date).getMonth() + 1 } },
                    { day: { $lte: new Date(date).getDate() } },
                  ],
                }
              : {},
          ],
        },
      },
      // {
      //   $sort:
      //     sortBy === 1
      //       ? { createdAt: -1 }
      //       : sortBy === 2
      //       ? { createdAt: 1 }
      //       : sortBy === 3
      //       ? { "salesman.full_name": 1 }
      //       : sortBy === 4
      //       ? { type: 1 }
      //       : sortBy === 5
      //       ? { "buyer.business_trading_name": 1 }
      //       : sortBy === 6
      //       ? { "buyer.business_trading_name": -1 }
      //       : sortBy === 7
      //       ? { total: -1 }
      //       : sortBy === 8
      //       ? { total: 1 }
      //       : { createdAt: -1 },
      // },
    ]);
    for (const transaction of transactions) {
      for (const product of transaction.products) {
        product.productId = await SellerProduct.findById(product.productId)
          .populate(["variety", "type", "units"])
          .select(["variety", "type", "units"]);
        product.consignment = await Purchase.findById(product.consignment)
          .populate("supplier")
          .select(["supplier", "consign"]);
      }
    }
    res
      .status(200)
      .json(
        success(
          "Transactions fetched Successfully",
          { transactions },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.downloadTransactionCSV = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    if (!transactions.length) {
      return res
        .status(200)
        .json(error("Transactions are required", res.statusCode));
    }
    const fields = ["DATE", "TIME", "REF", "TYPE", "SELLER", "TOTAL", "STATUS"];
    let response = [];
    for (const transaction of transactions) {
      response.push({
        DATE: moment(transaction.createdAt).format("LL"),
        TIME: moment(transaction.createdAt).format("hh:mm A"),
        REF: transaction.ref,
        TYPE: transaction.type,
        SELLER: transaction.seller.business_trading_name,
        TOTAL: transaction.total,
        STATUS: transaction.status,
      });
    }
    const opts = { fields };
    const csv = parse(response, opts);
    return res.status(200).send(csv);
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};