const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const moment = require("moment");
const { parse } = require("json2csv");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const sendMail = require("../../services/mail");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
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
          is_smcs: 1,
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
          localField: "salesman",
          foreignField: "_id",
          from: "sellerstaffs",
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
            ? { "salesman.username": 1 }
            : sortBy === 4
            ? { type: 1 }
            : sortBy === 7
            ? { total: -1 }
            : sortBy === 8
            ? { total: 1 }
            : { createdAt: -1 },
      },
    ]);
    for (const transaction of transactions) {
      if (transaction.buyer)
        transaction.buyer = await Buyer.findById(transaction.buyer);
      else transaction.buyer = {};
      for (const product of transaction.products) {
        product.productId = await SellerProduct.findById(product.productId)
          .populate(["variety", "type", "units"])
          .select(["variety", "type", "units"]);
        product.consignment = await Purchase.findById(product.consignment)
          .populate("supplier")
          .select(["supplier", "consign"]);
      }
    }
    if (sortBy === 5) {
      transactions.sort((a, b) =>
        a.buyer.business_trading_name > b.buyer.business_trading_name
          ? 1
          : b.buyer.business_trading_name > a.buyer.business_trading_name
          ? -1
          : 0
      );
    }
    if (sortBy === 6) {
      transactions.sort((a, b) =>
        a.buyer.business_trading_name < b.buyer.business_trading_name
          ? 1
          : b.buyer.business_trading_name < a.buyer.business_trading_name
          ? -1
          : 0
      );
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
      let sold = 0,
        voids = 0;
      const consignment = await Purchase.findById(product.consignment);
      consignment.products = consignment.products.map((p) => {
        if (String(p.productId) === String(product.productId)) {
          if (type === 1) {
            p.sold -= product.quantity;
          } else if (type === 1) {
            p.sold -= product.quantity;
            p.void += product.quantity;
          }
          p.sold_percentage = (p.sold / p.received) * 100;
          p.total_sales = p.sold * p.average_sales_price;
          p.inv_on_hand = p.received - p.sold - p.void;
          p.gross_profit = p.received * p.cost_per_unit - p.total_sales;
          p.gross_profit_percentage = (p.gross_profit / p.total_sales) * 100;
          sold = p.sold;
          voids = p.void;
        }
        return p;
      });
      await Inventory.findOneAndUpdate(
        {
          seller: req.seller._id,
          productId: product.productId,
          consignment: product.consignment,
        },
        {
          sold: +sold,
          void: +voids,
        }
      );
      await consignment.save();
    }
    if (type === 1) {
      const myPallets = await SellerPallets.findOne({
        seller: req.seller._id,
        taken_by: transaction.buyer,
      });
      await SellerPallets.findOneAndUpdate(
        {
          seller: req.seller._id,
          taken_by: transaction.buyer,
        },
        {
          pallets_taken: myPallets.pallets_taken - +transaction.pallets,
        }
      );
      const isPallets = await SellerPallets.findOne({
        seller: req.seller._id,
        pallets_taken: 0,
        pallets_received: 0,
      });
      if (isPallets) {
        await SellerPallets.findOneAndUpdate(
          {
            seller: req.seller._id,
            pallets_taken: 0,
            pallets_received: 0,
          },
          {
            pallets_on_hand: isPallets.pallets_on_hand + +transaction.pallets,
          }
        );
      }
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
    const { transactionIds } = req.body;
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transactions are required", res.statusCode));
    }
    const newTransactionIds = transactionIds.map((id) => {
      return mongoose.Types.ObjectId(id);
    });
    const transactions = await Transaction.aggregate([
      {
        $match: {
          _id: { $in: newTransactionIds },
        },
      },
      {
        $lookup: {
          localField: "salesman",
          foreignField: "_id",
          from: "sellerstaffs",
          as: "salesman",
        },
      },
      { $unwind: "$salesman" },
    ]);
    for (const transaction of transactions) {
      if (transaction.buyer)
        transaction.buyer = await Buyer.findById(transaction.buyer);
      else transaction.buyer = {};
    }

    const seller = await Wholeseller.findById(req.seller._id).select("csv");
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
        SALESMEN: transaction.salesman.username,
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

exports.checkOverdueTransactions = async () => {
  try {
    const transactions = await Transaction.find({ status: "UNPAID" }).populate(
      "seller"
    );
    for (const transaction of transactions) {
      const seller = await Wholeseller.findById(transaction.seller);
      const due_date = moment(transaction.createdAt, "DD-MM-YYYY").add(
        transaction.seller.sales_invoice_due_date,
        "days"
      );
      if (new Date(due_date) < new Date(Date.now())) {
        await Transaction.findByIdAndUpdate(transaction._id, {
          status: "OVERDUE",
        });
      }
    }
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};

exports.emailTransactionToBuyer = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res
        .status(200)
        .json(error("Invalid transaction id", res.statusCode));
    }
    transaction.is_emailed = true;
    await transaction.save();
    // await sendMail(transaction.buyer.email, "Freshtraders", "");
    res
      .status(200)
      .json(success("Email Sent Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.emailAllTransactionsToBuyers = async (req, res, next) => {
  try {
    const { transactionIds } = req.body;
    console.log(req.body);
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transaction id is required", res.statusCode));
    }
    for (const transactionId of transactionIds) {
      const transaction = await Transaction.findById(transactionId);
      await Transaction.findByIdAndUpdate(transactionId, {
        is_emailed: true,
      });
      await sendMail(transaction.buyer.email, "Freshtraders", "");
    }
    res
      .status(200)
      .json(success("Email Sent Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printTransaction = async (req, res, next) => {
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
        .json(error("Print type is required", res.statusCode));
    }
    res.status(200).json(success("Print Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printAllTransaction = async (req, res, next) => {
  try {
    const { transactionIds } = req.body;
    console.log(req.body);
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transaction id is required", res.statusCode));
    }
    for (const transactionId of transactionIds) {
      const transaction = await Transaction.findById(transactionId);
    }
    res.status(200).json(success("Print Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
