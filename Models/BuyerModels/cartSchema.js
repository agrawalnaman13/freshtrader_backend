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
  grade: {
    type: String,
    required: true,
  },
  consignment: {
    type: mongoose.Types.ObjectId,
    ref: "purchase",
  },
});
const CartSchema = new mongoose.Schema(
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
  },
  { timestamps: {} },
  { collection: "cart" }
);

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
