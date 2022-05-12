const mongoose = require("mongoose");
const SellerPOSLayout = require("../../Models/SellerModels/posLayoutSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const { success, error } = require("../../service_response/adminApiResponse");

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
    const layout = await SellerPOSLayout.findOne({
      seller: req.seller._id,
    }).lean();
    const types = {
      fruits: [],
      vegetables: [],
      herbs: [],
      others: [],
    };
    for (const variety of layout.variety.fruits) {
      let type = await SellerProduct.find({
        variety: variety.variety,
      }).populate("type");
      type = type.map(({ type }) => type);
      types.fruits.push({
        variety: variety.variety,
        status: variety.status,
        type: type,
      });
    }
    for (const variety of layout.variety.vegetables) {
      let type = await SellerProduct.find({
        variety: variety.variety,
      }).populate("type");
      type = type.map(({ type }) => type);
      types.vegetables.push({
        variety: variety.variety,
        status: variety.status,
        type: type,
      });
    }
    for (const variety of layout.variety.herbs) {
      let type = await SellerProduct.find({
        variety: variety.variety,
      }).populate("type");
      type = type.map(({ type }) => type);
      types.herbs.push({
        variety: variety.variety,
        status: variety.status,
        type: type,
      });
    }
    for (const variety of layout.variety.others) {
      let type = await SellerProduct.find({
        variety: variety.variety,
      }).populate("type");
      type = type.map(({ type }) => type);
      types.others.push({
        variety: variety.variety,
        status: variety.status,
        type: type,
      });
    }
    layout.variety = types;
    res
      .status(200)
      .json(success("Layout Fetched Successfully", { layout }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
