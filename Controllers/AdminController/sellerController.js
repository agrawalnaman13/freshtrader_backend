const mongoose = require("mongoose");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
exports.sellerSignup = async (req, res) => {
  try {
    const {
      business_trading_name,
      abn,
      entity_name,
      address,
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
    if (!entity_name) {
      return res
        .status(200)
        .json(error("Please provide entity name", res.statusCode));
    }
    if (!address) {
      return res
        .status(200)
        .json(error("Please provide address", res.statusCode));
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
      business_trading_name: business_trading_name,
      abn: abn,
      entity_name: entity_name,
      address: address,
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
          "Profile Updated Successfully",
          { seller: newSeller },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
