const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");

exports.addSellerProduct = async (req, res, next) => {
  try {
    const { seller, category, variety, type, add_gst } = req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Seller id is required", res.statusCode));
    }
    if (!category) {
      return res
        .status(200)
        .json(error("Category is required", res.statusCode));
    }
    if (!variety) {
      return res.status(200).json(error("Variety is required", res.statusCode));
    }
    if (!type) {
      return res.status(200).json(error("Type is required", res.statusCode));
    }
    const ourSeller = await Wholeseller.findById(seller);
    if (!ourSeller) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    const product = await SellerProduct.create(req.body);
    res
      .status(200)
      .json(success("Product Added Successfully", { product }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSellerProduct = async (req, res, next) => {
  try {
    const { seller, variety, category, type } = req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Seller id is required", res.statusCode));
    }
    const ourSeller = await Wholeseller.findById(seller);
    if (!ourSeller) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    const products = await SellerProduct.find({
      seller,
      variety,
      category,
      type,
    }).populate(["variety", "type", "units"]);
    res
      .status(200)
      .json(
        success("Product Fetched Successfully", { products }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateSellerProduct = async (req, res, next) => {
  try {
    const {
      productId,
      price,
      add_gst,
      inventory_code,
      available_on_order_app,
      grades,
    } = req.body;
    console.log(req.body);
    if (!productId) {
      return res
        .status(200)
        .json(error("product id is required", res.statusCode));
    }
    const product = await SellerProduct.findById(productId);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    await SellerProduct.findByIdAndUpdate(productId, {
      price: price,
      add_gst: add_gst,
      inventory_code: inventory_code,
      available_on_order_app: available_on_order_app,
      grades: grades,
    });
    return res
      .status(200)
      .json(success("Product updated successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addProductUnit = async (req, res, next) => {
  try {
    const { productId, units } = req.body;
    console.log(req.body);
    if (!productId) {
      return res
        .status(200)
        .json(error("product id is required", res.statusCode));
    }
    const product = await SellerProduct.findById(productId);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    await SellerProduct.findByIdAndUpdate(productId, {
      units: units,
    });
    return res
      .status(200)
      .json(success("Product unit added successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteSellerProduct = async (req, res, next) => {
  try {
    const { productId } = req.body;
    console.log(req.body);
    if (!productId) {
      return res
        .status(200)
        .json(error("product id is required", res.statusCode));
    }
    const product = await SellerProduct.findById(productId);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    await SellerProduct.findByIdAndRemove(productId);
    return res
      .status(200)
      .json(success("Product deleted successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
