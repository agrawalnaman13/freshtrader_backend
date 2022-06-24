const mongoose = require("mongoose");
const { success, error } = require("../../service_response/adminApiResponse");
const ProductVariety = require("../../Models/AdminModels/productVarietySchema");
const Unit = require("../../Models/AdminModels/unitSchema");
const ProductType = require("../../Models/AdminModels/productTypeSchema");
const ProductUnit = require("../../Models/AdminModels/productUnitSchema");
const MongoClient = require("mongodb").MongoClient;
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
    const { product } = req.body;
    const varieties = await ProductVariety.find({
      product: product,
      $or: [
        { added_by: "Admin" },
        { added_by: undefined },
        { added_by: req.seller._id },
      ],
    }).sort({ variety: 1 });
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
    const { unit, weight, variety } = req.body;
    const newUnit = await Unit.create({
      unit,
      weight,
      added_by: req.seller._id,
    });
    await ProductUnit.create({
      unit: newUnit._id,
      variety,
      added_by: req.seller._id,
    });
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
    const units = await Unit.find({
      $or: [{ added_by: "Admin" }, { added_by: undefined }],
    });
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
    console.log(req.body);
    const types = await ProductType.aggregate([
      {
        $match: {
          variety: mongoose.Types.ObjectId(variety),
          $or: [{ added_by: "Admin" }, { added_by: req.seller._id }],
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
          localField: "units",
          foreignField: "_id",
          from: "units",
          as: "units",
        },
      },
      { $unwind: "$units" },
      { $sort: { type: 1 } },
    ]);
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
    const units = await ProductUnit.aggregate([
      {
        $match: {
          variety: mongoose.Types.ObjectId(variety),
          $or: [{ added_by: "Admin" }, { added_by: req.seller._id }],
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
          localField: "units",
          foreignField: "_id",
          from: "units",
          as: "units",
        },
      },
      { $unwind: "$units" },
      { $sort: { "unit.weight": 1 } },
    ]);
    return res
      .status(200)
      .json(success("Unit Fetched Successfully", { units }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.importDB = async (req, res, next) => {
  try {
    var url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("Freshtrader");
      const units = require("./units.json");
      dbo.collection("units").insertMany(units, function (err, res) {
        if (err) throw err;
        console.log("Number of documents inserted: " + res.insertedCount);
      });
      const productvarieties = require("./productvarieties.json");
      dbo
        .collection("productvarieties")
        .insertMany(productvarieties, function (err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
        });
      const producttypes = require("./producttypes.json");
      dbo
        .collection("producttypes")
        .insertMany(producttypes, function (err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
        });
      const productunits = require("./productunits.json");
      dbo
        .collection("productunits")
        .insertMany(productunits, function (err, res) {
          if (err) throw err;
          console.log("Number of documents inserted: " + res.insertedCount);
          db.close();
        });
    });
    return res
      .status(200)
      .json(success("Products imported Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.dropCollection = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;
    console.log(db);
    await db.dropCollection(req.body.collectionName);

    res.status(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
};
