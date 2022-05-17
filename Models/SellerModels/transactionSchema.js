const mongoose = require("mongoose");
const Product = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: "sellerProduct",
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  consignment: {
    type: mongoose.Types.ObjectId,
    ref: "purchase",
  },
});
const TransactionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    salesman: {
      type: mongoose.Types.ObjectId,
      ref: "sellerSalesman",
      required: true,
    },
    station: {
      type: mongoose.Types.ObjectId,
      ref: "sellerStation",
      required: true,
    },
    ref: {
      type: String,
    },
    type: {
      type: String,
      enum: ["CASH", "CARD", "INVOICE", "DRAFT"],
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    product: [Product],
    is_emailed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PAID", "UNPAID"],
      default: "UNPAID",
    },
  },
  { timestamps: {} },
  { collection: "Transaction" }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
