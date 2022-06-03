const mongoose = require("mongoose");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const { success, error } = require("../../service_response/adminApiResponse");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
exports.getInventory = async (req, res) => {
  try {
    const { allow_overselling, search } = req.body;
    console.log(req.body);
    const seller = await Wholeseller.findById(req.seller._id);
    let category = [];
    if (seller.market === "Sydney Produce and Growers Market")
      category = ["Fruits", "Herbs", "Vegetables", "Others"];
    else category = ["Flowers", "Foliage"];
    const inventories = await Inventory.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          // $and: [
          //   active_consignment ? { status: "ACTIVE" } : {},
          // ],
        },
      },
      {
        $lookup: {
          localField: "productId",
          foreignField: "_id",
          from: "sellerproducts",
          as: "productId",
        },
      },
      { $unwind: "$productId" },
      {
        $lookup: {
          localField: "productId.units",
          foreignField: "_id",
          from: "units",
          as: "productId.units",
        },
      },
      { $unwind: "$productId.units" },
      {
        $lookup: {
          localField: "productId.variety",
          foreignField: "_id",
          from: "productvarieties",
          as: "productId.variety",
        },
      },
      { $unwind: "$productId.variety" },
      {
        $lookup: {
          localField: "productId.type",
          foreignField: "_id",
          from: "producttypes",
          as: "productId.type",
        },
      },
      { $unwind: "$productId.type" },
      {
        $match: {
          "productId.variety.product": { $in: category },
          $and: [
            search
              ? {
                  $or: [
                    {
                      "productId.type.type": {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                    {
                      "productId.variety.variety": {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                  ],
                }
              : {},
          ],
        },
      },
      { $sort: { "productId.variety.product": 1 } },
    ]);
    for (const inventory of inventories) {
      if (inventory.consignment)
        inventory.consignment = await Purchase.findById(inventory.consignment)
          .populate("supplier")
          .select(["supplier", "consign"]);
      inventory.ready_to_sell = inventory.carry_over + inventory.purchase;
      inventory.remaining =
        inventory.ready_to_sell - inventory.sold - inventory.void;
    }
    res
      .status(200)
      .json(
        success(
          "Inventory fetched Successfully",
          { inventories },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getProductInventory = async (seller, productType) => {
  const inventories = await Inventory.aggregate([
    {
      $match: {
        seller: mongoose.Types.ObjectId(seller),
      },
    },
    {
      $lookup: {
        localField: "productId",
        foreignField: "_id",
        from: "sellerproducts",
        as: "productId",
      },
    },
    { $unwind: "$productId" },
    {
      $match: {
        "productId.type": mongoose.Types.ObjectId(productType),
      },
    },
    {
      $addFields: {
        ready_to_sell: { $add: ["$carry_over", "$purchase"] },
        return: { $add: ["$sold", "$void"] },
      },
    },
    {
      $addFields: {
        remaining: { $subtract: ["$ready_to_sell", "$return"] },
      },
    },
  ]);
  const remaining = inventories.reduce(function (a, b) {
    return a + b.remaining;
  }, 0);
  return remaining;
};

exports.resetInventory = async (req, res) => {
  try {
    const inventories = await Inventory.find({ seller: req.seller._id });
    for (const inventory of inventories) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        carry_over: 0,
        purchase: 0,
        sold: 0,
        void: 0,
      });
    }
    res
      .status(200)
      .json(success("Inventory Reset Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.resetCarryOver = async (req, res) => {
  try {
    const inventories = await Inventory.find({ seller: req.seller._id });
    for (const inventory of inventories) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        carry_over: 0,
      });
    }
    res
      .status(200)
      .json(success("Carry Over Reset Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.adjustCarryOver = async (req, res) => {
  try {
    const { carry_over, inventoryId } = req.body;
    if (!inventoryId) {
      return res
        .status(200)
        .json(error("Inventory id is required", res.statusCode));
    }
    const inventory_data = await Inventory.findById(inventoryId);
    if (!inventory_data) {
      return res
        .status(200)
        .json(error("Invalid inventory id", res.statusCode));
    }
    await Inventory.findByIdAndUpdate(inventoryId, {
      carry_over: carry_over,
    });
    res
      .status(200)
      .json(success("Carry Over Changed Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printInventory = async (req, res) => {
  try {
    const { active_consignment, search, station } = req.body;
    if (!station) {
      return res.status(200).json(error("Station is required", res.statusCode));
    }
    const station_data = await SellerStation.findById(station);
    if (!station_data) {
      return res.status(200).json(error("Invalid station id", res.statusCode));
    }
    const inventories = await Inventory.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
        },
      },
      {
        $lookup: {
          localField: "productId",
          foreignField: "_id",
          from: "sellerproducts",
          as: "productId",
        },
      },
      { $unwind: "$productId" },
      {
        $lookup: {
          localField: "productId.units",
          foreignField: "_id",
          from: "units",
          as: "productId.units",
        },
      },
      { $unwind: "$productId.units" },
      {
        $lookup: {
          localField: "productId.variety",
          foreignField: "_id",
          from: "productvarieties",
          as: "productId.variety",
        },
      },
      { $unwind: "$productId.variety" },
      {
        $lookup: {
          localField: "productId.type",
          foreignField: "_id",
          from: "producttypes",
          as: "productId.type",
        },
      },
      { $unwind: "$productId.type" },
      {
        $match: {
          $and: [
            search
              ? {
                  $or: [
                    {
                      "productId.type.type": {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                    {
                      "productId.variety.variety": {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                  ],
                }
              : {},
          ],
        },
      },
    ]);
    for (const inventory of inventories) {
      if (inventory.consignment)
        inventory.consignment = await Purchase.findById(inventory.consignment)
          .populate("supplier")
          .select(["supplier", "consign"]);
      inventory.ready_to_sell = inventory.carry_over + inventory.purchase;
      inventory.remaining =
        inventory.ready_to_sell - inventory.sold - inventory.void;
    }
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    var data = {
      list: inventories,
    };
    var html = ejs.render(template, { data: data });
    var options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/inventory.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
          res.download(res1.filename);
        }
      );
    res
      .status(200)
      .json(success("Carry Over Changed Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
