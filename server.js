var express        = require('express');
var app            = express();
var httpServer = require("http").createServer(app);
// var board = new five.Board({ timeout: 3600 });
var port = 3000;
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/pages/index.html');
});

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://api.solcast.com.au');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

httpServer.listen(port);

console.log('Hello Rat ! Server is runing on port' + port);

