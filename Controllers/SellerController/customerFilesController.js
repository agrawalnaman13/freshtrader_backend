const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
exports.getCustomerInfo = async (req, res, next) => {
  try {
    const buyer_data = await Buyer.findById(req.params.id);
    if (!buyer_data) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    const customer = await SellerPartnerBuyers.findOne({
      seller: req.seller._id,
      buyer: req.params.id,
    }).populate("buyer");
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

exports.setCustomerInfo = async () => {
  try {
    const partners = await SellerPartnerBuyers.find({ status: true });
    for (const partner of partners) {
      partner.opening = +partner.closing;
      partner.total = 0;
      partner.bought = 0;
      partner.credit = 0;
      partner.paid = 0;
      const overdues = await Transaction.find({
        status: "OVERDUE",
        buyer: partner.buyer,
        seller: partner.seller,
      });
      await SellerPartnerBuyers.findByIdAndUpdate(partner._id, {
        opening: partner.opening,
        total: partner.total,
        credit: partner.credit,
        bought: partner.bought,
        paid: partner.paid,
        overdue: overdues.length ? true : false,
      });
    }
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};

exports.getCustomerTransactions = async (req, res, next) => {
  try {
    const { buyerId, from, till, sortBy, filterBy } = req.body;
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
          salesman: 1,
          is_smcs: 1,
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
        $lookup: {
          localField: "salesman",
          foreignField: "_id",
          from: "sellerstaffs",
          as: "salesman",
        },
      },
      { $unwind: "$salesman" },
      {
        $addFields: {
          total_owed: { $subtract: ["$total", "$payment_received"] },
        },
      },
      {
        $match: {
          $and: [
            from
              ? {
                  $and: [
                    { year: { $gte: new Date(from).getFullYear() } },
                    { month: { $gte: new Date(from).getMonth() + 1 } },
                    { day: { $gte: new Date(from).getDate() } },
                  ],
                }
              : {},
            till
              ? {
                  $and: [
                    { year: { $lte: new Date(till).getFullYear() } },
                    { month: { $lte: new Date(till).getMonth() + 1 } },
                    { day: { $lte: new Date(till).getDate() } },
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
    transaction.payment_received += +payment;
    await transaction.save();
    const customer = await SellerPartnerBuyers.findOne({
      seller: req.seller._id,
      buyer: transaction.buyer,
    });
    if (customer) {
      customer.paid += +payment;
      customer.closing = customer.opening - customer.paid - customer.credit;
      await SellerPartnerBuyers.findOneAndUpdate(
        {
          seller: req.seller._id,
          buyer: transaction.buyer,
        },
        {
          paid: customer.paid,
          closing: customer.closing,
        }
      );
    }
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
