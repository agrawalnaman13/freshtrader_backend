const mongoose = require("mongoose");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getInventory = async (req, res, next) => {
  try {
    const { active_consignment, search } = req.body;
    console.log(req.body);
    const consignments = await Purchase.aggregate([
      {
        $project: {
          seller: 1,
          supplier: 1,
          status: 1,
          consign: 1,
          products: 1,
          createdAt: 1,
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
          day: {
            $dayOfMonth: "$createdAt",
          },
        },
      },
      {
        $match: {
          $and: [
            { seller: mongoose.Types.ObjectId(req.seller._id) },
            { year: new Date().getFullYear() },
            { month: new Date().getMonth() + 1 },
            { day: new Date().getDate() },
            active_consignment ? { status: "ACTIVE" } : {},
          ],
        },
      },
      {
        $lookup: {
          localField: "supplier",
          foreignField: "_id",
          from: "sellersuppliers",
          as: "supplier",
        },
      },
      { $unwind: "$supplier" },
      { $unwind: "$products" },
      {
        $lookup: {
          localField: "products.productId",
          foreignField: "_id",
          from: "sellerproducts",
          as: "products.productId",
        },
      },
      { $unwind: "$products.productId" },
      {
        $lookup: {
          localField: "products.unit",
          foreignField: "_id",
          from: "units",
          as: "products.unit",
        },
      },
      { $unwind: "$products.unit" },
      {
        $lookup: {
          localField: "products.productId.variety",
          foreignField: "_id",
          from: "productvarieties",
          as: "products.productId.variety",
        },
      },
      { $unwind: "$products.productId.variety" },
      {
        $lookup: {
          localField: "products.productId.type",
          foreignField: "_id",
          from: "producttypes",
          as: "products.productId.type",
        },
      },
      { $unwind: "$products.productId.type" },
      {
        $match: {
          $and: [
            search
              ? {
                  "products.productId.type.type": {
                    $regex: search,
                    $options: "$i",
                  },
                }
              : {},
          ],
        },
      },
      {
        $group: {
          _id: {
            product: "$products.productId",
            unit: "$products.unit",
          },
          count: { $sum: 1 },
          consign: { $addToSet: "$consign" },
          supplier: { $addToSet: "$supplier" },
          carry_over: { $addToSet: 0 },
          purchase: { $addToSet: "$products.received" },
          ready_to_sell: { $addToSet: "$products.received" },
          sold: { $addToSet: "$products.sold" },
          void: { $addToSet: 0 },
          remaining: {
            $addToSet: { $subtract: ["$products.received", "$products.sold"] },
          },
          physical_stock: {
            $addToSet: { $subtract: ["$products.received", "$products.sold"] },
          },
          diff: { $addToSet: 0 },
        },
      },
    ]);
    res
      .status(200)
      .json(
        success(
          "Inventory fetched Successfully",
          { consignments },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
