const mongoose = require("mongoose");
const Product = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: "sellerProduct",
  },
  unit: {
    type: mongoose.Types.ObjectId,
    ref: "unit",
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
    quantity: {
      type: Number,
      default: true,
    },
    pick_up_date: {
      type: Date,
      default: false,
    },
    pick_up_time: {
      type: String,
      default: false,
    },
    notes: {
      type: String,
      default: false,
    },
    payment: {
      type: String,
      enum: ["SMCS", "INVOICE", "CASH", "CARD"],
      default: false,
    },
  },
  { timestamps: {} },
  { collection: "order" }
);

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
