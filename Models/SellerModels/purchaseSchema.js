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
    },
    received: {
      type: Number,
    },
    waste: {
      type: Number,
    },
    graded: {
      type: Number,
    },
    cost_per_unit: {
      type: Number,
    },
    total_cost: {
      type: Number,
    },
    sold: {
      type: Number,
    },
    sold_percentage: {
      type: Number,
    },
    average_sales_price: {
      type: Number,
    },
    total_sales: {
      type: Number,
    },
    void: {
      type: Number,
    },
    inv_on_hand: {
      type: Number,
    },
    gross_profit: {
      type: Number,
    },
    gross_profit_percentage: {
      type: Number,
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
    smcs_purchase: {
      type: Boolean,
      required: true,
    },
    cash_purchase: {
      type: Boolean,
      required: true,
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
