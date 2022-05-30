const multer = require("multer");
const fs = require("fs");

function createAdminSellerImagePath(req, res, next) {
  console.log(req.seller);
  fs.exists(`./public/Admin/Sellers`, function (exists) {
    if (exists) {
      next();
    } else {
      fs.mkdir(`./public/Admin/Sellers`, { recursive: true }, function (err) {
        if (err) {
          console.log("Error in folder creation");
          next();
        }
        next();
      });
    }
  });
}
module.exports.createAdminSellerImagePath = createAdminSellerImagePath;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/Admin/Sellers`);
  },
  filename: function (req, file, cb) {
    const randomString = new Date().getUTCMilliseconds();
    cb(null, "-" + Date.now() + randomString + file.originalname);
  },
});

var uploadAdminSellerImage = multer({ storage: storage });

module.exports.uploadAdminSellerImage = uploadAdminSellerImage;
