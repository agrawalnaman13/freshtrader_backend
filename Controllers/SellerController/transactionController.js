const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const moment = require("moment");
const { parse } = require("json2csv");
exports.getTransactions = async (req, res, next) => {
  try {
    const { date, sortBy, filterBy } = req.body;
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
          salesman: 1,
          station: 1,
          is_emailed: 1,
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
        $lookup: {
          localField: "salesman",
          foreignField: "_id",
          from: "sellersalesmen",
          as: "salesman",
        },
      },
      { $unwind: "$salesman" },
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
            ? { "salesman.full_name": 1 }
            : sortBy === 4
            ? { type: 1 }
            : sortBy === 5
            ? { "buyer.business_trading_name": 1 }
            : sortBy === 6
            ? { "buyer.business_trading_name": -1 }
            : sortBy === 7
            ? { total: -1 }
            : sortBy === 8
            ? { total: 1 }
            : { createdAt: -1 },
      },
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

exports.updateTransactions = async (req, res, next) => {
  try {
    const { transactionId, products, total } = req.body;
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
    if (!products.length) {
      return res.status(200).json(error("Product is required", res.statusCode));
    }
    if (!total) {
      return res.status(200).json(error("Total is required", res.statusCode));
    }
    transaction.products = products;
    transaction.total = total;
    await transaction.save();
    res
      .status(200)
      .json(
        success(
          "Transactions updated Successfully",
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getTransactionDetail = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate(["seller", "buyer"])
      .lean();
    for (const product of transaction.products) {
      product.productId = await SellerProduct.findById(product.productId)
        .populate(["variety", "type", "units"])
        .select(["variety", "type", "units"]);
    }
    if (
      transaction.type === "INVOICE" ||
      transaction.type === "DRAFT INVOICE"
    ) {
      transaction.due_date = moment(transaction.createdAt, "DD-MM-YYYY").add(
        transaction.seller.sales_invoice_due_date,
        "days"
      );
    }
    res
      .status(200)
      .json(
        success(
          "Transaction detail fetched Successfully",
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeTransactionStatus = async (req, res, next) => {
  try {
    const { transactionId, status } = req.body;
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
    if (!status) {
      return res.status(200).json(error("Status is required", res.statusCode));
    }
    if (!["PAID", "UNPAID", "OVERDUE"].includes(status)) {
      return res.status(200).json(error("Invalid status", res.statusCode));
    }
    transaction.status = status;
    if (status === "PAID") {
      transaction.payment_received = transaction.total;
    }
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

exports.changeAllTransactionStatus = async (req, res, next) => {
  try {
    const { transactionIds, status } = req.body;
    console.log(req.body);
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transaction id is required", res.statusCode));
    }
    if (!status) {
      return res.status(200).json(error("Status is required", res.statusCode));
    }
    if (!["PAID", "UNPAID", "OVERDUE"].includes(status)) {
      return res.status(200).json(error("Invalid status", res.statusCode));
    }
    for (const transactionId of transactionIds) {
      const transaction = await Transaction.findById(transactionId);
      await Transaction.findByIdAndUpdate(transactionId, {
        status: status,
        payment_received:
          status === "PAID" ? transaction.total : transaction.payment_received,
      });
    }
    res
      .status(200)
      .json(
        success("Transaction status changed Successfully", {}, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const { transactionId, type } = req.body;
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
    if (!type) {
      return res
        .status(200)
        .json(error("Delete type is required", res.statusCode));
    }
    for (const product of transaction.products) {
      const consignment = await Purchase.findById(product.consignment);
      consignment.products = consignment.products.map((p) => {
        if (String(p.productId) === String(product._id)) {
          if (type === 1) {
            p.sold -= product.quantity;
          } else if (type === 1) {
            p.sold -= product.quantity;
            p.void += product.quantity;
          }
          p.sold_percentage = (p.sold / p.received) * 100;
          p.sales = p.sold * p.average_sales_price;
          p.inv_on_hand = p.received - p.sold - p.void;
          p.gross_profit = p.received * p.cost_per_unit - p.sales;
          p.gross_profit_percentage = (p.gross_profit / p.sales) * 100;
        }
        return p;
      });
      await consignment.save();
    }
    await Transaction.findByIdAndDelete(transactionId);
    res
      .status(200)
      .json(
        success(
          "Transaction deleted Successfully",
          { transaction },
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
    const fields = [
      "DATE",
      "TIME",
      "SALESMEN",
      "REF",
      "TYPE",
      "BUYER",
      "TOTAL",
      "EMAILED",
      "STATUS",
    ];
    let response = [];
    for (const transaction of transactions) {
      response.push({
        DATE: moment(transaction.createdAt).format("LL"),
        TIME: moment(transaction.createdAt).format("hh:mm A"),
        SALESMEN: transaction.salesman.full_name,
        REF: transaction.ref,
        TYPE: transaction.type,
        BUYER: transaction.buyer.business_trading_name,
        TOTAL: transaction.total,
        EMAILED: transaction.is_emailed ? "YES" : "NO",
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
