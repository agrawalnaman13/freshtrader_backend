const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const BuyerSchema = new mongoose.Schema(
  {
    business_trading_name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    abn: {
      type: String,
      required: false,
    },
    entity_name: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    postal_code: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    market_seller: {
      type: Boolean,
      required: false,
    },
    market: {
      type: String,
      enum: ["Sydney Produce and Growers Market", "Sydney Flower Market"],
    },
    is_smcs: {
      type: Boolean,
      required: true,
    },
    smcs_code: {
      type: String,
    },
    plan: {
      type: mongoose.Types.ObjectId,
      ref: "subscription",
    },
    csv: {
      type: String,
      enum: ["Xero", "MYOB", "Saasu", "Quickbooks", ""],
      default: "",
    },
    report_email: {
      type: String,
    },
    notify_counter_order: {
      type: Boolean,
      default: true,
    },
    notify_order_cancelation: {
      type: Boolean,
      default: true,
    },
    notify_order_confirmation: {
      type: Boolean,
      default: true,
    },
    order_count: {
      type: Number,
      required: false,
      default: 0,
    },
    subscription_week: {
      type: Date,
      required: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    deviceId: {
      type: String,
      default: "",
    },
  },
  { timestamps: {} },
  { collection: "buyer" }
);
BuyerSchema.methods.correctPassword = async (
  passwordFromDatabase,
  passwordFromFrontend
) => {
  return await bcrypt.compare(passwordFromDatabase, passwordFromFrontend);
};

BuyerSchema.methods.changedPasswordAfter = (JWTTimestamp) => {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

BuyerSchema.pre("save", async function (next) {
  console.log(this.isModified("password"));
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 7);
  this.confirmPassword = undefined;
  next();
});

BuyerSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
    },
    "ultra-security",
    {
      expiresIn: "90d",
    }
  );
  return token;
};

const Buyer = mongoose.model("buyer", BuyerSchema);

module.exports = Buyer;
