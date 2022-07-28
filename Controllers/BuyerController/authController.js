const mongoose = require("mongoose");
const moment = require("moment");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const SubscriptionHistory = require("../../Models/BuyerModels/subscriptionHistorySchema");
const Subscription = require("../../Models/AdminModels/subscriptionSchema");
exports.signup = async (req, res, next) => {
  try {
    const {
      business_trading_name,
      phone_number,
      email,
      password,
      is_smcs,
      market,
      address_line1,
      city,
      postal_code,
      country,
      deviceId,
    } = req.body;
    console.log(req.body);
    if (!business_trading_name) {
      return res
        .status(200)
        .json(error("Please provide business trading name", res.statusCode));
    }
    if (!phone_number) {
      return res
        .status(200)
        .json(error("Please provide phone number", res.statusCode));
    }
    if (!email) {
      return res
        .status(200)
        .json(error("Please provide email", res.statusCode));
    }
    if (!validator.isEmail(email))
      return res.status(200).json(error("Invalid Email", res.statusCode));
    if (!password) {
      return res
        .status(200)
        .json(error("Please provide password", res.statusCode));
    }
    if (is_smcs === undefined || is_smcs === "") {
      return res
        .status(200)
        .json(error("Is this business part of SMCS?", res.statusCode));
    }
    if (!market) {
      return res
        .status(200)
        .json(error("Please provide your market", res.statusCode));
    }
    if (
      !["Sydney Produce and Growers Market", "Sydney Flower Market"].includes(
        market
      )
    ) {
      return res.status(200).json(error("Invalid market", res.statusCode));
    }
    let buyer = await Buyer.findOne({
      email: email,
      password: { $exists: true },
    });
    if (buyer) {
      return res
        .status(200)
        .json(error("Email is already registered", res.statusCode));
    }
    let ourBuyer;
    buyer = await Buyer.findOne({
      email: email,
    });
    if (buyer) {
      ourBuyer = await Buyer.findOneAndUpdate(
        {
          email: email,
        },
        {
          business_trading_name: business_trading_name,
          password: password,
          phone_number: phone_number,
          is_smcs: is_smcs,
          market: market,
          address_line1: address_line1,
          city: city,
          postal_code: postal_code,
          country: country,
          deviceId: deviceId,
        }
      );
      await ourBuyer.save();
    } else {
      ourBuyer = await Buyer.create({
        business_trading_name: business_trading_name,
        email: email,
        password: password,
        phone_number: phone_number,
        is_smcs: is_smcs,
        market: market,
      });
      await ourBuyer.save();
    }
    let date = moment.utc();
    date = moment(date).format("MM-DD-YYYY");
    const jDateToday = new Date(date);
    const local_date = moment(jDateToday);
    const till = moment(local_date).add(1, "months");
    const plan = await Subscription.findOne({
      plan_name: "Enterprise",
    });
    if (plan) {
      await SubscriptionHistory.create({
        buyer: ourBuyer._id,
        plan: plan._id,
        valid_till: till,
      });
      ourBuyer.plan = plan._id;
      ourBuyer.subscription_week = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
    await ourBuyer.save();
    const sellers = await Wholeseller.find();
    for (const seller of sellers) {
      const partner = await SellerPartnerBuyers.findOne({
        seller: seller._id,
        buyer: ourBuyer._id,
      });
      if (!partner) {
        await SellerPartnerBuyers.create({
          seller: seller._id,
          buyer: ourBuyer._id,
        });
      }
    }
    const token = await ourBuyer.generateAuthToken();
    res
      .header("x-auth-token-buyer", token)
      .header("access-control-expose-headers", "x-auth-token-buyer")
      .status(200)
      .json(
        success(
          "Buyer created successfully",
          { buyer: ourBuyer, token: token },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.login = async (req, res, next) => {
  const { email, password, deviceId } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return res
      .status(200)
      .json(error("Please provide both email and password", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const ourBuyer = await Buyer.findOne({ email }).select("+password");
    if (!ourBuyer) {
      return res.status(200).json(error("Invalid email", res.statusCode));
    }
    if (!ourBuyer.status) {
      return res
        .status(200)
        .json(error("You are not authorized to log in", res.statusCode));
    }
    console.log(ourBuyer.password);
    if (!(await ourBuyer.correctPassword(password, ourBuyer.password))) {
      return res.status(200).json(error("Invalid Password", res.statusCode));
    }
    const token = await ourBuyer.generateAuthToken();
    if (deviceId) ourBuyer.deviceId = deviceId;
    res
      .header("x-auth-token-buyer", token)
      .header("access-control-expose-headers", "x-auth-token-buyer")
      .status(200)
      .json(
        success(
          "Logged In Successfully",
          { buyer: ourBuyer, token: token },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.searchBuyers = async (req, res, next) => {
  try {
    const { search } = req.body;
    if (!search) {
      return res
        .status(200)
        .json(error("Please provide search key", res.statusCode));
    }
    const buyers = await Buyer.find({
      business_trading_name: { $regex: search, $options: "$i" },
      status: true,
    }).sort({ createdAt: 1 });
    res
      .status(200)
      .json(success("Buyer fetched successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getBuyerData = async (req, res, next) => {
  try {
    const buyer = await Buyer.findById(req.buyer._id);
    res
      .status(200)
      .json(success("Buyer fetched successfully", { buyer }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateAccountInformation = async (req, res, next) => {
  try {
    const { email, csv } = req.body;
    console.log(req.body);
    if (!email) {
      return res
        .status(200)
        .json(error("Please provide email", res.statusCode));
    }
    if (!validator.isEmail(email))
      return res.status(200).json(error("Invalid Email", res.statusCode));
    if (!csv) {
      return res.status(200).json(error("Please provide csv", res.statusCode));
    }
    if (!["Xero", "MYOB", "Saasu", "Quickbooks"].includes(csv)) {
      return res.status(200).json(error("Invalid csv", res.statusCode));
    }
    const newBuyer = await Buyer.findOneAndUpdate(
      { _id: req.buyer._id },
      {
        report_email: email,
        csv: csv,
      }
    );

    res
      .status(200)
      .json(
        success(
          "Account Information Updated Successfully",
          { buyer: newBuyer },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    await Buyer.findOneAndUpdate({ email }, { otp: otp });
    res.status(200).json(success(otp, { otp }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  console.log(req.body);
  if (!email) {
    return res.status(200).json(error("Please provide email", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  if (!otp) {
    return res.status(200).json(error("Please provide otp", res.statusCode));
  }
  try {
    const buyer = await Buyer.findOne({ email });
    if (!buyer) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    if (buyer.otp !== +otp) {
      return res.status(200).json(error("Invalid OTP", res.statusCode));
    }
    await Buyer.findOneAndUpdate({ email }, { otp: "" });
    res.status(200).json(success("OTP Verified", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updatePassword = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return res
      .status(200)
      .json(error("Please provide both email and password", res.statusCode));
  }
  if (!validator.isEmail(email))
    return res.status(200).json(error("Invalid Email", res.statusCode));
  try {
    const buyer = await Buyer.findOne({ email }).select("+password");
    if (!buyer) {
      return res
        .status(200)
        .json(error("Email is not registered", res.statusCode));
    }
    buyer.password = password;
    await buyer.save();
    res
      .status(200)
      .json(
        success("Password Updated Successfully", { seller }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log(req.body);
    if (!oldPassword) {
      return res
        .status(200)
        .json(error("Please provide old password", res.statusCode));
    }
    if (!newPassword) {
      return res
        .status(200)
        .json(error("Please provide new password", res.statusCode));
    }
    const buyer = await Buyer.findById(req.buyer._id).select("+password");
    if (!(await buyer.correctPassword(oldPassword, buyer.password))) {
      return res
        .status(200)
        .json(error("Invalid old Password", res.statusCode));
    }
    buyer.password = newPassword;
    await buyer.save();
    res
      .status(200)
      .json(
        success("Password Updated Successfully", { admin }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { business_trading_name, phone_number, is_smcs, market } = req.body;
    console.log(req.body);
    if (!business_trading_name) {
      return res
        .status(200)
        .json(error("Please provide business trading name", res.statusCode));
    }
    if (!phone_number) {
      return res
        .status(200)
        .json(error("Please provide phone number", res.statusCode));
    }
    if (is_smcs === undefined || is_smcs === "") {
      return res
        .status(200)
        .json(error("Is this business part of SMCS?", res.statusCode));
    }
    if (!market) {
      return res
        .status(200)
        .json(error("Please provide your market", res.statusCode));
    }
    if (
      !["Sydney Produce and Growers Market", "Sydney Flower Market"].includes(
        market
      )
    ) {
      return res.status(200).json(error("Invalid market", res.statusCode));
    }

    const ourBuyer = await Buyer.findByIdAndUpdate(req.buyer._id, {
      business_trading_name: business_trading_name,
      phone_number: phone_number,
      is_smcs: is_smcs,
      market: market,
    });

    res
      .status(200)
      .json(
        success(
          "Profile updated successfully",
          { buyer: ourBuyer },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
