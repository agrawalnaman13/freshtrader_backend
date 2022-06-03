const mongoose = require("mongoose");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
const { checkABN } = require("../SellerController/authController");
exports.sellerSignup = async (req, res) => {
  try {
    const {
      business_trading_name,
      abn,
      entity_name,
      address_line1,
      address_line2,
      phone_number,
      market,
      stall_location,
      is_smcs,
      smcs_code,
      email,
      password,
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
    if (!abn) {
      return res.status(200).json(error("Please provide abn", res.statusCode));
    }
    if (checkABN(+abn)) {
      return res.status(200).json(error("Invalid ABN", res.statusCode));
    }
    if (!entity_name) {
      return res
        .status(200)
        .json(error("Please provide entity name", res.statusCode));
    }
    if (!address_line1) {
      return res
        .status(200)
        .json(error("Please provide address line1", res.statusCode));
    }
    if (!address_line2) {
      return res
        .status(200)
        .json(error("Please provide address line2", res.statusCode));
    }
    if (!market) {
      return res
        .status(200)
        .json(error("Please provide your market", res.statusCode));
    }
    if (!stall_location) {
      return res
        .status(200)
        .json(error("Please provide stall location", res.statusCode));
    }
    if (is_smcs === undefined || is_smcs === "") {
      return res
        .status(200)
        .json(error("Is this business part of SMCS?", res.statusCode));
    }
    if (is_smcs === true) {
      if (!smcs_code) {
        return res
          .status(200)
          .json(error("Please provide smcs code", res.statusCode));
      }
    }
    if (!password) {
      return res
        .status(200)
        .json(error("Please provide password", res.statusCode));
    }

    const newSeller = await Wholeseller.create({
      profile_image: req.files.length
        ? `${req.files[0].destination.replace("./public", "")}/${
            req.files[0].filename
          }`
        : "",
      business_trading_name: business_trading_name,
      abn: abn,
      entity_name: entity_name,
      address_line1: address_line1,
      address_line2: address_line2,
      phone_number: phone_number,
      market: market,
      stall_location: stall_location,
      smcs_code: smcs_code,
      is_smcs: is_smcs,
      email: email,
      password: password,
    });
    res
      .status(200)
      .json(
        success(
          "Profile Created Successfully",
          { seller: newSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSellerData = async (req, res) => {
  try {
    const seller = await Wholeseller.findById(req.params.id);
    if (!seller) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    res
      .status(200)
      .json(
        success("Profile Fetched Successfully", { seller }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSellerList = async (req, res) => {
  try {
    const { filterBy } = req.body;
    const sellers = await Wholeseller.find({
      $and: [
        filterBy === 1 ? { market: "Sydney Produce and Growers Market" } : {},
        filterBy === 2 ? { market: "Sydney Flower Market" } : {},
      ],
    }).sort({ createdAt: -1 });
    res
      .status(200)
      .json(
        success("Profile Fetched Successfully", { sellers }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeSellerStatus = async (req, res) => {
  try {
    const seller = await Wholeseller.findById(req.params.id);
    if (!seller) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    seller.status = !seller.status;
    await seller.save();
    res
      .status(200)
      .json(success("Status Updated Successfully", { seller }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
