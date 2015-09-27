$(function() {
  var url = 'http://node.upopple.com';

  var id = Math.round($.now()*Math.random());

  var drawing = false;

  var doc = $(document);
  var win = $(window);
  var canvas = $("#paper");
  var background = $("#image");

  var ctx = canvas[0].getContext('2d');

  var size = {
    x: window.innerWidth,
    y: window.innerHeight
  };

  ctx.canvas.width = size.x;
  ctx.canvas.height = size.y;

  background.width(size.x);
  background.height(size.y);

  var clients = {};
  var cursors = {};

  var artwork = getParameterByName('artwork');

  var socket = io.connect(url, { path: "/smearthevermeer/socket.io" });

  socket.on("moving", function(data) {
        if(! (data.id in clients)){
            // a new user has come online. create a cursor for them
            cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
        }

        // Move the mouse pointer
        cursors[data.id].css({
            'left' : data.x,
            'top' : data.y
        });

        // Is the user drawing?
    console.log(clients);
        if(data.drawing && clients[data.id] && clients[data.id].artwork == artwork){

            // Draw a line on the canvas. clients[data.id] holds
            // the previous position of this user's mouse pointer

            drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
        }

        // Saving the current client state
        clients[data.id] = data;
        clients[data.id].updated = $.now();
  });

    var img = $("<img />")
    img.attr('src', window.bgUrl)
      .on('load', function() {
        background.append(img);

        ctx.drawImage(this, 0, 0);
      });

  var prev = {};

  canvas.on('mousedown', function(e) {
    e.preventDefault();
    drawing = true;
    prev.x = e.pageX / size.x;
    prev.y = e.pageY / size.y;
  });

  doc.bind('mouseup mouseleave', function() {
    drawing = false;
  });

  var lastEmit = $.now();

  doc.on('mousemove', function(e) {
    if($.now() - lastEmit > 30){
      socket.emit('mousemove', {
        'x': e.pageX / size.x,
        'y': e.pageY / size.y,
        'drawing': drawing,
        'artwork': artwork,
        'id': id
      });

      lastEmit = $.now();
    }

    if(drawing) {

      var x= e.pageX / size.x;
      var y = e.pageY / size.y;

      drawLine(prev.x, prev.y, x, y);

      prev.x = x;
      prev.y = y;
    }
  });

  setInterval(function() {
    for(ident in clients) {
      if($.now() - clients[ident].updated > 10000) {
        cursors[ident].remove();
        delete clients[ident];
        delete cursors[ident];
      }
    }
  }, 10000);

  function drawLine(fromx, fromy, tox, toy) {
    ctx.moveTo(fromx * size.x, fromy * size.y);
    ctx.lineTo(tox * size.x, toy * size.y);
    ctx.stroke();
  }

  function getParameterByName(name) {
              name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                              results = regex.exec(location.search);
                      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }
})

