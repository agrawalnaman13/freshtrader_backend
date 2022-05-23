const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");

exports.getEndOfDayReport = async (req, res, next) => {
  try {
    const { date } = req.body;
    const transactions = await Transaction.aggregate([
      {
        $project: {
          seller: 1,
          products: 1,
          total: 1,
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
          credit_products: {
            $cond: [{ $eq: ["$type", "CREDIT NOTE"] }, "$products", []],
          },
          bought_products: {
            $cond: [{ $ne: ["$type", "CREDIT NOTE"] }, "$products", []],
          },
        },
      },
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
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
          ],
        },
      },
    ]);
    const products = transactions.map(({ bought_products }) => {
      return bought_products;
    });
    const credit_products = transactions.map(({ credit_products }) => {
      return credit_products;
    });
    let quantity = 0,
      sales = 0,
      credit_quantity = 0,
      credit = 0;
    for (const product of products) {
      quantity += product.reduce(function (a, b) {
        return a + b.quantity;
      }, 0);
      sales += product.reduce(function (a, b) {
        return a + b.total;
      }, 0);
    }
    for (const product of credit_products) {
      credit_quantity += product.reduce(function (a, b) {
        return a + b.quantity;
      }, 0);
      credit += product.reduce(function (a, b) {
        return a + b.total;
      }, 0);
    }
    const report = {
      quantity: quantity,
      sales: sales,
      credit_quantity: credit_quantity,
      credit: credit,
      gross: sales - credit,
    };
    res
      .status(200)
      .json(success("Report fetched Successfully", { report }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
