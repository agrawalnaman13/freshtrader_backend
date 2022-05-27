const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const ProductVariety = require("../../Models/AdminModels/productVarietySchema");
const Unit = require("../../Models/AdminModels/unitSchema");
const ProductType = require("../../Models/AdminModels/productTypeSchema");
const ProductUnit = require("../../Models/AdminModels/productUnitSchema");

exports.addVariety = async (req, res, next) => {
  try {
    const newVariety = await ProductVariety.create(req.body);
    return res
      .status(200)
      .json(
        success(
          "Variety Added Successfully",
          { variety: newVariety },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getVariety = async (req, res, next) => {
  try {
    const varieties = await ProductVariety.find(req.body);
    return res
      .status(200)
      .json(
        success("Variety Fetched Successfully", { varieties }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addUnit = async (req, res, next) => {
  try {
    const newUnit = await Unit.create(req.body);
    return res
      .status(200)
      .json(
        success("Unit Added Successfully", { unit: newUnit }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getUnit = async (req, res, next) => {
  try {
    const units = await Unit.find();
    return res
      .status(200)
      .json(success("Unit fetched Successfully", { units }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addProductType = async (req, res, next) => {
  try {
    const { variety, type } = req.body;
    const newType = await ProductType.create({
      variety: variety,
      type: type,
      image: `${req.files[0].destination.replace("./public", "")}/${
        req.files[0].filename
      }`,
    });
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

exports.getProductType = async (req, res, next) => {
  try {
    const { variety } = req.body;
    const types = await ProductType.find({ variety }).populate("variety");
    return res
      .status(200)
      .json(success("Type Fetched Successfully", { types }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addProductUnit = async (req, res, next) => {
  try {
    const newUnit = await ProductUnit.create(req.body);
    return res
      .status(200)
      .json(
        success("Unit Added Successfully", { unit: newUnit }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getProductUnit = async (req, res, next) => {
  try {
    const { variety } = req.body;
    const units = await ProductUnit.find({ variety }).populate([
      "variety",
      "unit",
    ]);
    return res
      .status(200)
      .json(success("Unit Fetched Successfully", { units }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
