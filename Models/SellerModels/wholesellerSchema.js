const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const WholesellerSchema = new mongoose.Schema(
  {
    profile_image: {
      type: String,
    },
    business_trading_name: {
      type: String,
      required: true,
    },
    abn: {
      type: String,
      required: true,
    },
    entity_name: {
      type: String,
      required: true,
    },
    address_line1: {
      type: String,
    },
    address_line2: {
      type: String,
    },
    phone_number: {
      type: String,
      required: true,
    },
    market: {
      type: String,
      enum: ["Sydney Produce and Growers Market", "Sydney Flower Market"],
    },
    stall_location: {
      type: String,
    },
    smcs_code: {
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
      required: true,
      select: false,
    },
    otp: {
      type: Number,
    },
    account_name: {
      type: String,
    },
    bsb: {
      type: String,
    },
    account: {
      type: String,
    },
    sales_invoice_due_date: {
      type: Number,
    },
    csv: {
      type: String,
      enum: ["Xero", "MYOB", "Saasu", "Quickbooks", ""],
      default: "",
    },
    invoice_account_code: {
      type: String,
    },
    smcs_invoice_account_code: {
      type: String,
    },
    cash_account_code: {
      type: String,
    },
    card_account_code: {
      type: String,
    },
    credit_total_account_code: {
      type: String,
    },
    thermal_receipt_invoice_logo: {
      type: String,
    },
    a4_invoice_logo: {
      type: String,
    },
    include_food_saftey_logo: {
      type: Boolean,
    },
    public_ordering: {
      type: Boolean,
      default: true,
    },
    publish_prices: {
      type: Boolean,
      default: true,
    },
    notify_new_order: {
      type: Boolean,
      default: true,
    },
    notify_declined_offer: {
      type: Boolean,
      default: true,
    },
    notify_confirmed_offer: {
      type: Boolean,
      default: true,
    },
    notify_cancel_order: {
      type: Boolean,
      default: true,
    },
    allow_overselling: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: {} },
  { collection: "wholeseller" }
);
WholesellerSchema.methods.correctPassword = async (
  passwordFromDatabase,
  passwordFromFrontend
) => {
  return await bcrypt.compare(passwordFromDatabase, passwordFromFrontend);
};

WholesellerSchema.methods.changedPasswordAfter = (JWTTimestamp) => {
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

WholesellerSchema.pre("save", async function (next) {
  console.log(this.isModified("password"));
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 7);
  this.confirmPassword = undefined;
  next();
});

WholesellerSchema.methods.generateAuthToken = function () {
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

const Wholeseller = mongoose.model("wholeseller", WholesellerSchema);

module.exports = Wholeseller;
