const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const adminRoutes = require("./Routes/adminRoutes");
const sellerRoutes = require("./Routes/sellerRoutes");
const buyerRoutes = require("./Routes/buyerRoutes");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({ origin: true }));
app.use(compression());
app.use(express.urlencoded({ extended: true })); //for parsing body of HTML Forms
app.use(express.static("./public")); //for serving static contenct in public folder
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(morgan("tiny"));
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/buyer", buyerRoutes);
app.get("/", (req, res) => {
  console.log("Hello");
  res.status(200).send("hello from the server");
});

module.exports = app;
