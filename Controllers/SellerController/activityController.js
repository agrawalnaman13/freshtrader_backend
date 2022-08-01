const mongoose = require("mongoose");
const Activity = require("../../Models/SellerModels/activitySchema");
const SellerStaff = require("../../Models/SellerModels/staffSchema");
const { success, error } = require("../../service_response/adminApiResponse");

exports.getActivityLog = async (req, res, next) => {
  try {
    const { from, till, sortBy, filterBy, search } = req.body;
    const activities = await Activity.aggregate([
      {
        $match: {
          seller: mongoose.Types.ObjectId(req.seller._id),
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
                  ],
                }
              : {},
          ],
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    for (const activity of activities) {
      if (activity.account)
        activity.account = await SellerStaff.findById(activity.account);
      else activity.account = {};
      if (activity.salesman)
        activity.salesman = await SellerStaff.findById(activity.salesman);
      else activity.salesman = {};
    }

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
