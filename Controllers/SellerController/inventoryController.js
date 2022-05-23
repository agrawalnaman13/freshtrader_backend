const mongoose = require("mongoose");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const moment = require("moment");
const SellerSupplier = require("../../Models/SellerModels/sellerSuppliersSchema");
exports.getInventory = async (req, res, next) => {
  try {
    const { active_consignment, search } = req.body;
    console.log(req.body);
    const inventory = await Inventory.aggregate([
      {
        $project: {
          seller: 1,
          consignment: 1,
          productId: 1,
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
          seller: mongoose.Types.ObjectId(req.seller._id),
          $and: [
            { year: new Date().getFullYear() },
            { month: new Date().getMonth() + 1 },
            { day: new Date().getDate() },
            active_consignment ? { status: "ACTIVE" } : {},
          ],
        },
      },
      {
        $lookup: {
          localField: "consignment",
          foreignField: "_id",
          from: "purchases",
          as: "consignment",
        },
      },
      { $unwind: "$consignment" },
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
        $lookup: {
          localField: "consignment.supplier",
          foreignField: "_id",
          from: "sellersuppliers",
          as: "consignment.supplier",
        },
      },
      { $unwind: "$consignment.supplier" },
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
                    {
                      "consignment.supplier.business_trading_name": {
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
    let list = [];
    const products = await SellerProduct.find({
      seller: req.seller._id,
    }).populate(["variety", "type", "units"]);
    const targetDate = moment(Date.now());
    const from = targetDate.startOf("day").toDate();
    for (const product of products) {
      let data = { product: product, productList: [] };
      const isProduct = inventory.filter(
        (prod) => String(prod.productId._id) === String(product._id)
      );
      const inventories = await Inventory.find({
        seller: req.seller._id,
        productId: product._id,
        createdAt: {
          $lt: from,
        },
      })
        .populate("consignment")
        .sort({ createdAt: -1 });
      let carry_over = 0,
        supplier = "";
      if (inventories.length) {
        const inv_product = inventories[0].consignment.products.filter(
          (prod) => String(prod.productId) === String(inventories[0].productId)
        );
        if (inv_product.length) {
          carry_over =
            inv_product[0].received - inv_product[0].sold - inv_product[0].void;
          supplier = await SellerSupplier.findById(
            inventories[0].consignment.supplier
          );
        }
      }
      if (isProduct.length) {
        for (const inv of isProduct) {
          inv.product = inv.consignment.products.filter(
            (prod) => String(prod.productId) === String(inv.productId._id)
          )[0];
          inv.product.supplier = inv.consignment.supplier;
          inv.product.carry_over = carry_over;
          inv.product.ready_to_sell =
            inv.product.carry_over + inv.product.received;
          inv.product.remaining =
            inv.product.ready_to_sell - inv.product.sold - inv.product.void;
          data.productList.push(inv.product);
        }
        data.productList.push({
          received: data.productList.reduce(function (a, b) {
            return a + b.received;
          }, 0),
          carry_over: data.productList.reduce(function (a, b) {
            return a + b.carry_over;
          }, 0),
          sold: data.productList.reduce(function (a, b) {
            return a + b.sold;
          }, 0),
          void: data.productList.reduce(function (a, b) {
            return a + b.void;
          }, 0),
          ready_to_sell: data.productList.reduce(function (a, b) {
            return a + b.ready_to_sell;
          }, 0),
          remaining: data.productList.reduce(function (a, b) {
            return a + b.remaining;
          }, 0),
          supplier: "",
        });
      } else {
        if (carry_over) {
          data.productList.push({
            received: 0,
            carry_over: carry_over,
            sold: 0,
            void: 0,
            ready_to_sell: carry_over,
            remaining: carry_over,
            supplier: supplier,
          });
          data.productList.push({
            received: data.productList.reduce(function (a, b) {
              return a + b.received;
            }, 0),
            carry_over: data.productList.reduce(function (a, b) {
              return a + b.carry_over;
            }, 0),
            sold: data.productList.reduce(function (a, b) {
              return a + b.sold;
            }, 0),
            void: data.productList.reduce(function (a, b) {
              return a + b.void;
            }, 0),
            ready_to_sell: data.productList.reduce(function (a, b) {
              return a + b.ready_to_sell;
            }, 0),
            remaining: data.productList.reduce(function (a, b) {
              return a + b.remaining;
            }, 0),
            supplier: "",
          });
        } else {
          data.productList.push({
            received: 0,
            carry_over: carry_over,
            sold: 0,
            void: 0,
            ready_to_sell: carry_over,
            remaining: carry_over,
            supplier: "",
          });
        }
      }
      list.push(data);
    }
    res
      .status(200)
      .json(
        success(
          "Inventory fetched Successfully",
          { inventory: list },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
