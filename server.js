// const https = require('https');
// const express = require('express');
// const fs = require('fs');

// const app = express();
// const options = {
//   key: fs.readFileSync('./keys/private.pem'),
//   cert: fs.readFileSync('./keys/public.pem')
// };
// const server = https.createServer(options, app);

// app.set("view engine", "ejs");
// app.use("/public", express.static("public"));
// var path = require("path");
// var favicon = require("serve-favicon");
// app.use(favicon(path.join(__dirname, "/favicon.ico")));

// app.get("/", function (요청, 응답) {
//   응답.render("index.ejs");
// });
// app.get("/tools", function (요청, 응답) {
//   응답.render("tools.ejs");
// });

// server.listen(8080, () => {
//   console.log("HTTPS server listening on port " + 8080);
// });



const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.use("/public", express.static("public"));

var path = require("path");
var favicon = require("serve-favicon");
app.use(favicon(path.join(__dirname, "/favicon.ico")));

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});
app.get("/tools", function (요청, 응답) {
  응답.render("tools.ejs");
});

app.listen(8080, ()=>{console.log("start server")})
