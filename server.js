global.__basedir = __dirname;
const app = require("./App");
const mongoose = require("mongoose");
const http = require("http");
const cron = require("node-cron");
const {
  setCustomerInfo,
} = require("./Controllers/SellerController/customerFilesController");
const {
  checkOverdueTransactions,
} = require("./Controllers/SellerController/transactionController");
const {
  checkPlan,
} = require("./Controllers/BuyerController/subscriptionController");
const {
  checkOrderWeek,
  deleteIncompleteOrders,
  deleteUnconfirmedOrders,
} = require("./Controllers/BuyerController/orderController");
let server = http.createServer(app);
mongoose
  .connect("mongodb://localhost/Freshtrader", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // mongoose
    //   .connect(
    //     "mongodb+srv://regalchess:regalchess@cluster0.jomq7.mongodb.net/Regalchess?retryWrites=true&w=majority",
    //     {
    //       //   useNewUrlParser: true,
    //       //   useCreateIndex: true,
    //       //   useFindAndModify: false,
  })
  .then((con) => console.log("connected to remote database"));
const port = 3001;
process.env["BASE_URL"] =
  "http://ec2-54-197-73-213.compute-1.amazonaws.com:3001";
cron.schedule("0 0 * * *", async () => {
  await checkOverdueTransactions();
  await setCustomerInfo();
  await checkPlan();
  await checkOrderWeek();
  console.log("cron");
});
cron.schedule("0 * * * *", async () => {
  await deleteIncompleteOrders();
  await deleteUnconfirmedOrders();
  console.log("cron");
});
server.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
