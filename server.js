var express = require('express');
var traverson = require('traverson');
var request = require('superagent');
var JsonHalAdapter = require('traverson-hal');
var app = express();

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
var api = traverson.from('https://api.artsy.net/api').jsonHal();


app.use('/', express.static(__dirname + '/public'));

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
})

var io = require('socket.io')(server);

var clientID = 'e22c8fe5d1552426d6b0',
    clientSecret = 'df5cb6dc1a5fda269b8c9ecd23b747f2',
    apiUrl = 'https://api.artsy.net/api/tokens/xapp_token',
    backgroundUrl;


io.set('log level', 1);
io.on('connection', function(socket) {
  if(backgroundUrl == undefined) {
    request
      .post(apiUrl)
      .send({ client_id: clientID, client_secret: clientSecret })
      .end(function(err, res) {
        xappToken = res.body.token;

        api.newRequest()
          .follow('artist', 'artworks')
          .withRequestOptions({
              headers: {
                'X-Xapp-Token': xappToken,
                'Accept': 'application/vnd.artsy-v2+json'
              }
          })
          .withTemplateParameters({id: 'johannes-vermeer'})
          .getResource(function(error, vermeer) {
            backgroundUrl = vermeer._embedded.artworks[4]._links.thumbnail.href;
            backgroundUrl = backgroundUrl.replace(/medium/, "large");
            console.log(backgroundUrl);
            io.emit('background', backgroundUrl);
          });
      });
  }
  else {
    socket.emit('background', backgroundUrl);
  }

  socket.on('mousemove', function(data) {
    socket.broadcast.emit('moving', data);
  });
})
