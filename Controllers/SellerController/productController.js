const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const ProductVariety = require("../../Models/AdminModels/productVarietySchema");
const ProductType = require("../../Models/AdminModels/productTypeSchema");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const Unit = require("../../Models/AdminModels/unitSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const { getProductInventory } = require("./inventoryController");
const Transaction = require("../../Models/SellerModels/transactionSchema");
const Order = require("../../Models/BuyerModels/orderSchema");
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
    const { variety, category, type, search, active_consignment } = req.body;
    console.log(req.body);
    const products = await SellerProduct.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          variety: mongoose.Types.ObjectId(variety),
          category: category,
          type: mongoose.Types.ObjectId(type),
          status: true,
        },
      },
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
      { $unwind: "$units" },
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
            search ? { "type.type": { $regex: search, $options: "$i" } } : {},
            search
              ? {
                  suppliers: {
                    $elemMatch: {
                      business_trading_name: { $regex: search, $options: "$i" },
                    },
                  },
                }
              : {},
          ],
        },
      },
    ]);
    let list = [];
    if (active_consignment) {
      for (const product of products) {
        const consignment = await Purchase.aggregate([
          {
            $match: {
              seller: mongoose.Types.ObjectId(req.seller._id),
              status: "ACTIVE",
            },
          },
          { $unwind: "$products" },
          {
            $match: {
              "products.productId": {
                $eq: mongoose.Types.ObjectId(product._id),
              },
            },
          },
        ]);
        if (consignment.length) list.push(product);
      }
    } else list = list.concat(products);
    res
      .status(200)
      .json(
        success(
          "Product Fetched Successfully",
          { products: list },
          res.statusCode
        )
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

exports.undoSellerProduct = async (req, res, next) => {
  try {
    const { products } = req.body;
    console.log(req.body);
    if (!products.length) {
      return res
        .status(200)
        .json(error("Products are required", res.statusCode));
    }
    for (const product of products) {
      const pr = await SellerProduct.findById(product._id);
      if (pr) {
        await SellerProduct.findByIdAndUpdate(product._id, {
          price: product.price,
          add_gst: product.add_gst,
          inventory_code: product.inventory_code,
          available_on_order_app: product.available_on_order_app,
          grades: product.grades,
        });
      } else {
        await SellerProduct.create({
          _id: product._id,
          seller: product.seller,
          variety: product.variety,
          category: category,
          type: product.type,
          price: product.price,
          add_gst: product.add_gst,
          inventory_code: product.inventory_code,
          available_on_order_app: product.available_on_order_app,
          grades: product.grades,
          units: product.units,
          suppliers: product.suppliers,
          price: product.price,
          inventory_code: product.inventory_code,
        });
      }
    }
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
    if (!units) {
      return res.status(200).json(error("unit is required", res.statusCode));
    }
    const unit = await Unit.findById(units);
    if (!unit) {
      return res.status(200).json(error("Invalid unit", res.statusCode));
    }
    const isProduct = await SellerProduct.findOne({
      seller: req.seller._id,
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
    if (product.units) {
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

exports.removeProductUnit = async (req, res, next) => {
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
    if (!units) {
      return res.status(200).json(error("unit is required", res.statusCode));
    }
    const unit = await Unit.findById(units);
    if (!unit) {
      return res.status(200).json(error("Invalid unit", res.statusCode));
    }
    const isProduct = await SellerProduct.findOne({
      seller: req.seller._id,
      category: product.category,
      variety: product.variety,
      type: product.type,
      units: units,
    });
    if (isProduct) {
      await Inventory.findOneAndDelete({
        seller: req.seller._id,
        productId: isProduct._id,
      });
      const consignments = await Purchase.find();
      for (const consignment of consignments) {
        consignment.products = consignment.products.filter(
          (pr) => String(pr.productId) !== String(isProduct._id)
        );
        await Purchase.findByIdAndUpdate(consignment._id, {
          products: consignment.products,
        });
      }
      const transactions = await Transaction.find();
      for (const transaction of transactions) {
        transaction.products = transaction.products.filter(
          (pr) => String(pr.productId) !== String(isProduct._id)
        );
        await Transaction.findByIdAndUpdate(transaction._id, {
          products: transaction.products,
        });
      }
      const orders = await Order.find();
      for (const order of orders) {
        order.product = order.product.filter(
          (pr) => String(pr.productId) !== String(isProduct._id)
        );
        await Order.findByIdAndUpdate(order._id, {
          product: order.product,
        });
      }
      await SellerProduct.findOneAndDelete({
        seller: req.seller._id,
        category: product.category,
        variety: product.variety,
        type: product.type,
        units: units,
      });
    }
    return res
      .status(200)
      .json(success("Unit deleted successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyProductUnit = async (req, res, next) => {
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
    const units = await SellerProduct.find({
      seller: req.seller._id,
      category: product.category,
      variety: product.variety,
      type: product.type,
      units: { $exists: true },
      status: true,
    })
      .select(["units", "price", "type", "variety"])
      .populate(["units", "type", "variety"]);

    return res
      .status(200)
      .json(
        success("Product unit fetched successfully", { units }, res.statusCode)
      );
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
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          status: true,
        },
      },
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
      { $unwind: "$units" },
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

exports.getCategoryList = async (req, res, next) => {
  try {
    const seller = await Wholeseller.findById(req.seller._id);
    let category = [];
    if (seller.market === "Sydney Produce and Growers Market")
      category = ["Fruits", "Vegetables", "Herbs", "Others"];
    else category = ["Flowers", "Foliage"];
    res
      .status(200)
      .json(
        success("Product fetched Successfully", { category }, res.statusCode)
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
    // if (!["Fruits", "Herbs", "Vegetables", "Others"].includes(category)) {
    //   return res.status(200).json(error("Invalid Category", res.statusCode));
    // }
    const varieties = await SellerProduct.find({
      seller: req.seller._id,
      category: category,
      status: true,
    }).distinct("variety");
    let varietyList = [];
    for (const variety of varieties) {
      const v = await ProductVariety.findById(variety);
      if (v) varietyList.push(v);
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
      seller: req.seller._id,
      variety: variety,
      status: true,
    }).distinct("type");
    let typeList = [];
    for (const type of types) {
      const typeData = await ProductType.findById(type).lean();
      if (typeData) {
        typeData.inv = await getProductInventory(req.seller._id, type);
        typeData.productId = (
          await SellerProduct.findOne({ type }).populate("units").sort({
            "units.weight": 1,
          })
        )._id;
        typeList.push(typeData);
      }
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

exports.addMissingProduct = async (req, res, next) => {
  try {
    const { category, variety, type, varietyId, typeId } = req.body;
    console.log(req.body, req.files);
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
    if (!req.files) {
      return res.status(200).json(error("Image is required", res.statusCode));
    }
    let newVariety;
    if (varietyId) {
      newVariety = await ProductVariety.findById(varietyId);
    } else {
      newVariety = await ProductVariety.create({
        variety: variety,
        product: category,
        added_by: req.seller._id,
      });
    }
    let newType;
    if (typeId) {
      newType = await ProductType.findById(typeId);
    } else {
      newType = await ProductType.create({
        variety: newVariety._id,
        type: type,
        image: `${req.files[0].destination.replace("./public", "")}/${
          req.files[0].filename
        }`,
        added_by: req.seller._id,
      });
    }
    return res
      .status(200)
      .json(
        success("Type Added Successfully", { type: newType }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
