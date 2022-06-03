const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const validator = require("validator");
const SellerSupplier = require("../../Models/SellerModels/sellerSuppliersSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const { checkABN } = require("./authController");
exports.addSupplier = async (req, res, next) => {
  try {
    const {
      business_trading_name,
      phone_number,
      email,
      abn,
      entity_name,
      address,
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
    if (!checkABN(+abn)) {
      return res.status(200).json(error("Invalid ABN", res.statusCode));
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
    if (market_seller === undefined || market_seller === "") {
      return res
        .status(200)
        .json(error("Is this business a market seller?", res.statusCode));
    }
    if (market_seller === true) {
      if (!smcs_code) {
        return res
          .status(200)
          .json(error("Please provide smcs code", res.statusCode));
      }
    }

    const supplier = await SellerSupplier.create({
      business_trading_name: business_trading_name,
      abn: abn,
      entity_name: entity_name,
      address: address,
      email: email,
      phone_number: phone_number,
      market_seller: market_seller,
      smcs_code: smcs_code,
      seller: req.seller._id,
    });
    const supplierId = String(supplier._id).slice(18, 24);
    supplier.supplierId = supplierId;
    await supplier.save();
    res
      .status(200)
      .json(
        success("Supplier Added Successfully", { supplier }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const {
      supplierId,
      business_trading_name,
      phone_number,
      email,
      abn,
      entity_name,
      address,
      market_seller,
      smcs_code,
    } = req.body;
    console.log(req.body);
    if (!supplierId) {
      return res
        .status(200)
        .json(error("Please provide supplier id", res.statusCode));
    }
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
    if (!checkABN(+abn)) {
      return res.status(200).json(error("Invalid ABN", res.statusCode));
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
    if (market_seller === undefined || market_seller === "") {
      return res
        .status(200)
        .json(error("Is this business a market seller?", res.statusCode));
    }
    if (market_seller === true) {
      if (!smcs_code) {
        return res
          .status(200)
          .json(error("Please provide smcs code", res.statusCode));
      }
    }
    const supplier = await SellerSupplier.findOne({
      _id: supplierId,
      seller: req.seller._id,
    });
    if (!supplier) {
      return res.status(200).json(error("Invalid supplier id", res.statusCode));
    }
    const newSupplier = await SellerSupplier.findOneAndUpdate(
      { _id: supplierId, seller: req.seller._id },
      {
        business_trading_name: business_trading_name,
        abn: abn,
        entity_name: entity_name,
        address: address,
        email: email,
        phone_number: phone_number,
        market_seller: market_seller,
        smcs_code: smcs_code,
      }
    );
    res
      .status(200)
      .json(
        success(
          "Supplier Updated Successfully",
          { supplier: newSupplier },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await SellerSupplier.find({
      seller: req.seller._id,
    }).sort({ createdAt: 1 });
    res
      .status(200)
      .json(
        success("Supplier fetched successfully", { suppliers }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await SellerSupplier.findOne({
      _id: req.params.id,
      seller: req.seller._id,
    });
    if (!supplier) {
      return res.status(200).json(error("Invalid supplier id", res.statusCode));
    }
    await SellerSupplier.findOneAndDelete({
      _id: req.params.id,
      seller: req.seller._id,
    });
    await SellerPallets.findOneAndDelete({
      received_from: req.params.id,
    });
    res
      .status(200)
      .json(success("Supplier Deleted Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.searchSuppliers = async (req, res, next) => {
  try {
    const { search } = req.body;
    if (!search) {
      return res
        .status(200)
        .json(error("Please provide search key", res.statusCode));
    }
    const suppliers = await SellerSupplier.find({
      seller: req.seller._id,
      $or: [
        { business_trading_name: { $regex: search, $options: "$i" } },
        { supplierId: { $regex: search, $options: "$i" } },
      ],
    }).sort({ createdAt: 1 });
    res
      .status(200)
      .json(
        success("Supplier fetched successfully", { suppliers }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSuppliersProduct = async (req, res, next) => {
  try {
    const { supplierId } = req.body;
    if (!supplierId) {
      return res
        .status(200)
        .json(error("Please provide supplier Id", res.statusCode));
    }
    const supplier = await SellerSupplier.findById(supplierId);
    if (!supplier) {
      return res.status(200).json(error("Invalid supplier Id", res.statusCode));
    }
    const products = await SellerProduct.find({
      seller: req.seller._id,
      suppliers: { $elemMatch: { $eq: supplierId } },
    }).populate(["variety", "type", "units"]);
    res
      .status(200)
      .json(
        success("Products fetched successfully", { products }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const { supplierId, filterBy, search } = req.body;
    console.log(req.body);
    if (!supplierId) {
      return res
        .status(200)
        .json(error("Please provide supplier Id", res.statusCode));
    }
    const supplier = await SellerSupplier.findById(supplierId);
    if (!supplier) {
      return res.status(200).json(error("Invalid supplier Id", res.statusCode));
    }
    const products = await SellerProduct.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          $and: [
            filterBy === 1
              ? {
                  suppliers: {
                    $elemMatch: { $eq: supplierId },
                  },
                }
              : {},
            filterBy === 2
              ? {
                  suppliers: {
                    $elemMatch: { $ne: supplierId },
                  },
                }
              : {},
          ],
        },
      },
      {
        $lookup: {
          localField: "variety",
          foreignField: "_id",
          from: "productvarieties",
          as: "variety",
        },
      },
      { $unwind: "$variety" },
      {
        $lookup: {
          localField: "type",
          foreignField: "_id",
          from: "producttypes",
          as: "type",
        },
      },
      { $unwind: "$type" },
      {
        $lookup: {
          localField: "units",
          foreignField: "_id",
          from: "units",
          as: "units",
        },
      },
      { $unwind: "$units" },
      {
        $match: {
          $and: [
            search
              ? {
                  $or: [
                    { "type.type": { $regex: search, $options: "$i" } },
                    { "variety.variety": { $regex: search, $options: "$i" } },
                  ],
                }
              : {},
          ],
        },
      },
      {
        $addFields: {
          isAdded: {
            $filter: {
              input: "$suppliers",
              as: "mi",
              cond: {
                $in: [mongoose.Types.ObjectId(supplierId), "$suppliers"],
              },
            },
          },
        },
      },
      {
        $set: {
          isAdded: {
            $cond: {
              if: {
                $gt: [{ $size: "$isAdded" }, 0],
              },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);
    res
      .status(200)
      .json(
        success("Products fetched successfully", { products }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
