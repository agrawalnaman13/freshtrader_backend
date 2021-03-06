const mongoose = require("mongoose");
const ProductType = require("../../Models/AdminModels/productTypeSchema");
const ProductVariety = require("../../Models/AdminModels/productVarietySchema");
const SellerPOSLayout = require("../../Models/SellerModels/posLayoutSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const { getProductInventory } = require("./inventoryController");

exports.editCategoryName = async (req, res, next) => {
  try {
    const { fruits, vegetables, herbs, others } = req.body;
    console.log(req.body);
    if (!fruits) {
      return res
        .status(200)
        .json(error("Please provide fruits alias", res.statusCode));
    }
    if (!vegetables) {
      return res
        .status(200)
        .json(error("Please provide vegetables alias", res.statusCode));
    }
    if (!herbs) {
      return res
        .status(200)
        .json(error("Please provide herbs alias", res.statusCode));
    }
    if (!others) {
      return res
        .status(200)
        .json(error("Please provide others alias", res.statusCode));
    }
    const category = [
      {
        category: "Fruits",
        alias: fruits,
      },
      {
        category: "Vegetables",
        alias: vegetables,
      },
      {
        category: "Herbs",
        alias: herbs,
      },
      {
        category: "Others",
        alias: others,
      },
    ];
    const layout = await SellerPOSLayout.findOneAndUpdate(
      { seller: req.seller._id },
      {
        category: category,
      }
    );
    res
      .status(200)
      .json(
        success("Category Edited Successfully", { layout }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.saveLayout = async (req, res, next) => {
  try {
    const { variety } = req.body;
    console.log(req.body);
    if (!variety) {
      return res
        .status(200)
        .json(error("Please provide variety", res.statusCode));
    }
    // if (variety.length > 7) {
    //   return res
    //     .status(200)
    //     .json(error("Variety can be maximum upto 7", res.statusCode));
    // }
    const layout = await SellerPOSLayout.findOneAndUpdate(
      { seller: req.seller._id },
      {
        variety: variety,
      }
    );
    res
      .status(200)
      .json(success("Layout Saved Successfully", { layout }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getLayout = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res
        .status(200)
        .json(error("Please provide category", res.statusCode));
    }
    let products = [];
    const varieties = await SellerProduct.find({
      seller: req.seller._id,
      category,
    }).distinct("variety");
    for (const variety of varieties) {
      const varietyData = await ProductVariety.findById(variety).lean();
      const status = await SellerProduct.findOne({
        seller: req.seller._id,
        category,
        variety,
      });
      if (varietyData) varietyData.status = status.status;
      const typeIds = await SellerProduct.find({
        seller: req.seller._id,
        category,
        variety,
      }).distinct("type");
      let types = [];
      for (let type of typeIds) {
        const typeData = await ProductType.findById(type).lean();
        if (typeData) {
          typeData.inv = await getProductInventory(req.seller._id, type);
          types.push(typeData);
        }
      }
      if (varietyData) {
        products.push({
          variety: varietyData,
          types: types,
        });
      }
    }
    const categories = await SellerPOSLayout.findOne({
      seller: req.seller._id,
    });
    res
      .status(200)
      .json(
        success(
          "Layout Fetched Successfully",
          { products: products, categories: categories.category },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyPOSProducts = async (req, res, next) => {
  try {
    const { filterBy, search, category, variety } = req.body;
    console.log(req.body);
    const myProducts = await SellerProduct.find({
      category: category,
      variety: variety,
      seller: req.seller._id,
    }).distinct("type");
    const products = await ProductType.aggregate([
      {
        $match: { variety: mongoose.Types.ObjectId(variety) },
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
        $addFields: {
          isAdded: {
            $in: ["$_id", myProducts],
          },
        },
      },
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
            filterBy === 1
              ? {
                  isAdded: true,
                }
              : {},
            filterBy === 2
              ? {
                  isAdded: false,
                }
              : {},
          ],
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

exports.moveProduct = async (req, res, next) => {
  try {
    const { typeId, varietyId } = req.body;
    if (!typeId) {
      return res.status(200).json(error("Type id is required", res.statusCode));
    }
    const type = await ProductType.findById(typeId);
    if (!type) {
      return res.status(200).json(error("Invalid type id", res.statusCode));
    }
    if (!varietyId) {
      return res
        .status(200)
        .json(error("Variety id is required", res.statusCode));
    }
    const variety = await ProductVariety.findById(varietyId);
    if (!variety) {
      return res.status(200).json(error("Invalid variety id", res.statusCode));
    }
    const products = await SellerProduct.find({ type: typeId });
    for (const product of products) {
      await ProductType.findByIdAndUpdate(product._id, { variety: varietyId });
    }
    res
      .status(200)
      .json(success("Product changed successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeVarietyStatus = async (req, res, next) => {
  try {
    const { varietyId, status } = req.body;
    if (!varietyId) {
      return res
        .status(200)
        .json(error("Variety id is required", res.statusCode));
    }
    const variety = await ProductVariety.findById(varietyId);
    if (!variety) {
      return res.status(200).json(error("Invalid variety id", res.statusCode));
    }
    if (status === undefined || status === "") {
      return res.status(200).json(error("Status is required", res.statusCode));
    }
    const products = await SellerProduct.find({ variety: varietyId });
    for (const product of products) {
      await SellerProduct.findByIdAndUpdate(product._id, { status: status });
    }
    res
      .status(200)
      .json(success("Variety status changed successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
