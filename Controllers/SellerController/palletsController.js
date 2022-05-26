const mongoose = require("mongoose");
const Buyer = require("../../Models/BuyerModels/buyerSchema");
const SellerPallets = require("../../Models/SellerModels/sellerPalletsSchema");
const SellerSupplier = require("../../Models/SellerModels/sellerSuppliersSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getPallets = async (req, res, next) => {
  try {
    const { filterBy, sortBy } = req.body;
    const sellerPallets = await SellerPallets.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
          $or: [
            { pallets_received: { $ne: 0 } },
            { pallets_taken: { $ne: 0 } },
          ],
          $and: [
            filterBy === 1 ? { pallets_received: { $exists: true } } : {},
            filterBy === 2 ? { pallets_taken: { $exists: true } } : {},
          ],
        },
      },
      {
        $lookup: {
          localField: "received_from",
          foreignField: "_id",
          from: "sellersuppliers",
          as: "supplier",
        },
      },
      {
        $lookup: {
          localField: "taken_by",
          foreignField: "_id",
          from: "buyers",
          as: "buyer",
        },
      },
      {
        $addFields: {
          total_pallets: "$pallets_received"
            ? "$pallets_received"
            : "$pallets_taken",
        },
      },
      {
        $sort:
          sortBy === 3
            ? { total_pallets: 1 }
            : sortBy === 4
            ? { total_pallets: -1 }
            : { createdAt: 1 },
      },
    ]);
    for (const pallets of sellerPallets) {
      if (pallets.supplier.length) pallets.supplier = pallets.supplier[0];
      else pallets.supplier = pallets.buyer[0];
    }
    if (sortBy === 1) {
      sellerPallets.sort((a, b) =>
        a.supplier.business_trading_name > b.supplier.business_trading_name
          ? 1
          : b.supplier.business_trading_name > a.supplier.business_trading_name
          ? -1
          : 0
      );
    } else if (sortBy === 2) {
      sellerPallets.sort((a, b) =>
        a.supplier.business_trading_name < b.supplier.business_trading_name
          ? 1
          : b.supplier.business_trading_name < a.supplier.business_trading_name
          ? -1
          : 0
      );
    }
    res
      .status(200)
      .json(
        success(
          "Pallets fetched successfully",
          { sellerPallets },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addPalletsReceived = async (req, res, next) => {
  try {
    const { supplierId, pallets } = req.body;
    console.log(req.body);
    if (!supplierId) {
      return res
        .status(200)
        .json(error("Please provide supplier id", res.statusCode));
    }
    if (!pallets) {
      return res
        .status(200)
        .json(error("Please provide number of pallets", res.statusCode));
    }
    const supplier = await SellerSupplier.findById(supplierId);
    if (!supplier) {
      return res.status(200).json(error("Invalid supplier id", res.statusCode));
    }
    const myPallets = await SellerPallets.findOne({
      seller: req.seller._id,
      received_from: supplierId,
    });
    let sellerPallets = {};
    if (!myPallets) {
      sellerPallets = await SellerPallets.create({
        seller: req.seller._id,
        received_from: supplierId,
        pallets_received: +pallets,
      });
    } else {
      sellerPallets = await SellerPallets.findOneAndUpdate(
        {
          seller: req.seller._id,
          received_from: supplierId,
        },
        {
          pallets_received: myPallets.pallets_received + +pallets,
        }
      );
    }
    res
      .status(200)
      .json(
        success("Pallets added successfully", { sellerPallets }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addPalletsTaken = async (req, res, next) => {
  try {
    const { buyerId, pallets } = req.body;
    console.log(req.body);
    if (!buyerId) {
      return res
        .status(200)
        .json(error("Please provide buyer id", res.statusCode));
    }
    if (!pallets) {
      return res
        .status(200)
        .json(error("Please provide number of pallets", res.statusCode));
    }
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(200).json(error("Invalid buyer id", res.statusCode));
    }
    const myPallets = await SellerPallets.findOne({
      seller: req.seller._id,
      taken_by: buyerId,
    });
    let sellerPallets = {};
    if (!myPallets) {
      sellerPallets = await SellerPallets.create({
        seller: req.seller._id,
        taken_by: buyerId,
        pallets_taken: +pallets,
      });
    } else {
      sellerPallets = await SellerPallets.findOneAndUpdate(
        {
          seller: req.seller._id,
          taken_by: buyerId,
        },
        {
          pallets_taken: myPallets.pallets_taken + +pallets,
        }
      );
    }
    res
      .status(200)
      .json(
        success("Pallets added successfully", { sellerPallets }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addPalletsOnHand = async (req, res, next) => {
  try {
    const { pallets } = req.body;
    console.log(req.body);
    if (!pallets) {
      return res
        .status(200)
        .json(error("Please provide number of pallets", res.statusCode));
    }
    const myPallets = await SellerPallets.find({
      seller: req.seller._id,
    });
    const pallets_received = myPallets.reduce(function (a, b) {
      return a + b.pallets_received ? b.pallets_received : 0;
    }, 0);
    const pallets_taken = myPallets.reduce(function (a, b) {
      return a + b.pallets_taken ? b.pallets_taken : 0;
    }, 0);
    if (pallets < pallets_received - pallets_taken) {
      return res
        .status(200)
        .json(error("Incorrect pallets on hand", res.statusCode));
    }
    const isPallets = await SellerPallets.findOne({
      seller: req.seller._id,
      pallets_taken: 0,
      pallets_received: 0,
    });
    let sellerPallets = {};
    if (!isPallets) {
      sellerPallets = await SellerPallets.create({
        seller: req.seller._id,
        pallets_on_hand: +pallets,
        pallets_taken: 0,
        pallets_received: 0,
      });
    } else {
      sellerPallets = await SellerPallets.findOneAndUpdate(
        {
          seller: req.seller._id,
          pallets_taken: 0,
          pallets_received: 0,
        },
        {
          pallets_on_hand: +pallets,
        }
      );
    }
    res
      .status(200)
      .json(
        success("Pallets added successfully", { sellerPallets }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getPalletsCount = async (req, res, next) => {
  try {
    const myPallets = await SellerPallets.find({
      seller: req.seller._id,
    });
    const pallets_received = myPallets.reduce(function (a, b) {
      return a + (b.pallets_received ? b.pallets_received : 0);
    }, 0);
    const pallets_taken = myPallets.reduce(function (a, b) {
      return a + (b.pallets_taken ? b.pallets_taken : 0);
    }, 0);
    const pallets_on_hand = myPallets.reduce(function (a, b) {
      return a + (b.pallets_on_hand ? b.pallets_on_hand : 0);
    }, 0);
    res
      .status(200)
      .json(
        success(
          "Pallets count fetched successfully",
          { pallets_received, pallets_taken, pallets_on_hand },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.returnPallets = async (req, res, next) => {
  try {
    const { palletId, pallets } = req.body;
    console.log(req.body);
    if (!pallets) {
      return res
        .status(200)
        .json(error("Please provide number of pallets", res.statusCode));
    }
    if (!palletId) {
      return res
        .status(200)
        .json(error("Please provide pallet id", res.statusCode));
    }
    const myPallets = await SellerPallets.findById(palletId);
    if (!myPallets) {
      return res.status(200).json(error("Invalid pallet id", res.statusCode));
    }
    if (myPallets.pallets_received) {
      myPallets.pallets_received -= pallets;
    }
    if (myPallets.pallets_taken) {
      myPallets.pallets_taken -= pallets;
    }
    await myPallets.save();
    res
      .status(200)
      .json(
        success(`${pallets} pallets returned successfully`, {}, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
