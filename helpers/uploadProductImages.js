const multer = require("multer");
const fs = require("fs");

function createProductImagePath(req, res, next) {
  fs.exists(`./public/Products`, function (exists) {
    if (exists) {
      next();
    } else {
      fs.mkdir(`./public/Products`, { recursive: true }, function (err) {
        if (err) {
          console.log("Error in folder creation");
          next();
        }
        next();
      });
    }
  });
}
module.exports.createProductImagePath = createProductImagePath;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/Products`);
  },
  filename: function (req, file, cb) {
    const randomString = new Date().getUTCMilliseconds();
    cb(null, "-" + Date.now() + randomString + file.originalname);
  },
});

var uploadProductImage = multer({ storage: storage });

module.exports.uploadProductImage = uploadProductImage;
