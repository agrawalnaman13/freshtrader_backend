const mongoose = require("mongoose");
const InventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "sellerProduct",
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    consignment: {
      type: mongoose.Types.ObjectId,
      ref: "purchase",
    },
    carry_over: {
      type: Number,
      default: 0,
    },
    purchase: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    void: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: {} },
  { collection: "inventory" }
);

const Inventory = mongoose.model("inventory", InventorySchema);

module.exports = Inventory;
