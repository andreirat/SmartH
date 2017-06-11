const config = require('./config');
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
var timestamp = Date.now();

// When board is ready ...
board.on("ready", function() {
    leds = new five.Leds(["P1-13", "P1-15"]);

});

io.on('connection', function(socket) {
    console.log('Started');


    // Led ON action
    socket.on('led:on', function(data) {
        sendSMS(timestamp)
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

const Nexmo = require('nexmo');

const nexmo = new Nexmo({
    apiKey: config.nexmo.api_key,
    apiSecret: config.nexmo.api_secret
});

function sendSMS(timestamp) {
    var t = new Date(timestamp).toLocaleString();
    let msg = 'Motion detected on ' + t + '!';
    nexmo.message.sendSms(
        config.nexmo.fromNumber,
        config.nexmo.toNumber,
        msg, { type: 'unicode' },
        (err, responseData) => {
            if (err) {
                console.log(err);
            } else {
                console.dir(responseData);
            }
        }
    );
}