const mongoose = require("mongoose");

const SellerProductSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    variety: {
      type: mongoose.Types.ObjectId,
      ref: "productVariety",
      required: true,
    },
    type: {
      type: mongoose.Types.ObjectId,
      ref: "productType",
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    add_gst: {
      type: Boolean,
      required: true,
      default: false,
    },
    available_on_order_app: {
      type: Boolean,
      default: true,
    },
    suppliers: [
      {
        type: mongoose.Types.ObjectId,
        ref: "sellerSupplier",
      },
    ],
    price: {
      type: Array,
      default: [],
    },
    grades: {
      type: Array,
      default: [],
    },
    inventory_code: {
      type: Array,
      default: [],
    },
    units: {
      type: mongoose.Types.ObjectId,
      ref: "unit",
    },
  },
  { timestamps: {} },
  { collection: "sellerProduct" }
);

const SellerProduct = mongoose.model("sellerProduct", SellerProductSchema);

module.exports = SellerProduct;
