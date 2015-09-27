var express = require('express');
var app = express();

app.use('/', express.static(__dirname + '/public'));

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
})

var io = require('socket.io')(server);


io.set('log level', 1);
io.on('connection', function(socket) {
  socket.on('mousemove', function(data) {
    socket.emit('moving', data);
  })
})
