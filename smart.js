const config = require('./config');
var express = require('express');
var app = express();
var router = express.Router();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Raspi = require("raspi-io");
var io = require('socket.io')(httpServer);
// var monk = require('monk');
// var db = monk('localhost:27017/smarth');
var database;
// Retrieve
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/smarth');


// var oled = require('oled-js-pi');
// var font = require('oled-font-5x7');
var board = new five.Board({
    io: new Raspi()
});
var port = 3000;
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
var motion = {};
var piezo;

// When board is ready ...
board.on("ready", function() {


    piezo = new five.Piezo("GPIO18");
    leds = new five.Leds(["P1-13", "P1-15", "P1-11", "GPIO20", "GPIO21"]);
    motion = new five.Motion("GPIO23");

    // Plays the same song with a string representation
    piezo.play({
        // song is composed by a string of notes
        // a default beat is set, and the default octave is used
        // any invalid note is read as "no note"
        song: "C D F D A - A A A A G G G G - - C D F D G - G G G G F F F F - -",
        beats: 1 / 4,
        tempo: 100
    });


    // "calibrated" occurs once, at the beginning of a session,
    motion.on("calibrated", function(data) {
        console.log("Motion sensor calibrated.");
    });

    // "motionstart" events are fired when the "calibrated"
    // proximal area is disrupted, generally by some form of movement
    motion.on("motionstart", function() {
        var date = new Date();
        io.emit('motionstart', date);
        console.log("motionstart");
        var time = date.today() + " @ " + date.timeNow();
        // sendSMS(time);
    });

    // "motionend" events are fired following a "motionstart" event
    // when no movement has occurred in X ms
    motion.on("motionend", function() {
        var date = new Date;
        io.emit('motionend', date);
        console.log("motionend");
    });

});

io.on('connection', function(socket) {
    console.log('Started');

    var collection = db.get('usercollection');
    collection.find({}, {}, function(e, docs) {
        socket.emit('userData', docs);
    });

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
    // Led OFF action
    socket.on('outdoor:off', function(data) {
        leds[3].off();
        leds[4].off();
    });
    // Led OFF action
    socket.on('outdoor:on', function(data) {
        leds[3].on();
        leds[4].on();
    });

    socket.on('alarm', function(data) {
        if (data) {
            motion.on("motionstart", function() {
                var date = new Date();
                io.emit('motionstart', date);
                console.log("motionstart here");
                var time = date.today() + " @ " + date.timeNow();
                leds[2].blink(300);
                sendSMS(time);
            });
        }
    });

});

// SMS function 
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: config.nexmo.api_key,
    apiSecret: config.nexmo.api_secret
});

function sendSMS(time) {
    var msg = 'Alerta miscare!';
    nexmo.message.sendSms(config.nexmo.fromNumber, config.nexmo.toNumber, msg, {type: 'unicode'}, function (response) {
        console.log(response);
    })
}