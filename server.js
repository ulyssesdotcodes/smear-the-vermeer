var express = require('express');
var traverson = require('traverson');
var request = require('superagent');
var JsonHalAdapter = require('traverson-hal');
var path = require('path');
var url = require('url');
var app = express();
app.set('view engine', 'ejs'); 


traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
var api = traverson.from('https://api.artsy.net/api').jsonHal();

var xappToken;

var emitBackground = function(token, artwork, callback) {
    api.newRequest()
      .follow('artwork')
      .withRequestOptions({
          headers: {
            'X-Xapp-Token': xappToken,
            'Accept': 'application/vnd.artsy-v2+json'
          }
      })
      .withTemplateParameters({id: artwork })
      .getResource(function(error, artwork) {
        backgroundUrl = artwork._links.thumbnail.href;
        backgroundUrl = backgroundUrl.replace(/medium/, "large");
        callback(backgroundUrl);
      });
};

app.use('/assets', express.static(__dirname + '/public/assets'));

app.get('/vermeer', function(req, res) {
        res.redirect('/smearthevermeer/draw?artwork=525327bd139b211eb00000f4');
});

app.get('/draw', function(req, res) {
    var urlparts = url.parse(req.url, true);
    var query = urlparts.query;

    if(xappToken == undefined) {
        request
          .post(apiUrl)
          .send({ client_id: clientID, client_secret: clientSecret })
          .end(function(err, response) {
            xappToken = response.body.token;
            emitBackground(xappToken, query.artwork, function(url) {
                res.locals.background = url;
                res.render('index', {background: url});
            });
          });
    }
    else {
        emitBackground(xappToken, query.artwork, function(url) {
            res.locals.background = url;
            res.render('index', {background: url});
        });
    }

});

function findArtwork(token, query, callback) {
    api.newRequest()
      .follow('search', 'results[0]', 'self', 'artworks')
      .withRequestOptions({
          headers: {
            'X-Xapp-Token': xappToken,
            'Accept': 'application/vnd.artsy-v2+json'
          }
      })
      .withTemplateParameters({q: query })
      .getResource(function(error, results) {
        if(error || results == undefined) {
            callback(undefined);
        }
        else {
            console.log(results._embedded.artworks[0]);
            callback(results._embedded.artworks[0].id);
        }
      });
}

app.get('/find', function(req, res) {
    var urlparts = url.parse(req.url, true);
    var query = urlparts.query;

    if(xappToken == undefined) {
        request
          .post(apiUrl)
          .send({ client_id: clientID, client_secret: clientSecret })
          .end(function(err, response) {
            xappToken = response.body.token;
            findArtwork(xappToken, query.q, function(id) {
                res.locals.background = url;
                if(id == undefined) {
                    res.send("Not found :(");
                }
                else {
                    res.redirect('/smearthevermeer/draw?artwork=' + id);
                }
            });
          });
    }
    else {
        findArtwork(xappToken, query.q, function(id) {
            res.locals.background = url;
            if(id == undefined) {
                res.send("Not found :(");
            }
            else {
                res.redirect('/smearthevermeer/draw?artwork=' + id);
            }
        });
    }

});

app.get('/', function(req, res) {
    res.render('search');
});


var clientID = 'e22c8fe5d1552426d6b0',
    clientSecret = 'df5cb6dc1a5fda269b8c9ecd23b747f2',
    apiUrl = 'https://api.artsy.net/api/tokens/xapp_token',
    backgroundUrl;

var images = {};

var server = app.listen(3008, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
})

var io = require('socket.io')(server);

io.on('connection', function(socket) {
  console.log("test");
  socket.on('mousemove', function(data) {
    socket.broadcast.emit('moving', data);
  });
})
