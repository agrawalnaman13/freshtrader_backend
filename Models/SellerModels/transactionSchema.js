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
      enum: ["CASH", "CARD", "INVOICE", "DRAFT", "CREDIT NOTE"],
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    payment_received: {
      type: Number,
      required: true,
      default: 0,
    },
    product: [Product],
    is_emailed: {
      type: Boolean,
      default: false,
    },
    smcs_notified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "OVERDUE", ""],
      default: "UNPAID",
    },
    refund_type: {
      type: String,
      enum: ["RETURN", "VOID", ""],
      default: "",
    },
    pallets: {
      type: Number,
      required: false,
      default: 0,
    },
    delivery_note: {
      type: String,
      required: false,
    },
  },
  { timestamps: {} },
  { collection: "Transaction" }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
