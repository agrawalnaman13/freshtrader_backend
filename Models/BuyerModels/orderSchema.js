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
  consignment: {
    type: mongoose.Types.ObjectId,
    ref: "purchase",
  },
});
const OrderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Types.ObjectId,
      ref: "buyer",
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    product: [Product],
    pick_up_date: {
      type: Date,
      required: false,
    },
    pick_up_time: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    payment: {
      type: String,
      enum: ["SMCS", "INVOICE", "CASH", "CARD"],
      required: true,
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "PENDING", "CANCELED", "COUNTER"],
      default: "PENDING",
    },
  },
  { timestamps: {} },
  { collection: "order" }
);

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
