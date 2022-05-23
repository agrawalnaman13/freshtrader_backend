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
  },
  { timestamps: {} },
  { collection: "inventory" }
);

const Inventory = mongoose.model("inventory", InventorySchema);

module.exports = Inventory;
