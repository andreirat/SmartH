var express        = require('express');
var app            = express();
var router =       express.Router();


var httpServer = require("http").createServer(app);
var five = require("johnny-five");
var Oled = require('oled-js');
var font = require('oled-font-5x7');
var io=require('socket.io')(httpServer);
var board = new five.Board();
// var board = new five.Board({ timeout: 3600 });
var port = 3000;
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/pages/index.html');
});
httpServer.listen(port);

console.log('Hello Rat ! Server is runing on port' + port);

   /*
     ** @description Options for Oled display SSD1306
     */
    var opts = {
        width: 128,
        height: 64,
        address: 0x3C
    };
var leds = {};

// When board is ready ...
board.on("ready", function() {
    console.log('Your system is ready. Board id is ' +board.id);

    oled = new Oled(board, five, opts);
    oled.turnOnDisplay();
    oled.clearDisplay(true);
    oled.update();

    // ----------------------- Declarations ------------------ //
    var oled;

    // Create a new `joystick` hardware instance.
    var joystick = new five.Joystick({
        pins: ["A0", "A1"]
    });

    // Light Sensor
    // var light = new five.Light("A0");

    //  Motion Sensor
    var motion = new five.Motion({
        pin: 3
    });

    // RGB pins set-up 
    var led = new five.Led.RGB({
        pins: {
            red: 2,
            green: 5,
            blue: 6
        }
    });

    // Set LED pins
    // var ledPins = [7,8,10,11];
     leds = new five.Leds([7,8,10,11]);
    console.log(leds);



    // --------------------------- Logic ------------------------- //

    // set initial state of RGB
    led.color({
        red: 0,
        green: 0,
        blue:0
    });

    //
    // light.on("change", function() {
    //     console.log(this.level);
    // });
    //
    //
    // light.within([ 0.10, 0.40 ], function() {
    //     leds[0].on()
    // });
    //
    // light.within([ 0.40, 0.90 ], function() {
    //     leds[0].off()
    // });
    //


    // "calibrated" occurs once, at the beginning of a session,
    motion.on("calibrated", function(data) {
        console.log(data);
        console.log("calibrated");
    });

    // "motionstart" events are fired when the "calibrated"
    // proximal area is disrupted, generally by some form of movement
    motion.on("motionstart", function() {
        var date = new Date();
        io.emit('motionstart', date);
        leds[2].off();
        leds[3].on();
        console.log("motionstart");
    });

    // "motionend" events are fired following a "motionstart" event
    // when no movement has occurred in X ms
    motion.on("motionend", function() {
        var date = new Date();
        io.emit('motionend', date);
        leds[3].fadeOut();
        leds[2].on();
        console.log("motionend");
    });



    joystick.on("change", function() {
        var axis = {
            x: this.x,
            y: this.y
        };
        if( this.x > 0.5 ){
            toggle(0);
        } else if(this.x < -0.5 ){
            toggle(1)
        }else if( this.y > 0.5){
            toggle(2)
        }else if( this.y < -0.5){
            toggle(3)
        }

        io.emit('joystick', axis);
    });

    function toggle(l){
        leds.each(function(led, index) {
            if (index == l ) {
                led.on();
            } else {
                led.off();
            }
        });
    }
});

// Socket logic 
io.on('connection', function (socket) {

    console.info('New client connected (id=' + socket.id + ').');

    // Led ON action
    socket.on('led:on', function (data) {
        console.log(data.number);
        leds[data.number].on();
        console.log('Led '+data.number+' on');
    });

    // Led OFF action
    socket.on('led:off', function (data) {
        leds[data.number].off();
        console.log('Led '+data.number+' off');

    });

    // RGB action
    socket.on('rgb',function(data){
        console.log(data);
        led.color({
            red: data[0].value,
            green: data[1].value,
            blue: data[2].value
        });
        led.on();
    });

    // Show text on display action
    socket.on('pushText', function (data) {
        console.log(data);
        writestring(data);
    });


    /*
    ** Clear display action
    */
    socket.on('clearText', function () {
        clearDisplay();
    });
});

/*
** Function to write data on display
*/
function writestring(data){
    oled.clearDisplay(true);
    oled.update();
    oled.setCursor(1, 1);
    oled.writeString(font, 3, data, 1, true, 2);
    oled.update();
}

/*
**  Function to clear display
*/
function clearDisplay(){
    oled.clearDisplay(true);
    oled.update();
}