const mongoose = require("mongoose");
const Inventory = require("../../Models/SellerModels/inventorySchema");
const Purchase = require("../../Models/SellerModels/purchaseSchema");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const SellerStation = require("../../Models/SellerModels/sellerStationSchema");
const { success, error } = require("../../service_response/adminApiResponse");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const sendMail = require("../../services/mail");
const Activity = require("../../Models/SellerModels/activitySchema");
exports.createConsignment = async (req, res, next) => {
  try {
    const {
      supplier,
      co_op_agent,
      consign,
      con_id,
      consign_pallets,
      consign_notes,
      grading,
      grader_name,
      status,
      documents_received,
      purchase,
      products,
      staff,
    } = req.body;
    console.log(req.body);
    const consignment = await Purchase.create({
      seller: req.seller._id,
      supplier,
      co_op_agent,
      consign,
      con_id,
      consign_pallets,
      consign_notes,
      grading,
      grader_name,
      status,
      documents_received,
      purchase,
      products,
    });
    if (status === "ACTIVE") {
      for (const product of products) {
        await Inventory.create({
          seller: req.seller._id,
          productId: product.productId,
          consignment: consignment._id,
          purchase: +product.received,
        });
      }
      const myPallets = await SellerPallets.findOne({
        seller: req.seller._id,
        received_from: supplier,
      });
      if (!myPallets) {
        await SellerPallets.create({
          seller: req.seller._id,
          received_from: supplier,
          pallets_received: +consign_pallets,
        });
      } else {
        await SellerPallets.findOneAndUpdate(
          {
            seller: req.seller._id,
            received_from: supplier,
          },
          {
            pallets_received: myPallets.pallets_received + +consign_pallets,
          }
        );
      }
      const isPallets = await SellerPallets.findOne({
        seller: req.seller._id,
        pallets_taken: 0,
        pallets_received: 0,
      });
      if (!isPallets) {
        await SellerPallets.create({
          seller: req.seller._id,
          pallets_on_hand: +consign_pallets,
          pallets_taken: 0,
          pallets_received: 0,
        });
      } else {
        await SellerPallets.findOneAndUpdate(
          {
            seller: req.seller._id,
            pallets_taken: 0,
            pallets_received: 0,
          },
          {
            pallets_on_hand: isPallets.pallets_on_hand + +consign_pallets,
          }
        );
      }
    }
    let query = {
      seller: req.seller._id,
      event: "Consignment Created",
      info: [`#${consignment.consign} Created`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
    res
      .status(200)
      .json(
        success(
          "Consignment Created Successfully",
          { consignment },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addProductInConsignment = async (req, res, next) => {
  try {
    const { products, consignmentId, staff } = req.body;
    console.log(req.body);
    if (!products.length) {
      return res
        .status(200)
        .json(error("Please provide product", res.statusCode));
    }
    if (!consignmentId) {
      return res
        .status(200)
        .json(error("Please provide consignment Id", res.statusCode));
    }
    const consignment = await Purchase.findById(consignmentId);
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
    consignment.products = products;
    await consignment.save();
    let query = {
      seller: req.seller._id,
      event: "Consignment Edit",
      info: [`#${consignment.consign} Edited`, "New Product Added"],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
    res
      .status(200)
      .json(
        success(
          "Product Added in Consignment Successfully",
          { consignment },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.removeProductFromConsignment = async (req, res, next) => {
  try {
    const { productId, consignmentId, staff } = req.body;
    console.log(req.body);
    if (!productId) {
      return res
        .status(200)
        .json(error("Please provide product id", res.statusCode));
    }
    if (!consignmentId) {
      return res
        .status(200)
        .json(error("Please provide consignment Id", res.statusCode));
    }
    const consignment = await Purchase.findById(consignmentId);
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
    const product = consignment.products.filter(
      (pr) => String(pr.productId) === String(productId)
    );
    if (!product.length) {
      return res.status(200).json(error("Invalid product Id", res.statusCode));
    }
    consignment.products = consignment.products.filter(
      (pr) => String(pr.productId) !== String(productId)
    );
    await consignment.save();
    let query = {
      seller: req.seller._id,
      event: "Consignment Edit",
      info: [`#${consignment.consign} Edited`, "A Product is Removed"],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
    res
      .status(200)
      .json(
        success(
          "Product Removed from Consignment Successfully",
          { consignment },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.changeConsignmentStatus = async (req, res, next) => {
  try {
    const { consignmentId, status, completion_date, staff } = req.body;
    console.log(req.body);
    if (!status) {
      return res
        .status(200)
        .json(error("Please provide status", res.statusCode));
    }
    if (!consignmentId) {
      return res
        .status(200)
        .json(error("Please provide consignment Id", res.statusCode));
    }
    const consignment = await Purchase.findById(consignmentId);
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
    consignment.status = status;
    if (status === "ACTIVE") {
      for (const product of consignment.products) {
        await Inventory.create({
          seller: req.seller._id,
          productId: product.productId,
          consignment: consignment._id,
          purchase: +product.received,
        });
        const myPallets = await SellerPallets.findOne({
          seller: req.seller._id,
          received_from: consignment.supplier,
        });
        if (!myPallets) {
          await SellerPallets.create({
            seller: req.seller._id,
            received_from: consignment.supplier,
            pallets_received: +consignment.consign_pallets,
          });
        } else {
          await SellerPallets.findOneAndUpdate(
            {
              seller: req.seller._id,
              received_from: consignment.supplier,
            },
            {
              pallets_received:
                myPallets.pallets_received + +consignment.consign_pallets,
            }
          );
        }
        const isPallets = await SellerPallets.findOne({
          seller: req.seller._id,
          pallets_taken: 0,
          pallets_received: 0,
        });
        if (!isPallets) {
          await SellerPallets.create({
            seller: req.seller._id,
            pallets_on_hand: +consignment.consign_pallets,
            pallets_taken: 0,
            pallets_received: 0,
          });
        } else {
          await SellerPallets.findOneAndUpdate(
            {
              seller: req.seller._id,
              pallets_taken: 0,
              pallets_received: 0,
            },
            {
              pallets_on_hand:
                isPallets.pallets_on_hand - +consignment.consign_pallets,
            }
          );
        }
      }
      if (completion_date) {
        consignment.completion_date = new Date(completion_date);
      }
    } else if (status === "COMPLETE") {
      const inventories = await Inventory.find({
        seller: req.seller._id,
        consignment: consignment._id,
      });
      for (const inventory of inventories) {
        await Inventory.findByIdAndDelete(inventory._id);
      }
    }
    await consignment.save();
    let query = {
      seller: req.seller._id,
      event: "Consignment Edit",
      info: [`#${consignment.consign} Edited`, `Status Changed to ${status}`],
    };
    if (staff) query.account = staff;
    await Activity.create(query);
    res
      .status(200)
      .json(
        success(
          "Consignment Status Changed Successfully",
          { consignment },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getConsignments = async (req, res, next) => {
  try {
    const { sortBy, filterBy, from, till, search } = req.body;
    console.log(req.body);
    const consignments = await Purchase.aggregate([
      {
        $project: {
          seller: 1,
          supplier: 1,
          co_op_agent: 1,
          consign: 1,
          con_id: 1,
          consign_pallets: 1,
          consign_notes: 1,
          grading: 1,
          grader_name: 1,
          status: 1,
          documents_received: 1,
          purchase: 1,
          products: 1,
          createdAt: 1,
          completion_date: 1,
        },
      },
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
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
      {
        $addFields: {
          type: "$co_op_agent" ? "CO-OP" : "",
          documents: "$documents_received" ? "COMPLETE" : "MISSING",
        },
      },
      {
        $match: {
          $and: [
            from ? { createdAt: { $gte: new Date(from) } } : {},
            till ? { createdAt: { $lte: new Date(till) } } : {},
            filterBy === 1 ? { status: "ACTIVE" } : {},
            filterBy === 2 ? { status: "ON HOLD" } : {},
            filterBy === 3 ? { status: "COMPLETE" } : {},
            filterBy === 4 ? { status: "AWAITING DELIVERY" } : {},
            filterBy === 5 ? { documents: "COMPLETE" } : {},
            filterBy === 6 ? { documents: "MISSING" } : {},
            search
              ? {
                  $or: [
                    {
                      "supplier.business_trading_name": {
                        $regex: search,
                        $options: "$i",
                      },
                    },
                    {
                      con_id: {
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
      {
        $sort:
          sortBy === 1
            ? { "supplier.business_trading_name": 1 }
            : sortBy === 2
            ? { documents: 1 }
            : sortBy === 6
            ? { completion_date: 1 }
            : sortBy === 7
            ? { completion_date: -1 }
            : { createdAt: -1 },
      },
    ]);
    let list = [];
    for (const consignment of consignments) {
      const prices = consignment.products.map(({ total_cost }) => total_cost);
      if (prices.length === consignment.products.length)
        consignment.priced = "PRICED";
      else consignment.priced = "PENDING";
      consignment.value = prices.reduce((partialSum, a) => partialSum + a, 0);
      const received = consignment.products.reduce(function (a, b) {
        return a + b.received ? b.received : 0;
      }, 0);
      const sold = consignment.products.reduce(function (a, b) {
        return a + b.sold ? b.sold : 0;
      }, 0);
      consignment.sold_percentage = (sold / received) * 100;

      if (filterBy === 7) {
        if (consignment.priced === "PRICED") list.push(consignment);
      } else if (filterBy === 8) {
        if (consignment.priced === "PENDING") list.push(consignment);
      } else list.push(consignment);
    }

    if (sortBy === 3)
      list.sort((a, b) =>
        a.priced > b.priced ? 1 : b.priced > a.priced ? -1 : 0
      );
    else if (sortBy === 4)
      list.sort((a, b) => (a.value < b.value ? 1 : b.value < a.value ? -1 : 0));
    else if (sortBy === 5)
      list.sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0));
    res
      .status(200)
      .json(
        success(
          "Consignment fetched Successfully",
          { consignments: list },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteConsignment = async (req, res, next) => {
  try {
    const consignment = await Purchase.findById(req.params.id);
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
    await Purchase.findByIdAndDelete(req.params.id);
    const inventories = await Inventory.find({
      seller: req.seller._id,
      consignment: req.params.id,
    });
    for (const inventory of inventories) {
      await Inventory.findByIdAndDelete(inventory._id);
    }
    res
      .status(200)
      .json(success("Consignment Deleted Successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getConsignmentDetail = async (req, res, next) => {
  try {
    const consignment = await Purchase.findById(req.params.id)
      .populate("supplier")
      .lean();
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
    for (const con of consignment.products) {
      con.productId = await SellerProduct.findById(con.productId).populate([
        "variety",
        "type",
        "units",
      ]);
    }
    res
      .status(200)
      .json(
        success(
          "Consignment fetched Successfully",
          { consignment },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.printConsignment = async (req, res, next) => {
  try {
    const { consignmentId, stationId, type } = req.body;
    console.log(req.body);
    if (!consignmentId) {
      return res
        .status(200)
        .json(error("Please provide consignment Id", res.statusCode));
    }
    const consignment = await Purchase.findById(consignmentId);
    if (!consignment) {
      return res
        .status(200)
        .json(error("Invalid consignment Id", res.statusCode));
    }
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
      return res
        .status(200)
        .json(error("Please provide print type", res.statusCode));
    }
    for (const con of consignment.products) {
      con.productId = await SellerProduct.findById(con.productId).populate([
        "variety",
        "type",
        "units",
      ]);
    }
    const dirPath = path.join(
      __dirname.replace("SellerController", "templates"),
      "/smcs_report.html"
    );
    const template = fs.readFileSync(dirPath, "utf8");
    const data = consignment;
    const html = ejs.render(template, { data: data });
    const options = { format: "Letter" };
    pdf
      .create(html, options)
      .toFile(
        `./public/sellers/${req.seller._id}/smcs_report.pdf`,
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
            file: `${process.env.BASE_URL}/Sellers/${req.seller._id}/smcs_report.pdf`,
          },
          res.statusCode
        )
      );
    } else {
      await sendMail(station.a4_printer.email, "Consignment", "");
      res
        .status(200)
        .json(
          success(
            type === 1
              ? "Consignment Info Printed Successfully"
              : "Consignment Balance Printed Successfully",
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
