const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
exports.getBusinesses = async (req, res, next) => {
  try {
    const { search, smcs } = req.body;
    console.log(req.body);
    if (!search) {
      return res
        .status(200)
        .json(error("Please provide search key", res.statusCode));
    }
    const buyers = await SellerPartnerBuyers.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
        },
      },
      {
        $lookup: {
          localField: "buyer",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $match: {
          $and: [
            { "buyer.business_trading_name": /^n/i },
            smcs === true ? { "buyer.is_smcs": true } : {},
            smcs === false ? { "buyer.is_smcs": false } : {},
          ],
        },
      },
    ]);
    res
      .status(200)
      .json(success("Buyers Fetched Successfully", { buyers }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addNewBusiness = async (req, res, next) => {
  try {
    const {
      business_trading_name,
      phone_number,
      email,
      abn,
      entity_name,
      address,
      is_smcs,
      market_seller,
      smcs_code,
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
    if (is_smcs === undefined || is_smcs === "") {
      return res
        .status(200)
        .json(error("Is this business part of SMCS?", res.statusCode));
    }
    if (market_seller === undefined || market_seller === "") {
      return res
        .status(200)
        .json(error("Is this business a market seller?", res.statusCode));
    }
    if (is_smcs === true) {
      if (!smcs_code) {
        return res
          .status(200)
          .json(error("Please provide smcs code", res.statusCode));
      }
    }
    const business = await Buyer.create({
      business_trading_name: business_trading_name,
      abn: abn,
      entity_name: entity_name,
      address: address,
      email: email,
      phone_number: phone_number,
      is_smcs: is_smcs,
      market_seller: market_seller,
      smcs_code: smcs_code,
      seller: req.seller._id,
    });
    await SellerPartnerBuyers.create({
      buyer: business._id,
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(
        success("Business Added Successfully", { business }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
