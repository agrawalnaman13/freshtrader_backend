const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const WholesellerSchema = new mongoose.Schema(
  {
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
    address: {
      type: String,
    },
    phone_number: {
      type: String,
      required: true,
    },
    market: {
      type: String,
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
