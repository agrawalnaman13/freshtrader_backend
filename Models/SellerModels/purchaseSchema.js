const mongoose = require("mongoose");
const Product = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "sellerProduct",
    },
    consign: {
      type: String,
    },
    advised: {
      type: Number,
      default: 0,
    },
    received: {
      type: Number,
      default: 0,
    },
    waste: {
      type: Number,
      default: 0,
    },
    graded: {
      type: Number,
      default: 0,
    },
    cost_per_unit: {
      type: Number,
      default: 0,
    },
    total_cost: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    sold_percentage: {
      type: Number,
      default: 0,
    },
    average_sales_price: {
      type: Number,
      default: 0,
    },
    total_sales: {
      type: Number,
      default: 0,
    },
    void: {
      type: Number,
      default: 0,
    },
    inv_on_hand: {
      type: Number,
      default: 0,
    },
    gross_profit: {
      type: Number,
      default: 0,
    },
    gross_profit_percentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const PurchaseSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Types.ObjectId,
      ref: "sellerSupplier",
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
    co_op_agent: {
      type: Boolean,
      required: true,
    },
    consign: {
      type: String,
      required: true,
    },
    con_id: {
      type: String,
      required: false,
    },
    consign_pallets: {
      type: Number,
      required: true,
    },
    consign_notes: {
      type: String,
      required: true,
    },
    grading: {
      type: String,
      enum: ["None", "Internal", "External"],
      required: true,
    },
    grader_name: {
      type: String,
      required: true,
    },
    documents_received: {
      type: Boolean,
      required: true,
    },
    purchase: {
      type: String,
      required: true,
      enum: ["CASH", "SMCS"],
    },
    products: [Product],
    status: {
      type: String,
      enum: ["COMPLETE", "ACTIVE", "ON HOLD", "AWAITING DELIVERY"],
      required: false,
    },
    completion_date: {
      type: Date,
      required: false,
    },
  },
  { timestamps: {} },
  { collection: "purchase" }
);

const Purchase = mongoose.model("purchase", PurchaseSchema);

module.exports = Purchase;
