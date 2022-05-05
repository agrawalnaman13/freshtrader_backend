global.__basedir = __dirname;
const app = require("./App");
const mongoose = require("mongoose");
const http = require("http");
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
server.listen(port, () => {
  console.log(`listening on port ${port}...`);
  console.log("Hello Server");
});
