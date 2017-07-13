/**
 * Initializare variabile si constante
 */
const config = require('./config');
var express = require('express');
var app = express();
var httpServer = require("http").createServer(app);
var io = require('socket.io')(httpServer);
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
 * Cand se conecteaza Socket.io
 */
io.on('connection', function(socket) {


});
