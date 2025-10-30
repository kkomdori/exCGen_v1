const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.use("/public", express.static("public"));

var path = require("path");
var favicon = require("serve-favicon");
app.use(favicon(path.join(__dirname, "/favicon.ico")));

app.get("/", function (req, res) {
  res.render("index.ejs");
});
app.get("/tools", function (req, res) {
  res.render("tools.ejs");
});

app.listen(8080, ()=>{console.log("start server")})
