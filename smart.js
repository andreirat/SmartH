var express = require('express');
var app = express();
var router = express.Router();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Raspi = require("raspi-io");

var Oled = require('oled-js');
var font = require('oled-font-5x7');
var io = require('socket.io')(httpServer);
var port = 3000;
var board = new five.Board({
    io: new Raspi()
});

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/pages/index.html');
});
httpServer.listen(port);

console.log('Hello Rat ! Server is runing on port' + port);

// When board is ready ...
board.on("ready", function() {


});

io.on('connection', function(socket) {
    console.log('Started');

    socket.on('led:on', function(data) {
        var led = new five.Led("P1-13");
        led.blink();
    });

});