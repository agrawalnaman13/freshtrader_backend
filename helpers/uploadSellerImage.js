const multer = require("multer");
const fs = require("fs");

function createSellerImagePath(req, res, next) {
  console.log(req.seller);
  fs.exists(`./public/Sellers/${req.seller._id}`, function (exists) {
    if (exists) {
      next();
    } else {
      fs.mkdir(
        `./public/Sellers/${req.seller._id}`,
        { recursive: true },
        function (err) {
          if (err) {
            console.log("Error in folder creation");
            next();
          }
          next();
        }
      );
    }
  });
}
module.exports.createSellerImagePath = createSellerImagePath;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/Sellers/${req.seller._id}`);
  },
  filename: function (req, file, cb) {
    const randomString = new Date().getUTCMilliseconds();
    cb(null, "-" + Date.now() + randomString + file.originalname);
  },
});

var uploadSellerImage = multer({ storage: storage });

module.exports.uploadSellerImage = uploadSellerImage;
