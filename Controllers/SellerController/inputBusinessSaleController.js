const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const SellerSalesman = require("../../Models/SellerModels/sellerSalesmanSchema");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const printer = require("pdf-to-printer");
const path = require("path");
exports.getBusinesses = async (req, res, next) => {
  try {
    const { search, smcs } = req.body;
    console.log(req.body);
    if (!search) {
      return res
        .status(200)
        .json(error("Please provide search key", res.statusCode));
    }
    const regexp = new RegExp("^" + search);
    const buyers = await SellerPartnerBuyers.aggregate([
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
          $and: [
            { "buyer.business_trading_name": regexp },
            smcs === true ? { "buyer.is_smcs": true } : {},
            smcs === false ? { "buyer.is_smcs": false } : {},
          ],
        },
      },
    ]);
    // const dirPath = path.join(
    //   __dirname.replace("SellerController", "templates"),
    //   "/smcs_report.pdf"
    // );
    // await printer.print(dirPath, {
    //   printer: "thermal",
    // });
    res
      .status(200)
      .json(success("Buyers Fetched Successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addNewBusiness = async (req, res, next) => {
  try {
    const {
      business_trading_name,
      phone_number,
      email,
      abn,
      entity_name,
      address,
      is_smcs,
      market_seller,
      smcs_code,
    } = req.body;
    console.log(req.body);
    if (!business_trading_name) {
      return res
        .status(200)
        .json(error("Please provide business trading name", res.statusCode));
    }
    if (!phone_number) {
      return res
        .status(200)
        .json(error("Please provide phone number", res.statusCode));
    }
    if (!email) {
      return res
        .status(200)
        .json(error("Please provide email", res.statusCode));
    }
    if (!validator.isEmail(email))
      return res.status(200).json(error("Invalid Email", res.statusCode));
    if (!abn) {
      return res.status(200).json(error("Please provide abn", res.statusCode));
    }
    if (!entity_name) {
      return res
        .status(200)
        .json(error("Please provide entity name", res.statusCode));
    }
    if (!address) {
      return res
        .status(200)
        .json(error("Please provide address", res.statusCode));
    }
    if (is_smcs === undefined || is_smcs === "") {
      return res
        .status(200)
        .json(error("Is this business part of SMCS?", res.statusCode));
    }
    if (market_seller === undefined || market_seller === "") {
      return res
        .status(200)
        .json(error("Is this business a market seller?", res.statusCode));
    }
    if (is_smcs === true) {
      if (!smcs_code) {
        return res
          .status(200)
          .json(error("Please provide smcs code", res.statusCode));
      }
    }
    const business = await Buyer.create({
      business_trading_name: business_trading_name,
      abn: abn,
      entity_name: entity_name,
      address: address,
      email: email,
      phone_number: phone_number,
      is_smcs: is_smcs,
      market_seller: market_seller,
      smcs_code: smcs_code,
    });
    await SellerPartnerBuyers.create({
      buyer: business._id,
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(
        success("Business Added Successfully", { business }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getProductConsignments = async (req, res, next) => {
  try {
    const { productId } = req.body;
    console.log(req.body);
    if (!productId) {
      return res
        .status(200)
        .json(error("product id is required", res.statusCode));
    }
    const product = await SellerProduct.findById(productId);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    const consignments = await Purchase.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
        },
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.productId": { $eq: mongoose.Types.ObjectId(productId) },
        },
      },
      {
        $lookup: {
          localField: "supplier",
          foreignField: "_id",
          from: "sellersuppliers",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    res
      .status(200)
      .json(
        success(
          "Consignment fetched Successfully",
          { consignments },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.processTransaction = async (req, res, next) => {
  try {
    const {
      buyer,
      type,
      total,
      products,
      salesman,
      station,
      refund_type,
      pallets,
      delivery_note,
    } = req.body;
    console.log(req.body);
    if (!buyer) {
      return res.status(200).json(error("Buyer is required", res.statusCode));
    }
    const buyer_data = await Buyer.findById(buyer);
    if (!buyer_data) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    if (!salesman) {
      return res
        .status(200)
        .json(error("Salesman is required", res.statusCode));
    }
    const salesman_data = await SellerSalesman.findById(salesman);
    if (!salesman_data) {
      return res.status(200).json(error("Invalid salesman id", res.statusCode));
    }
    if (!station) {
      return res.status(200).json(error("Station is required", res.statusCode));
    }
    const station_data = await SellerStation.findById(station);
    if (!station_data) {
      return res.status(200).json(error("Invalid station id", res.statusCode));
    }
    if (!type) {
      return res
        .status(200)
        .json(error("Transaction type is required", res.statusCode));
    }
    if (!["CASH", "CARD", "INVOICE", "DRAFT", "CREDIT NOTE"].includes(type)) {
      return res
        .status(200)
        .json(error("Invalid transaction type", res.statusCode));
    }
    if (!total) {
      return res.status(200).json(error("Total is required", res.statusCode));
    }
    if (!products.length) {
      return res.status(200).json(error("Product is required", res.statusCode));
    }
    if (type === "CREDIT NOTE") {
      if (!refund_type) {
        return res
          .status(200)
          .json(error("Refund type is required", res.statusCode));
      }
      if (!["RETURN", "VOID"].includes(refund_type)) {
        return res
          .status(200)
          .json(error("Invalid refund type", res.statusCode));
      }
    }
    let query = {
      seller: req.seller._id,
      buyer,
      type,
      total,
      products,
      salesman,
      station,
      status: type === "CARD" || type === "CASH" ? "PAID" : "UNPAID",
      payment_received: type === "CARD" || type === "CASH" ? total : 0,
      pallets,
      delivery_note,
    };
    if (type === "CREDIT NOTE") {
      query = {
        seller: req.seller._id,
        buyer,
        type,
        total,
        products,
        salesman,
        station,
        status: "",
        refund_type,
        pallets,
        delivery_note,
      };
    }
    const transaction = await Transaction.create(query);
    const ref = String(transaction._id).slice(18, 24);
    transaction.ref = ref;
    await transaction.save();
    for (const product of products) {
      const consignment = await Purchase.findById(product.consignment);
      let sold = 0,
        voids = 0;
      consignment.products = consignment.products.map((p) => {
        if (String(p.productId) === String(product._id)) {
          if (type === "CREDIT NOTE" && refund_type === "VOID") {
            p.sold -= product.quantity;
            p.void += product.quantity;
          } else if (type === "CREDIT NOTE" && refund_type === "RETURN") {
            p.sold -= product.quantity;
          } else {
            p.sold += product.quantity;
          }
          p.sold_percentage = (p.sold / p.received) * 100;
          p.sales = p.sold * p.average_sales_price;
          p.inv_on_hand = p.received - p.sold - p.void;
          p.gross_profit = p.received * p.cost_per_unit - p.sales;
          p.gross_profit_percentage = (p.gross_profit / p.sales) * 100;
          sold = p.sold;
          voids = p.void;
        }
        return p;
      });
      await consignment.save();
      await Inventory.findOneAndUpdate(
        {
          seller: req.seller._id,
          productId: product._id,
          consignment: product.consignment,
        },
        {
          purchase: +product.received,
          sold: +sold,
          void: +voids,
        }
      );
    }
    res
      .status(200)
      .json(
        success(
          "Transaction processed Successfully",
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
