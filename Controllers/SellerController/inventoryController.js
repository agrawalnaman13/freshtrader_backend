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
const sendMail = require("../../services/mail");
exports.getInventory = async (req, res) => {
  try {
    const { search, active_consignment } = req.body;
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
    let list = [];
    for (const inventory of inventories) {
      if (inventory.consignment)
        inventory.consignment = await Purchase.findById(inventory.consignment)
          .populate("supplier")
          .select(["supplier", "consign", "status"]);
      inventory.remaining =
        inventory.purchase - inventory.sold - inventory.void;
      inventory.total_sold = inventory.total_sold ? inventory.total_sold : 0;
      if (active_consignment) {
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
                $eq: mongoose.Types.ObjectId(inventory.productId._id),
              },
            },
          },
        ]);
        if (consignment.length) list.push(inventory);
      } else list.push(inventory);
    }
    res
      .status(200)
      .json(
        success(
          "Inventory fetched Successfully",
          { inventories: list },
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

exports.updateOverselling = async (req, res) => {
  try {
    const { allow_overselling } = req.body;
    const seller = await Wholeseller.findById(req.seller._id);
    seller.allow_overselling = allow_overselling;
    await seller.save();
    res
      .status(200)
      .json(success("Overselling updated Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.resetInventory = async (req, res) => {
  try {
    const inventories = await Inventory.find({ seller: req.seller._id });
    for (const inventory of inventories) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        sold: 0,
        physical_stock: 0,
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
        carry_over: inventory.physical_stock
          ? inventory.physical_stock
          : inventory.remaining,
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

exports.resetSoldToday = async (req, res) => {
  try {
    const inventories = await Inventory.find({ seller: req.seller._id });
    for (const inventory of inventories) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        sold: 0,
      });
    }
    res
      .status(200)
      .json(success("Today's Sales Reset Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.resetPhysicalStock = async (req, res) => {
  try {
    const inventories = await Inventory.find({ seller: req.seller._id });
    for (const inventory of inventories) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        physical_stock: 0,
      });
    }
    res
      .status(200)
      .json(success("Physical Stock Reset Successful", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.adjustCarryOver = async (req, res) => {
  try {
    const { inventoryIds } = req.body;
    if (!inventoryIds.length) {
      return res
        .status(200)
        .json(error("Inventory id is required", res.statusCode));
    }
    for (const inventory of inventoryIds) {
      await Inventory.findByIdAndUpdate(inventory._id, {
        carry_over: +inventory.carry_over,
      });
    }
    res
      .status(200)
      .json(success("Carry Over Changed Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.adjustInventory = async (req, res) => {
  try {
    const { inventoryId, physical_stock, purchase, total_sold, voids } =
      req.body;
    if (!inventoryId) {
      return res
        .status(200)
        .json(error("Inventory id is required", res.statusCode));
    }
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res
        .status(200)
        .json(error("Invalid inventory id", res.statusCode));
    }
    await Inventory.findByIdAndUpdate(inventoryId, {
      physical_stock: +physical_stock,
      purchase: +purchase,
      total_sold: +total_sold,
      void: +voids,
    });
    if (
      inventory.purchase !== +purchase ||
      inventory.total_sold !== +total_sold ||
      inventory.void !== +voids
    ) {
      const consignment = await Purchase.findById(inventory.consignment);
      consignment.products = consignment.products.map((p) => {
        if (String(p.productId) === String(inventory.productId)) {
          p.received = +purchase;
          p.sold = +total_sold;
          p.void = +voids;
          p.total_cost = (p.received * p.cost_per_unit).toFixed(2);
          p.sold_percentage = ((p.sold / p.received) * 100).toFixed(2);
          p.total_sales = (p.sold * p.average_sales_price).toFixed(2);
          p.inv_on_hand = (p.received - p.sold - p.void).toFixed(2);
          p.gross_profit = (
            p.received * p.cost_per_unit -
            p.total_sales
          ).toFixed(2);
          p.gross_profit_percentage = (
            (p.gross_profit / p.total_sales) *
            100
          ).toFixed(2);
        }
        return p;
      });
      await consignment.save();
    }
    res
      .status(200)
      .json(success("Inventory Updated Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.undoInventory = async (req, res) => {
  try {
    const { inventoryIds } = req.body;
    console.log(req.body);
    if (!inventoryIds.length) {
      return res
        .status(200)
        .json(error("Inventory id is required", res.statusCode));
    }
    for (const inventoryId of inventoryIds) {
      const inventory = await Inventory.findById(inventoryId._id);
      await Inventory.findByIdAndUpdate(inventory._id, {
        physical_stock: +inventoryId.physical_stock,
        purchase: +inventoryId.purchase,
        total_sold: +inventoryId.total_sold,
        void: +inventoryId.voids,
        carry_over: +inventoryId.carry_over,
      });
      if (
        inventory.purchase !== +inventoryId.purchase ||
        inventory.total_sold !== +inventoryId.total_sold ||
        inventory.void !== +inventoryId.voids
      ) {
        const consignment = await Purchase.findById(inventory.consignment);
        consignment.products = consignment.products.map((p) => {
          if (String(p.productId) === String(inventory.productId)) {
            p.received = +inventoryId.purchase;
            p.sold = +inventoryId.total_sold;
            p.void = +inventoryId.voids;
            p.total_cost = (p.received * p.cost_per_unit).toFixed(2);
            p.sold_percentage = ((p.sold / p.received) * 100).toFixed(2);
            p.total_sales = (p.sold * p.average_sales_price).toFixed(2);
            p.inv_on_hand = (p.received - p.sold - p.void).toFixed(2);
            p.gross_profit = (
              p.received * p.cost_per_unit -
              p.total_sales
            ).toFixed(2);
            p.gross_profit_percentage = (
              (p.gross_profit / p.total_sales) *
              100
            ).toFixed(2);
          }
          return p;
        });
        await consignment.save();
      }
    }
    res
      .status(200)
      .json(success("Inventory Updated Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printInventory = async (req, res) => {
  try {
    const { stationId, search, active_consignment, type } = req.body;
    if (!stationId) {
      return res
        .status(200)
        .json(error("Please provide station Id", res.statusCode));
    }
    const station = await SellerStation.findById(stationId);
    if (!station) {
      return res.status(200).json(error("Invalid station Id", res.statusCode));
    }
    if (!station.a4_printer.email && !station.a4_printer.local) {
      return res
        .status(200)
        .json(error("No A4 Printer added in selected station", res.statusCode));
    }
    if (!type) {
      return res.status(200).json(error("Please provide type", res.statusCode));
    }
    const seller = await Wholeseller.findById(req.seller._id);
    let category = [];
    if (seller.market === "Sydney Produce and Growers Market")
      category = ["Fruits", "Herbs", "Vegetables", "Others"];
    else category = ["Flowers", "Foliage"];
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
    let list = [];
    for (const inventory of inventories) {
      if (inventory.consignment)
        inventory.consignment = await Purchase.findById(inventory.consignment)
          .populate("supplier")
          .select(["supplier", "consign", "status"]);
      inventory.remaining =
        inventory.purchase - inventory.sold - inventory.void;
      inventory.total_sold = inventory.total_sold ? inventory.total_sold : 0;
      if (active_consignment) {
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
                $eq: mongoose.Types.ObjectId(inventory.productId._id),
              },
            },
          },
        ]);
        if (consignment.length) list.push(inventory);
      } else list.push(inventory);
    }
    let dirPath;
    if (type === 1) {
      dirPath = path.join(
        __dirname.replace("SellerController", "templates"),
        "/smcs_report.html"
      );
    } else {
      dirPath = path.join(
        __dirname.replace("SellerController", "templates"),
        "/smcs_report.html"
      );
    }
    const template = fs.readFileSync(dirPath, "utf8");
    const data = {
      list: inventories,
    };
    const html = ejs.render(template, { data: data });
    const options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        type === 1
          ? `./public/sellers/${req.seller._id}/running_balance.pdf`
          : `./public/sellers/${req.seller._id}/stock_sheet.pdf`,
        function (err, res1) {
          if (err) return console.log(err);
          console.log(res1);
        }
      );
    if (station.a4_printer.local) {
      res.status(200).json(
        success(
          "success",
          {
            file:
              type === 1
                ? `${process.env.BASE_URL}/Sellers/${req.seller._id}/running_balance.pdf`
                : `${process.env.BASE_URL}/Sellers/${req.seller._id}/stock_sheet.pdf`,
          },
          res.statusCode
        )
      );
    } else {
      await sendMail(
        station.a4_printer.email,
        type === 1 ? "Running Balance" : "Stock Sheet",
        ""
      );
      res
        .status(200)
        .json(
          success(
            type === 1
              ? "Running Balance Printed Successfully"
              : "Stock Sheet Printed Successfully",
            {},
            res.statusCode
          )
        );
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.updateInventory = async () => {
  try {
    const inventories = await Inventory.find({
      consignment: { $exists: true },
    });
    for (const inventory of inventories) {
      inventory.remaining =
        inventory.purchase - inventory.total_sold - inventory.void;
      // if (inventory.remaining <= 0 && inventory.physical_stock <= 0) {
      //   await Inventory.findByIdAndDelete(inventory._id);
      // } else {
      const carry_over = inventory.physical_stock
        ? inventory.physical_stock
        : inventory.remaining;
      await Inventory.findByIdAndUpdate(inventory._id, {
        carry_over: carry_over,
        sold: 0,
      });
      //}
    }
    return;
  } catch (err) {
    console.log(err);
    return;
  }
};
