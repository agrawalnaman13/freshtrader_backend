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
const { checkABN } = require("./authController");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const Order = require("../../Models/BuyerModels/orderSchema");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const moment = require("moment");
const { getProductInventory } = require("./inventoryController");
const SellerStaff = require("../../Models/SellerModels/staffSchema");

exports.getBusinesses = async (req, res, next) => {
  try {
    const { search, smcs } = req.body;
    console.log(req.body);
    // if (!search) {
    //   return res
    //     .status(200)
    //     .json(error("Please provide search key", res.statusCode));
    // }
    const regexp = new RegExp("^" + search);
    const buyers = await SellerPartnerBuyers.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          status: true,
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
            search ? { "buyer.business_trading_name": regexp } : {},
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
    if (!checkABN(+abn)) {
      return res.status(200).json(error("Invalid ABN", res.statusCode));
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
    const buyer = await Buyer.findOne({
      email: email,
    });
    if (buyer) {
      return res
        .status(200)
        .json(error("Email is already registered", res.statusCode));
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

exports.getBusinessDetail = async (req, res, next) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    res
      .status(200)
      .json(success("Buyer Fetched Successfully", { buyer }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.checkBusinessOverdue = async (req, res, next) => {
  try {
    const buyer = await SellerPartnerBuyers.findOne({
      seller: req.seller._id,
      buyer: req.params.id,
    }).select("overdue");
    res
      .status(200)
      .json(success("Buyer Fetched Successfully", { buyer }, res.statusCode));
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
    const seller = await Wholeseller.findById(req.seller._id);
    const consignments = await Purchase.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          status: "ACTIVE",
        },
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.productId": { $eq: mongoose.Types.ObjectId(productId) },
          $and: [
            !seller.allow_overselling
              ? { "products.inv_on_hand": { $gt: 0 } }
              : {},
          ],
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
      orderId,
      print,
      make_non_smcs,
      cash_transaction_without_payment,
      email,
      prev_trans,
      transactionId,
    } = req.body;
    console.log(req.body);
    // if (!buyer) {
    //   return res.status(200).json(error("Buyer is required", res.statusCode));
    // }
    let buyer_data = {};
    if (buyer) buyer_data = await Buyer.findById(buyer);
    // if (!buyer_data) {
    //   return res.status(200).json(error("Invalid buyer id", res.statusCode));
    // }
    if (!salesman) {
      return res
        .status(200)
        .json(error("Salesman is required", res.statusCode));
    }
    const salesman_data = await SellerStaff.findById(salesman);
    if (!salesman_data) {
      return res.status(200).json(error("Invalid salesman id", res.statusCode));
    }
    // if (!station) {
    //   return res.status(200).json(error("Station is required", res.statusCode));
    // }
    // const station_data = await SellerStation.findById(station);
    // if (!station_data) {
    //   return res.status(200).json(error("Invalid station id", res.statusCode));
    // }
    if (!type) {
      return res
        .status(200)
        .json(error("Transaction type is required", res.statusCode));
    }
    if (
      !["CASH", "CARD", "INVOICE", "DRAFT INVOICE", "CREDIT NOTE"].includes(
        type
      )
    ) {
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
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(200).json(error("Invalid order id", res.statusCode));
      }
    }
    if (prev_trans) {
      if (!transactionId) {
        return res
          .status(200)
          .json(error("Transaction id is required", res.statusCode));
      }
    }
    const seller = await Wholeseller.findById(req.seller._id);
    if (!seller.allow_overselling) {
      for (const product of products) {
        const sellerProd = await SellerProduct.findById(product.productId);
        const inv = await getProductInventory(req.seller._id, sellerProd.type);
        if (inv < product.quantity) {
          return res
            .status(200)
            .json(error("Overselling is not allowed", res.statusCode));
        }
      }
    }
    let query = {
      seller: req.seller._id,
      type,
      total,
      products,
      salesman,
      status:
        type === "CARD" ||
        (type === "CASH" && !cash_transaction_without_payment)
          ? "PAID"
          : "UNPAID",
      payment_received:
        type === "CARD" ||
        (type === "CASH" && !cash_transaction_without_payment)
          ? total
          : 0,
      pallets,
      delivery_note,
      is_smcs: make_non_smcs ? false : buyer_data.is_smcs,
      is_emailed: email && type !== "DRAFT INVOICE" ? true : false,
    };
    if (type === "CREDIT NOTE") {
      query = {
        seller: req.seller._id,
        type,
        total,
        products,
        salesman,
        status: "",
        refund_type,
        pallets,
        delivery_note,
        is_smcs: make_non_smcs ? false : buyer_data.is_smcs,
        is_emailed: email && type !== "DRAFT INVOICE" ? true : false,
      };
    }
    if (station) query.station = station;
    if (orderId) query.orderId = orderId;
    if (buyer) query.buyer = buyer;
    let transaction;
    if (prev_trans && transactionId) {
      transaction = await Transaction.findByIdAndUpdate(transactionId, query);
    } else {
      transaction = await Transaction.create(query);
      const ref = String(transaction._id).slice(18, 24);
      transaction.ref = ref;
      await transaction.save();
      if (type !== "DRAFT INVOICE") {
        for (const product of products) {
          const consignment = await Purchase.findById(product.consignment);
          let sold = 0,
            voids = 0;
          consignment.products = consignment.products.map((p) => {
            console.log(p);
            if (String(p.productId) === String(product.productId)) {
              if (type === "CREDIT NOTE" && product.refund_type === "VOID") {
                p.sold -= product.quantity;
                p.void += product.quantity;
              } else if (
                type === "CREDIT NOTE" &&
                product.refund_type === "RETURN"
              ) {
                p.sold -= product.quantity;
              } else {
                p.sold += product.quantity;
              }
              p.sold_percentage = ((p.sold / p.received) * 100).toFixed(2);
              p.total_sales = (p.sold * p.average_sales_price).toFixed(2);
              p.inv_on_hand = (p.received - p.sold - p.void).toFixed(2);
              p.gross_profit = (
                p.total_sales -
                p.received * p.cost_per_unit
              ).toFixed(2);
              p.gross_profit_percentage = (
                (p.gross_profit / p.total_sales) *
                100
              ).toFixed(2);
              sold = p.sold.toFixed(2);
              voids = p.void.toFixed(2);
            }
            return p;
          });
          await consignment.save();
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
                    ? (+inv.sold - +product.quantity).toFixed(2)
                    : (+inv.sold + +product.quantity).toFixed(2),
                void: +voids,
              }
            );
          }
          if ((type !== "CREDIT NOTE" || refund_type !== "VOID") && buyer) {
            const myPallets = await SellerPallets.findOne({
              seller: req.seller._id,
              taken_by: buyer,
            });
            if (!myPallets) {
              await SellerPallets.create({
                seller: req.seller._id,
                taken_by: buyer,
                pallets_taken: +pallets,
              });
            } else {
              await SellerPallets.findOneAndUpdate(
                {
                  seller: req.seller._id,
                  taken_by: buyer,
                },
                {
                  pallets_taken:
                    type === "CREDIT NOTE" && refund_type === "RETURN"
                      ? myPallets.pallets_taken - +pallets
                      : myPallets.pallets_taken + +pallets,
                }
              );
            }
            const isPallets = await SellerPallets.findOne({
              seller: req.seller._id,
              pallets_taken: 0,
              pallets_received: 0,
            });
            if (!isPallets) {
              await SellerPallets.create({
                seller: req.seller._id,
                pallets_on_hand: +pallets,
                pallets_taken: 0,
                pallets_received: 0,
              });
            } else {
              await SellerPallets.findOneAndUpdate(
                {
                  seller: req.seller._id,
                  pallets_taken: 0,
                  pallets_received: 0,
                },
                {
                  pallets_on_hand: isPallets.pallets_on_hand - +pallets,
                }
              );
            }
            if (orderId && refund_type !== "RETURN") {
              await Order.findByIdAndUpdate(orderId, {
                status: "COMPLETED",
              });
            }
          }
          if (buyer) {
            const customer = await SellerPartnerBuyers.findOne({
              seller: req.seller._id,
              buyer: buyer,
            });
            if (customer) {
              customer.total += +total;
              customer.opening += type !== "CREDIT NOTE" ? +total : 0;
              customer.credit += type === "CREDIT NOTE" ? +total : 0;
              customer.bought += +total;
              customer.paid +=
                type === "CARD" ||
                (type === "CASH" && !cash_transaction_without_payment)
                  ? +total
                  : 0;
              customer.closing =
                customer.opening - customer.paid - customer.credit;
              await SellerPartnerBuyers.findOneAndUpdate(
                {
                  seller: req.seller._id,
                  buyer: buyer,
                },
                {
                  opening: customer.opening,
                  total: customer.total,
                  credit: customer.credit,
                  bought: customer.bought,
                  paid: customer.paid,
                  closing: customer.closing,
                }
              );
            }
          }
        }
        for (const product of products) {
          product.productId = await SellerProduct.findById(
            product.productId
          ).populate(["variety", "type", "units"]);
          product.consignment = await Purchase.findById(
            product.consignment
          ).populate("supplier");
        }
        const status =
          type === "CARD" ||
          (type === "CASH" && !cash_transaction_without_payment)
            ? "PAID"
            : "UNPAID";
        const quantity = products.reduce(function (a, b) {
          return a + b.quantity;
        }, 0);
        const data = {
          logo: `${process.env.BASE_URL}/${seller.thermal_receipt_invoice_logo}`,
          products: products,
          seller: seller,
          buyer: buyer_data,
          ref: "",
          payment: type,
          date: {
            day: moment(Date.now()).format("dddd"),
            date: moment(Date.now()).format("DD/MM/YYYY"),
            time: moment(Date.now()).format("hh:mm"),
            a: moment(Date.now()).format("A"),
          },
          salesmen: salesman_data,
          pallets: pallets,
          delivery_note: delivery_note,
          total: total,
          quantity: quantity,
          paid: status === "PAID" ? total : 0,
          refund_type: refund_type,
        };
        if (
          (print === "INVOICE" || print === "BOTH") &&
          type !== "CREDIT NOTE"
        ) {
          const dirPath = path.join(
            __dirname.replace("SellerController", "templates"),
            "/invoice.html"
          );
          const template = fs.readFileSync(dirPath, "utf8");
          var html = ejs.render(template, { data: data });
          var options = { format: "Letter" };
          pdf
            .create(html, options)
            .toFile(
              `./public/sellers/${req.seller._id}/transaction${Date.now()}.pdf`,
              function (err, res1) {
                if (err) return console.log(err);
              }
            );
        }
        if (
          (print === "DELIVERY DOCKET" || print === "BOTH") &&
          type !== "CREDIT NOTE"
        ) {
          const dirPath = path.join(
            __dirname.replace("SellerController", "templates"),
            "/delivery_docket.html"
          );
          const template = fs.readFileSync(dirPath, "utf8");
          var html = ejs.render(template, { data: data });
          var options = { format: "Letter" };
          pdf
            .create(html, options)
            .toFile(
              `./public/sellers/${req.seller._id}/transaction${Date.now()}.pdf`,
              function (err, res1) {
                if (err) return console.log(err);
              }
            );
        }
        if (type === "CREDIT NOTE") {
          const dirPath = path.join(
            __dirname.replace("SellerController", "templates"),
            "/credit_note.html"
          );
          const template = fs.readFileSync(dirPath, "utf8");
          var html = ejs.render(template, { data: data });
          var options = { format: "Letter" };
          pdf
            .create(html, options)
            .toFile(
              `./public/sellers/${req.seller._id}/transaction${Date.now()}.pdf`,
              function (err, res1) {
                if (err) return console.log(err);
              }
            );
        }
      }
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

exports.undoTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    console.log(req.body);
    if (!transactionId) {
      return res
        .status(200)
        .json(error("Transaction Id is required", res.statusCode));
    }
    const transaction = await Transaction.findById(transaction);
    if (!transaction) {
      return res
        .status(200)
        .json(error("Invalid transaction id", res.statusCode));
    }
    for (const product of transaction.products) {
      const consignment = await Purchase.findById(product.consignment);
      let sold = 0,
        voids = 0;
      consignment.products = consignment.products.map((p) => {
        console.log(p);
        if (String(p.productId) === String(product.productId)) {
          if (
            transaction.type === "CREDIT NOTE" &&
            product.refund_type === "VOID"
          ) {
            p.sold += product.quantity;
            p.void -= product.quantity;
          } else if (
            transaction.type === "CREDIT NOTE" &&
            product.refund_type === "RETURN"
          ) {
            p.sold += product.quantity;
          } else {
            p.sold -= product.quantity;
          }
          p.sold_percentage = ((p.sold / p.received) * 100).toFixed(2);
          p.total_sales = (p.sold * p.average_sales_price).toFixed(2);
          p.inv_on_hand = (p.received - p.sold - p.void).toFixed(2);
          p.gross_profit = (
            p.total_sales -
            p.received * p.cost_per_unit
          ).toFixed(2);
          p.gross_profit_percentage = (
            (p.gross_profit / p.total_sales) *
            100
          ).toFixed(2);
          sold = p.sold;
          voids = p.void;
        }
        return p;
      });
      await consignment.save();
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
                ? (+inv.sold + +product.quantity).toFixed(2)
                : (+inv.sold - +product.quantity).toFixed(2),
            void: +voids,
          }
        );
      }
      if (
        transaction.type !== "CREDIT NOTE" ||
        transaction.refund_type !== "VOID"
      ) {
        const myPallets = await SellerPallets.findOne({
          seller: req.seller._id,
          taken_by: transaction.buyer,
        });
        if (!myPallets) {
          await SellerPallets.create({
            seller: req.seller._id,
            taken_by: transaction.buyer,
            pallets_taken: +transaction.pallets,
          });
        } else {
          await SellerPallets.findOneAndUpdate(
            {
              seller: req.seller._id,
              taken_by: transaction.buyer,
            },
            {
              pallets_taken:
                transaction.type === "CREDIT NOTE" &&
                transaction.refund_type === "RETURN"
                  ? myPallets.pallets_taken + +transaction.pallets
                  : myPallets.pallets_taken - +transaction.pallets,
            }
          );
        }
        if (transaction.orderId && transaction.refund_type !== "RETURN") {
          await Order.findByIdAndUpdate(transaction.orderId, {
            status: "CONFIRMED",
          });
        }
      }
      const customer = await SellerPartnerBuyers.findOne({
        seller: req.seller._id,
        buyer: transaction.buyer,
      });
      if (customer) {
        customer.total += +transaction.total;
        customer.opening +=
          transaction.type !== "CREDIT NOTE" ? +transaction.total : 0;
        customer.credit +=
          transaction.type === "CREDIT NOTE" ? +transaction.total : 0;
        customer.bought += +total;
        customer.paid += transaction.status === "PAID" ? +transaction.total : 0;
        customer.closing = customer.opening - customer.paid - customer.credit;
        await SellerPartnerBuyers.findOneAndUpdate(
          {
            seller: req.seller._id,
            buyer: transaction.buyer,
          },
          {
            opening: customer.opening,
            total: customer.total,
            credit: customer.credit,
            bought: customer.bought,
            paid: customer.paid,
            closing: customer.closing,
          }
        );
      }
    }
    res
      .status(200)
      .json(
        success(
          "Transaction removed Successfully",
          { transaction },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
