const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const ProductVariety = require("../../Models/AdminModels/productVarietySchema");
const ProductType = require("../../Models/AdminModels/productTypeSchema");
const Inventory = require("../../Models/SellerModels/inventorySchema");

exports.addSellerProduct = async (req, res, next) => {
  try {
    const { category, variety, type, add_gst } = req.body;
    console.log(req.body);
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
    const product = await SellerProduct.create({
      seller: req.seller._id,
      category,
      variety,
      type,
      add_gst,
    });
    await Inventory.create({
      seller: req.seller._id,
      productId: product._id,
    });
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
    })
      .sort({ variety: 1 })
      .populate(["variety", "type", "units", "suppliers"]);
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
        .json(error("Product id is required", res.statusCode));
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
    const isProduct = await SellerProduct.findOne({
      category: product.category,
      variety: product.variety,
      type: product.type,
      units: units,
    });
    if (isProduct) {
      return res
        .status(200)
        .json(error("Unit is already added", res.statusCode));
    }
    if (product.unit) {
      const newProduct = await SellerProduct.create({
        seller: req.seller._id,
        category: product.category,
        variety: product.variety,
        type: product.type,
        add_gst: product.add_gst,
        units: units,
      });
      await Inventory.create({
        seller: req.seller._id,
        productId: newProduct._id,
      });
    } else {
      await SellerProduct.findByIdAndUpdate(productId, {
        units: units,
      });
    }
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

exports.getProductDetail = async (req, res, next) => {
  try {
    if (!req.params.id) {
      return res
        .status(200)
        .json(error("Product id is required", res.statusCode));
    }
    const product = await SellerProduct.findById(req.params.id).populate([
      "variety",
      "type",
      "units",
    ]);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    res
      .status(200)
      .json(
        success("Product fetched Successfully", { product }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyVarietyList = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res
        .status(200)
        .json(error("Category is required", res.statusCode));
    }
    if (!["Fruits", "Herbs", "Vegetables", "Others"].includes(category)) {
      return res.status(200).json(error("Invalid Category", res.statusCode));
    }
    const varieties = await SellerProduct.find({
      category: category,
    }).distinct("variety");
    let varietyList = [];
    for (const variety of varieties) {
      varietyList.push(await ProductVariety.findById(variety));
    }
    res
      .status(200)
      .json(
        success("Product fetched Successfully", { varietyList }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyProductList = async (req, res, next) => {
  try {
    const { variety } = req.body;
    if (!variety) {
      return res.status(200).json(error("Variety is required", res.statusCode));
    }
    const product = await ProductVariety.findById(variety);
    if (!product) {
      return res
        .status(200)
        .json(error("Invalid product variety", res.statusCode));
    }
    const types = await SellerProduct.find({
      variety: variety,
    }).distinct("type");
    let typeList = [];
    for (const type of types) {
      typeList.push(await ProductType.findById(type));
    }
    res
      .status(200)
      .json(
        success("Product fetched Successfully", { typeList }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
