const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SellerStaffSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      default: "",
    },
    last_name: {
      type: String,
      default: "",
    },
    phone_number: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    access: {
      type: Array,
      required: true,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: "wholeseller",
      required: true,
    },
  },
  { timestamps: {} },
  { collection: "sellerStaff" }
);

SellerStaffSchema.methods.correctPassword = async (
  passwordFromDatabase,
  passwordFromFrontend
) => {
  return await bcrypt.compare(passwordFromDatabase, passwordFromFrontend);
};

SellerStaffSchema.methods.changedPasswordAfter = (JWTTimestamp) => {
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

SellerStaffSchema.pre("save", async function (next) {
  console.log(this.isModified("password"));
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 7);
  this.confirmPassword = undefined;
  next();
});

const SellerStaff = mongoose.model("sellerStaff", SellerStaffSchema);

module.exports = SellerStaff;
