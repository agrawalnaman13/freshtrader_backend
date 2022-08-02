const mongoose = require("mongoose");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const moment = require("moment");
const { parse } = require("json2csv");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const {
  getInventoryCode,
  getProductGST,
} = require("../SellerController/productController");
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
          type: { $ne: "DRAFT INVOICE" },
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
                    { year: new Date(from).getFullYear() },
                    { month: new Date(from).getMonth() + 1 },
                    { day: new Date(from).getDate() },
                  ],
                }
              : {},
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
            ? { "seller.business_trading_name": 1 }
            : sortBy === 5
            ? { "seller.business_trading_name": -1 }
            : sortBy === 6
            ? { total: -1 }
            : sortBy === 7
            ? { total: 1 }
            : { createdAt: -1 },
      },
    ]);
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
    const { transactionIds, report_type, type } = req.body;
    const buyer = await Buyer.findById(req.buyer._id).populate("plan");
    if (!buyer.plan) {
      return res
        .status(200)
        .json(
          error("Please purchase Subscription plan to reorder", res.statusCode)
        );
    } else if (buyer.plan.plan_name === "Free") {
      return res
        .status(200)
        .json(
          error("Please purchase Subscription plan to reorder", res.statusCode)
        );
    }
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transaction ids are required", res.statusCode));
    }
    if (!report_type) {
      return res
        .status(200)
        .json(error("Report Type is required", res.statusCode));
    }
    const newTransactionIds = transactionIds.map((id) => {
      return mongoose.Types.ObjectId(id);
    });
    const transactions = await Transaction.aggregate([
      {
        $match: {
          _id: { $in: newTransactionIds },
          $and: [type ? { type: type } : {}],
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
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
    ]);
    if (report_type === 1) {
      const dirPath = path.join(
        __dirname.replace("BuyerController", "templates"),
        "/buyersTransaction.html"
      );
      const template = fs.readFileSync(dirPath, "utf8");
      for (const transaction of transactions) {
        transaction.createdAt = moment(transaction.createdAt).format("LLL");
      }
      var data = {
        css: `${process.env.BASE_URL}/css/style1.css`,
        logo: `${process.env.BASE_URL}/logo.png`,
        list: transactions,
      };
      var html = ejs.render(template, { data: data });
      var options = { format: "Letter" };
      pdf
        .create(html, options)
        .toFile(
          `./public/buyers/${req.buyer._id}/buyersTransaction.pdf`,
          function (err, res1) {
            if (err) return console.log(err);
            console.log(res1);
            res.download(res1.filename);
          }
        );
    } else {
      let fields = [];
      let response = [];
      for (const transaction of transactions) {
        const due_date = moment(transaction.createdAt, "DD-MM-YYYY").add(
          +transaction.seller.sales_invoice_due_date,
          "days"
        );
        const inventory_code = await getInventoryCode(transaction.products);
        const tax = await getProductGST(transaction.products);
        response.push({
          TransactionType: transaction.type,
          TransactionID_Or_InvoiceNumber: transaction.ref,
          TransactionID: transaction.ref,
          InvoiceNumber: transaction.ref,
          CustomerName: transaction.buyer.business_trading_name,
          SMCSCode: transaction.buyer.smcs_code,
          EmailAddress: transaction.seller.email,
          POAddressLine1: transaction.seller.address_line1,
          POCity: transaction.seller.city,
          POPostalCode: transaction.seller.postal_code,
          POCountry: transaction.seller.country,
          Time: moment(transaction.createdAt).format("hh:mm A"),
          Date: moment(transaction.createdAt).format("LL"),
          DueDate:
            transaction.status !== "PAID" ? moment(due_date).format("LL") : "",
          InventoryItemCode: inventory_code.join(", "),
          Description: transaction.delivery_note,
          Quantity: transaction.products.length,
          UnitAmount:
            transaction.type === "CREDIT NOTE"
              ? `-$${transaction.total}`
              : `$${transaction.total}`,
          Discount: "$0",
          GrossTotal:
            transaction.type === "CREDIT NOTE"
              ? `-$${transaction.total}`
              : `$${transaction.total}`,
          CardFee: "",
          TotalTax: `$${tax}`,
          NetTotal:
            transaction.type === "CREDIT NOTE"
              ? `-$${transaction.total}`
              : `$${transaction.total}`,
          AccountCode:
            transaction.type === "CARD"
              ? transaction.seller.card_account_code
              : transaction.type === "CASH"
              ? transaction.seller.cash_account_code
              : transaction.type === "INVOICE" && transaction.is_smcs
              ? transaction.seller.smcs_invoice_account_code
              : transaction.type === "INVOICE"
              ? transaction.seller.invoice_account_code
              : transaction.seller.credit_note_account_code,
          TaxType: tax ? "GST" : "",
          TransactionStatus: transaction.status,
          StaffName: transaction.salesman.username,
          CardBrand: "",
          PaymentID: "",
          PANSuffix: "",
          DeviceName: "",
          DeviceNickname: "",
          CardEntryMethods: "",
          CardFeePercentageRate: "",
          FeeFixedRate: "",
        });
      }
      if (buyer.csv) {
        if (type === "CARD") {
          fields = [
            "TransactionType",
            "TransactionID",
            "CustomerName",
            "SMCSCode",
            "EmailAddress",
            "POAddressLine1",
            "POCity",
            "POPostalCode",
            "POCountry",
            "Time",
            "Date",
            "InventoryItemCode",
            "Description",
            "Quantity",
            "UnitAmount",
            "Discount",
            "GrossTotal",
            "CardFee",
            "TotalTax",
            "NetTotal",
            "AccountCode",
            "TaxType",
            "TransactionStatus",
            "StaffName",
            "CardBrand",
            "PaymentID",
            "PANSuffix",
            "DeviceName",
            "DeviceNickname",
            "CardEntryMethods",
            "CardFeePercentageRate",
            "FeeFixedRate",
          ];
        } else if (type === "CASH") {
          fields = [
            "TransactionType",
            "TransactionID",
            "CustomerName",
            "SMCSCode",
            "EmailAddress",
            "POAddressLine1",
            "POCity",
            "POPostalCode",
            "POCountry",
            "Time",
            "Date",
            "InventoryItemCode",
            "Description",
            "Quantity",
            "UnitAmount",
            "Discount",
            "TotalTax",
            "NetTotal",
            "AccountCode",
            "TaxType",
            "TransactionStatus",
            "StaffName",
          ];
        } else if (type === "INVOICE") {
          fields = [
            "TransactionType",
            "InvoiceNumber",
            "CustomerName",
            "SMCSCode",
            "EmailAddress",
            "POAddressLine1",
            "POCity",
            "POPostalCode",
            "POCountry",
            "Time",
            "Date",
            "DueDate",
            "InventoryItemCode",
            "Description",
            "Quantity",
            "UnitAmount",
            "Discount",
            "TotalTax",
            "NetTotal",
            "AccountCode",
            "TaxType",
            "TransactionStatus",
            "StaffName",
          ];
        } else if (type === "CREDIT NOTE") {
          fields = [
            "TransactionType",
            "TransactionID",
            "CustomerName",
            "SMCSCode",
            "EmailAddress",
            "POAddressLine1",
            "POCity",
            "POPostalCode",
            "POCountry",
            "Time",
            "Date",
            "DueDate",
            "InventoryItemCode",
            "Description",
            "Quantity",
            "UnitAmount",
            "Discount",
            "TotalTax",
            "NetTotal",
            "AccountCode",
            "TaxType",
            "TransactionStatus",
            "StaffName",
          ];
        } else {
          fields = [
            "TransactionType",
            "TransactionID_Or_InvoiceNumber",
            "CustomerName",
            "SMCSCode",
            "EmailAddress",
            "POAddressLine1",
            "POCity",
            "POPostalCode",
            "POCountry",
            "Time",
            "Date",
            "DueDate",
            "InventoryItemCode",
            "Description",
            "Quantity",
            "UnitAmount",
            "Discount",
            "GrossTotal",
            "CardFee",
            "TotalTax",
            "NetTotal",
            "AccountCode",
            "TaxType",
            "TransactionStatus",
            "StaffName",
            "CardBrand",
            "PaymentID",
            "PANSuffix",
            "DeviceName",
            "DeviceNickname",
            "CardEntryMethods",
            "CardFeePercentageRate",
            "FeeFixedRate",
          ];
        }
      }
      const opts = { fields };
      const csv = parse(response, opts);
      return res.status(200).send(csv);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const balance = await SellerPartnerBuyers.find({
      buyer: req.buyer._id,
    }).populate("seller");
    res
      .status(200)
      .json(
        success("Balance fetched Successfully", { balance }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
