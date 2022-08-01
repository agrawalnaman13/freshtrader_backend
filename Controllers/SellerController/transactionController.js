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
const { getInventoryCode, getProductGST } = require("./productController");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
exports.getTransactions = async (req, res, next) => {
  try {
    const { from, till, sortBy, filterBy } = req.body;
    console.log(req.body);
    const transactions = await Transaction.aggregate([
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
          pipeline: [{ $match: { buyer: { $exist: true } } }],
        },
      },
      { $unwind: "$buyer" },
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
            from ? { createdAt: { $gte: new Date(from) } } : {},
            till ? { createdAt: { $lte: new Date(till) } } : {},
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
      product.consignment = await Purchase.findById(product.consignment)
        .populate("supplier")
        .select(["supplier"]);
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
      if (transaction.type !== "DRAFT INVOICE") {
        await Transaction.findByIdAndUpdate(transactionId, {
          status: status,
          payment_received:
            status === "PAID"
              ? transaction.total
              : transaction.payment_received,
        });
      }
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
          p.sold_percentage = +((p.sold / p.received) * 100).toFixed(2);
          p.total_sales = +(p.sold * p.average_sales_price).toFixed(2);
          p.inv_on_hand = +(p.received - p.sold - p.void).toFixed(2);
          p.gross_profit = +(
            p.total_sales -
            p.received * p.cost_per_unit
          ).toFixed(2);
          p.gross_profit_percentage = +(
            (p.gross_profit / p.total_sales) *
            100
          ).toFixed(2);
          sold = +p.sold.toFixed(2);
          voids = +p.void.toFixed(2);
        }
        return p;
      });
      const inv = await Inventory.findOne({
        seller: req.seller._id,
        productId: product.productId,
        consignment: product.consignment,
      });
      if (inv) {
        await Inventory.findOneAndUpdate(
          {
            seller: req.seller._id,
            productId: product.productId,
            consignment: product.consignment,
          },
          {
            total_sold: +sold,
            sold:
              transaction.type === "CREDIT NOTE"
                ? +(+inv.sold - +product.quantity).toFixed(2)
                : +(+inv.sold + +product.quantity).toFixed(2),
            void: +voids,
          }
        );
      }
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
    const { transactionIds, type } = req.body;
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
          $and: [type ? { type: type } : {}],
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
    const seller = await Wholeseller.findById(req.seller._id).select([
      "csv",
      "sales_invoice_due_date",
      "smcs_invoice_account_code",
      "invoice_account_code",
      "cash_account_code",
      "card_account_code",
      "credit_note_account_code",
    ]);
    let fields = [];
    let response = [];
    for (const transaction of transactions) {
      const due_date = moment(transaction.createdAt, "DD-MM-YYYY").add(
        +seller.sales_invoice_due_date,
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
        EmailAddress: transaction.buyer.email,
        POAddressLine1: transaction.buyer.address_line1,
        POCity: transaction.buyer.city,
        POPostalCode: transaction.buyer.postal_code,
        POCountry: transaction.buyer.country,
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
            ? seller.card_account_code
            : transaction.type === "CASH"
            ? seller.cash_account_code
            : transaction.type === "INVOICE" && transaction.is_smcs
            ? seller.smcs_invoice_account_code
            : transaction.type === "INVOICE"
            ? seller.invoice_account_code
            : seller.credit_note_account_code,
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
    if (seller.csv) {
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
      if (transaction.type !== "DRAFT INVOICE") {
        await Transaction.findByIdAndUpdate(transactionId, {
          is_emailed: true,
        });
        await sendMail(transaction.buyer.email, "Freshtraders", "");
      }
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
    const { transactionId, stationId } = req.body;
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
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station Id", res.statusCode));
    }
    const station = await SellerStation.findById(stationId);
    if (!station) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    if (!station.a4_printer.email && !station.a4_printer.local) {
      return res
        .status(200)
        .json(error("No A4 Printer added in selected station", res.statusCode));
    }
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    const data = transaction;
    const html = ejs.render(template, { data: data });
    const options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/smcs_report.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
        }
      );
    if (station.a4_printer.local) {
      res.status(200).json(
        success(
          "success",
          {
            file: `${process.env.BASE_URL}/Sellers/${req.seller._id}/smcs_report.pdf`,
          },
          res.statusCode
        )
      );
    } else {
      await sendMail(station.a4_printer.email, "A4 Invoice", "");
      res
        .status(200)
        .json(success("A4 Invoice Printed Successfully", {}, res.statusCode));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printAllTransaction = async (req, res, next) => {
  try {
    const { transactionIds, stationId } = req.body;
    console.log(req.body);
    if (!transactionIds.length) {
      return res
        .status(200)
        .json(error("Transaction id is required", res.statusCode));
    }
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station Id", res.statusCode));
    }
    const station = await SellerStation.findById(stationId);
    if (!station) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    if (!station.a4_printer.email && !station.a4_printer.local) {
      return res
        .status(200)
        .json(error("No A4 Printer added in selected station", res.statusCode));
    }
    let files = [];
    for (const transactionId of transactionIds) {
      const transaction = await Transaction.findById(transactionId);
      const dirPath = path.join(
        __dirname.replace("SellerController", "templates"),
        "/smcs_report.html"
      );
      const template = fs.readFileSync(dirPath, "utf8");
      const data = transaction;
      const html = ejs.render(template, { data: data });
      const options = { format: "Letter" };
      pdf
        .create(html, options)
        .toFile(
          `./public/sellers/${req.seller._id}/transaction${transaction._id}.pdf`,
          function (err, res1) {
            if (err) return console.log(err);
            console.log(res1);
          }
        );
      files.push(
        `${process.env.BASE_URL}/Sellers/${req.seller._id}/transaction${transaction._id}.pdf`
      );
    }
    if (station.a4_printer.local) {
      res.status(200).json(success("success", { files }, res.statusCode));
    } else {
      await sendMail(station.a4_printer.email, "A4 Invoice", "");
      res
        .status(200)
        .json(success("A4 Invoice Printed Successfully", {}, res.statusCode));
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
