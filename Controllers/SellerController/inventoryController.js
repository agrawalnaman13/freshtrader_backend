const mongoose = require("mongoose");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const moment = require("moment");
const SellerSupplier = require("../../Models/SellerModels/sellerSuppliersSchema");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
exports.getInventory = async (req, res, next) => {
  try {
    const { active_consignment, search } = req.body;
    console.log(req.body);
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
