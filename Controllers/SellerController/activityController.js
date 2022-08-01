const mongoose = require("mongoose");
const Activity = require("../../Models/SellerModels/activitySchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getActivityLog = async (req, res, next) => {
  try {
    const { from, till, sortBy, filterBy, search } = req.body;
    const activities = await Activity.find({
      seller: req.seller._id,
      $and: [
        from ? { createdAt: { $gte: new Date(from) } } : {},
        till ? { createdAt: { $lte: new Date(till) } } : {},
        search
          ? {
              $or: [
                {
                  event: {
                    $regex: search,
                    $options: "$i",
                  },
                },
                {
                  info: {
                    $regex: search,
                    $options: "$i",
                  },
                },
                {
                  account: {
                    $regex: search,
                    $options: "$i",
                  },
                },
                {
                  salesman: {
                    $regex: search,
                    $options: "$i",
                  },
                },
              ],
            }
          : {},
      ],
    })
      .populate(["account", "salesman"])
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json(
        success(
          "Activity Log Fetched Successfully",
          { activities },
          res.statusCode
        )
      );
  } catch (err) {
    console.log(err);
    res.status(400).json(error("error", res.statusCode));
  }
};
