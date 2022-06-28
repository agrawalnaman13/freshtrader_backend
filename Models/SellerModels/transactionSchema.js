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
  refund_type: {
    type: String,
    enum: ["RETURN", "VOID", ""],
    default: "",
  },
});
const TransactionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
      required: false,
      default: "",
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    salesman: {
      type: mongoose.Types.ObjectId,
      ref: "sellerStaff",
      required: true,
    },
    station: {
      type: mongoose.Types.ObjectId,
      ref: "sellerStation",
      required: false,
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
    products: [Product],
    is_emailed: {
      type: Boolean,
      default: false,
    },
    is_smcs: {
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
    pallets: {
      type: Number,
      required: false,
      default: 0,
    },
    delivery_note: {
      type: String,
      required: false,
    },
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "order",
    },
  },
  { timestamps: {} },
  { collection: "Transaction" }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
