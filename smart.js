var express = require('express');
var app = express();
var router = express.Router();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Raspi = require("raspi-io");
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
console.log('Hello Rat ! Server is runing on port ' + port);


// Initialize
var leds = {};


// When board is ready ...
board.on("ready", function() {
    leds = new five.Leds(["P1-13", "P1-15"]);

});

io.on('connection', function(socket) {
    console.log('Started');


    // Led ON action
    socket.on('led:on', function(data) {
        console.log(data.number);
        leds[data.number].on();
        console.log('Led ' + data.number + ' on');
    });

    // Led OFF action
    socket.on('led:off', function(data) {
        leds[data.number].off();
        console.log('Led ' + data.number + ' off');

    });

});