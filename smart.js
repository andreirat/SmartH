const config = require('./config');
var express = require('express');
var app = express();
var router = express.Router();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Raspi = require("raspi-io");
var io = require('socket.io')(httpServer);
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/smarth');
// var oled = require('oled-js-pi');
// var font = require('oled-font-5x7');
var board = new five.Board({
    io: new Raspi()
});
var port = 3000;
app.use(function(req, res, next) {
    req.db = db;
    next();
});
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/pages/index.html');
});
httpServer.listen(port);
console.log('Hello Rat ! Server is runing on port ' + port);


// For todays date;
Date.prototype.today = function() {
    return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function() {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
}


// Variable init
var leds = {};
// var opts = {
//     width: 128,
//     height: 64,
//     address: 0x3D
// };


// When board is ready ...
board.on("ready", function() {

    var db = req.db;
    var collection = db.get('usercollection');
    collection.find({}, {}, function(e, docs) {
        console.log(docs);
    });

    leds = new five.Leds(["P1-13", "P1-15"]);
    // var motion = new five.Motion("GPIO23");

    // // "calibrated" occurs once, at the beginning of a session,
    // motion.on("calibrated", function(data) {
    //     console.log("Calibrated");
    // });

    // // "motionstart" events are fired when the "calibrated"
    // // proximal area is disrupted, generally by some form of movement
    // motion.on("motionstart", function() {
    //     var date = new Date();
    //     io.emit('motionstart', date);
    //     console.log("motionstart");
    //     var time = date.today() + " @ " + date.timeNow();
    //     sendSMS(time);
    // });

    // // "motionend" events are fired following a "motionstart" event
    // // when no movement has occurred in X ms
    // motion.on("motionend", function() {
    //     var date = new Date;
    //     io.emit('motionend', date);
    //     console.log("motionend");
    // });

    // var oled = new oled(opts);
    // oled.turnOnDisplay();
    // oled.setCursor(1, 1);
    // oled.writeString(font, 1, 'Salut', 1, true);

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

// SMS function 
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: config.nexmo.api_key,
    apiSecret: config.nexmo.api_secret
});

function sendSMS(time) {
    let msg = 'Salut Andrei! Miscare detectata in ' + time + ' !';
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

// Oled functions

/*
 **  Function to clear display
 */
// function clearDisplay() {
//     oled.clearDisplay(true);
//     oled.update();
// }