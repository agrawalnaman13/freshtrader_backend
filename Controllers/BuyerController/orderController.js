const mongoose = require("mongoose");
const Order = require("../../Models/BuyerModels/orderSchema");
const Cart = require("../../Models/BuyerModels/cartSchema");
const SellerPartnerBuyers = require("../../Models/SellerModels/partnerBuyersSchema");
const SellerProduct = require("../../Models/SellerModels/sellerProductSchema");
const Wholeseller = require("../../Models/SellerModels/wholesellerSchema");
const { success, error } = require("../../service_response/adminApiResponse");
exports.getSellers = async (req, res, next) => {
  try {
    const sellers = await SellerPartnerBuyers.find({
      buyer: req.buyer._id,
      status: true,
    })
      .populate("seller")
      .select("-seller.password");
    res
      .status(200)
      .json(
        success("Sellers fetched successfully", { sellers }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getSellersProducts = async (req, res, next) => {
  try {
    const { seller, sortBy, search } = req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Please provide seller id", res.statusCode));
    }
    const sellerData = await Wholeseller.findById(seller);
    if (!sellerData) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    const products = await SellerProduct.aggregate([
      { $match: { seller: mongoose.Types.ObjectId(seller) } },
      {
        $lookup: {
          localField: "type",
          foreignField: "_id",
          from: "producttypes",
          as: "type",
        },
      },
      { $unwind: "$type" },
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
      { $unwind: "$grades" },
      {
        $match: {
          $or: [
            search ? { "type.type": { $regex: search, $options: "$i" } } : {},
            search
              ? { "variety.variety": { $regex: search, $options: "$i" } }
              : {},
            // { suppliers: { $elemArray: { $regex: search, $options: "$i" } } },
          ],
        },
      },
      {
        $sort:
          sortBy === 1 ? { "variety.variety": 1 } : { "variety.variety": -1 },
      },
    ]);
    res
      .status(200)
      .json(
        success("Products fetched successfully", { products }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { seller, productId, quantity, grade } = req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Please provide seller id", res.statusCode));
    }
    const sellerData = await Wholeseller.findById(seller);
    if (!sellerData) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    if (!productId) {
      return res
        .status(200)
        .json(error("Please provide product Id", res.statusCode));
    }
    const product = await SellerProduct.findById(productId);
    if (!product) {
      return res.status(200).json(error("Invalid product id", res.statusCode));
    }
    if (!quantity) {
      return res
        .status(200)
        .json(error("Please provide quantity", res.statusCode));
    }
    if (!grade) {
      return res
        .status(200)
        .json(error("Please provide grade", res.statusCode));
    }
    const cart = await Cart.findOne({
      buyer: req.buyer._id,
      seller,
    });
    if (cart) {
      const isAdded = cart.product.filter(
        (pr) => String(pr.productId) === String(productId) && pr.grade === grade
      );
      if (isAdded.length) {
        cart.product = cart.product.map((pr) => {
          if (String(pr.productId) === String(productId) && pr.grade === grade)
            pr.quantity += +quantity;
          return pr;
        });
      } else {
        cart.product.push({
          productId: productId,
          quantity: +quantity,
          grade: grade,
        });
      }
      await Cart.findOneAndUpdate(
        {
          buyer: req.buyer._id,
          seller,
        },
        {
          product: cart.product,
        }
      );
    } else {
      await Cart.create({
        buyer: req.buyer._id,
        seller: seller,
        product: [
          {
            productId: productId,
            quantity: +quantity,
            grade: grade,
          },
        ],
      });
    }
    res
      .status(200)
      .json(success("Product added in cart successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getMyCart = async (req, res, next) => {
  try {
    const cart = await Cart.find({
      buyer: req.buyer._id,
    })
      .populate("seller")
      .select("-seller.password");
    res
      .status(200)
      .json(success("Cart fetched successfully", { cart }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getCartDetails = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.id)
      .populate("seller")
      .select("-seller.password")
      .lean();
    for (const product of cart.product) {
      product.product = await SellerProduct.findById(product.productId)
        .populate(["variety", "type", "units"])
        .select(["category", "variety", "type", "units"]);
    }
    res
      .status(200)
      .json(
        success("Order detail fetched successfully", { cart }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.deleteFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
      return res.status(200).json(error("Invalid cart id", res.statusCode));
    }
    await Cart.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json(
        success("Product removed from cart successfully", {}, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.orderProduct = async (req, res, next) => {
  try {
    const { seller, product, pick_up_date, pick_up_time, notes, payment } =
      req.body;
    console.log(req.body);
    if (!seller) {
      return res
        .status(200)
        .json(error("Please provide seller id", res.statusCode));
    }
    if (!product.length) {
      return res
        .status(200)
        .json(error("Please provide products", res.statusCode));
    }
    const sellerData = await Wholeseller.findById(seller);
    if (!sellerData) {
      return res.status(200).json(error("Invalid seller id", res.statusCode));
    }
    if (!pick_up_date) {
      return res
        .status(200)
        .json(error("Please provide pickup date", res.statusCode));
    }
    if (!pick_up_time) {
      return res
        .status(200)
        .json(error("Please provide pickup time", res.statusCode));
    }
    if (!notes) {
      return res
        .status(200)
        .json(error("Please provide notes", res.statusCode));
    }
    if (!payment) {
      return res
        .status(200)
        .json(error("Please provide payment mode", res.statusCode));
    }
    const order = await Order.create({
      buyer: req.buyer._id,
      seller,
      product,
      pick_up_date: new Date(pick_up_date),
      pick_up_time,
      notes,
      payment,
    });
    await Cart.findOneAndDelete({
      buyer: req.buyer._id,
      seller,
    });
    res
      .status(200)
      .json(success("Order sent successfully", { order }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.find({
      buyer: req.buyer._id,
      status: status,
    })
      .populate("seller")
      .select("-seller.password");
    res
      .status(200)
      .json(success("Order fetched successfully", { order }, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("seller")
      .select("-seller.password")
      .lean();
    for (const product of order.product) {
      product.product = await SellerProduct.findById(product.productId)
        .populate(["variety", "type", "units"])
        .select(["category", "variety", "type", "units"]);
    }
    res
      .status(200)
      .json(
        success("Order detail fetched successfully", { order }, res.statusCode)
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.reorderProduct = async (req, res, next) => {
  try {
    const { orderId, pick_up_date, pick_up_time, notes, payment } = req.body;
    console.log(req.body);
    if (!orderId) {
      return res
        .status(200)
        .json(error("Please provide order id", res.statusCode));
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(200).json(error("Invalid order id", res.statusCode));
    }
    if (!pick_up_date) {
      return res
        .status(200)
        .json(error("Please provide pickup date", res.statusCode));
    }
    if (!pick_up_time) {
      return res
        .status(200)
        .json(error("Please provide pickup time", res.statusCode));
    }
    if (!notes) {
      return res
        .status(200)
        .json(error("Please provide notes", res.statusCode));
    }
    if (!payment) {
      return res
        .status(200)
        .json(error("Please provide payment mode", res.statusCode));
    }
    const partner = await SellerPartnerBuyers.findOne({
      seller: order.seller,
      buyer: req.buyer._id,
      status: true,
    });
    if (!partner) {
      return res
        .status(200)
        .json(error("Can't reorder product", res.statusCode));
    }
    let products = await SellerProduct.find({
      seller: order.seller,
      status: true,
    }).distinct("_id");
    products = products.map((pr) => {
      return String(pr);
    });
    const orderedProducts = order.product.filter((pr) =>
      products.includes(String(pr.productId))
    );
    if (!orderedProducts.length) {
      return res
        .status(200)
        .json(error("Product is not available", res.statusCode));
    }
    await Order.create({
      buyer: req.buyer._id,
      seller: order.seller,
      product: orderedProducts,
      pick_up_date: new Date(pick_up_date),
      pick_up_time,
      notes,
      payment,
    });
    res
      .status(200)
      .json(success("Order sent successfully", {}, res.statusCode));
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};

exports.getOrderCount = async (req, res, next) => {
  try {
    const sentOrderCount = await Order.find({
      buyer: req.buyer._id,
      status: "PENDING",
    }).countDocuments();
    const counterOrderCount = await Order.find({
      buyer: req.buyer._id,
      status: "COUNTER",
    }).countDocuments();
    const confirmedOrderCount = await Order.find({
      buyer: req.buyer._id,
      status: "CONFIRMED",
    }).countDocuments();
    const cartCount = await Cart.find({
      buyer: req.buyer._id,
    }).countDocuments();
    res
      .status(200)
      .json(
        success(
          "Order count fetched successfully",
          { sentOrderCount, counterOrderCount, confirmedOrderCount, cartCount },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
