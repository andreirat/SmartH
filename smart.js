/**
 * Initializare variabile si constante
 */
const config = require('./config');
var express = require('express');
var app = express();
var router = express.Router();
var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Raspi = require("raspi-io");
var io = require('socket.io')(httpServer);
var database;
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/smarth');
var board = new five.Board({
    io: new Raspi()
});
var port = 3000;

/**
 * Utilizarea fisierelor statice
 */
app.use(express.static(__dirname + '/public'));
/**
 * Utilizarea fisierului index.html ca si fisier principal
 */
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/pages/index.html');
});
httpServer.listen(port);
console.log('Hello Rat ! Server is runing on port ' + port);


/**
 * Functie formatare data
 * Returneaza data
 * @returns {string}
 */
Date.prototype.today = function() {
    return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "/" + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "/" + this.getFullYear();
};

/**
 * Functie formatare data
 * Returneaza ora
 * @returns {string}
 */
Date.prototype.timeNow = function() {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
};


/**
 * Initializare variabile senzori si componente
 * @type {{}}
 */
var leds = {};
var motion = {};

/**
 * Cand placa este initializata
 */
board.on("ready", function() {

    leds = new five.Leds(["P1-13", "P1-15", "P1-11", "GPIO20", "GPIO21"]);
    motion = new five.Motion("GPIO23");


    /**
     * Cand PIR este calibrat
     */
    motion.on("calibrated", function(data) {
        console.log("Motion sensor calibrated.");
    });

    /**
     * Cand PIR detecteaza miscare
     */
    motion.on("motionstart", function() {
        var date = new Date();
        io.emit('motionstart', date);
        console.log("motionstart");
    });

    /**
     * Cand PIR nu mai detecteaza miscare
     */
    motion.on("motionend", function() {
        var date = new Date;
        io.emit('motionend', date);
        console.log("motionend");
    });

});

/**
 * Cand se conecteaza Socket.io
 */
io.on('connection', function(socket) {
    console.log('Started');

    var collection = db.get('usercollection');
    collection.find({}, {}, function(e, docs) {
        socket.emit('userData', docs);
    });

    // Primire comanda aprindere LED
    socket.on('led:on', function(data) {
        console.log(data.number);
        leds[data.number].on();
        console.log('Led ' + data.number + ' on');
    });

    // Primire comanda stingere LED
    socket.on('led:off', function(data) {
        leds[data.number].off();
        console.log('Led ' + data.number + ' off');

    });
    // Comanda stingere LED-uri exterioare
    socket.on('outdoor:off', function(data) {
        leds[3].off();
        leds[4].off();
    });
    // Comanda aprindere LED-uri exterioare
    socket.on('outdoor:on', function(data) {
        leds[3].on();
        leds[4].on();
    });

    var alarm = false;

    // Comanda pornire alarma
    socket.on('alarm:on', function(data) {
        if (data) {
            alarm = true;
            motion.on("motionstart", function() {
                var date = new Date();
                io.emit('motionstart', date);
                var time = date.today() + " @ " + date.timeNow();
                if(alarm){
                    leds[2].blink(300); // Aprinde bed alarma
                }
                sendSMS(time); // Trimite SMS
            });
        }
    });

    // Comanda oprire alarma
    socket.on('alarm:off', function(data) {
        if (!data) {
            alarm = false;
            console.log(data);
            piezo.off();
            leds[2].stop().off();
        }
    });

});

/**
 * Initializare constante serviciu Nexmo
 */
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: config.nexmo.api_key,
    apiSecret: config.nexmo.api_secret
});

/**
 * Functie trimitere SMS
 * @param time
 */
function sendSMS(time) {
    var msg = 'Alerta miscare!';
    nexmo.message.sendSms(config.nexmo.fromNumber, config.nexmo.toNumber, msg, {type: 'unicode'}, function (response) {
        console.log(response);
    })
}