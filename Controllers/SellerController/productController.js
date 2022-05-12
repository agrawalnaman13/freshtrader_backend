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
    const { variety, category, type } = req.body;
    console.log(req.body);
    const products = await SellerProduct.find({
      seller: req.seller._id,
      variety,
      category,
      type,
    }).populate(["variety", "type", "units", "suppliers"]);
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

exports.addProductSupplier = async (req, res, next) => {
  try {
    const { productId, suppliers } = req.body;
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
      suppliers: suppliers,
    });
    return res
      .status(200)
      .json(success("Product supplier added successfully", {}, res.statusCode));
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

exports.searchSellerProduct = async (req, res, next) => {
  try {
    const { search } = req.body;
    console.log(req.body);
    // let suppliers = await SellerProduct.find({
    //   seller: mongoose.Types.ObjectId(req.seller._id),
    // }).populate("suppliers");
    // suppliers = suppliers.map(({ suppliers }) => suppliers);
    // suppliers = suppliers[0].map(
    //   ({ business_trading_name }) => business_trading_name
    // );
    const products = await SellerProduct.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(req.seller._id) } },
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
          localField: "variety",
          foreignField: "_id",
          from: "productvarieties",
          as: "variety",
        },
      },
      { $unwind: "$variety" },
      {
        $lookup: {
          localField: "units",
          foreignField: "_id",
          from: "units",
          as: "units",
        },
      },
      {
        $lookup: {
          localField: "suppliers",
          foreignField: "_id",
          from: "sellersuppliers",
          as: "suppliers",
        },
      },
      {
        $match: {
          $or: [
            { "type.type": { $regex: search, $options: "$i" } },
            // { suppliers: { $elemArray: { $regex: search, $options: "$i" } } },
          ],
        },
      },
    ]);
    return res
      .status(200)
      .json(
        success("Product fetched successfully", { products }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
