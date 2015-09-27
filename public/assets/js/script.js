$(function() {
  var url = 'http://localhost:3000';

  var id = Math.round($.now()*Math.random());

  var drawing = false;

  var doc = $(document);
  var win = $(window);
  var canvas = $("#paper");

  var ctx = canvas[0].getContext('2d');

  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;

  var clients = {};
  var cursors = {};

  var socket = io.connect(url);

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
		if(data.drawing && clients[data.id] && !data.id == id){

			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer

			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}

		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
  });

  var prev = {};

  canvas.on('mousedown', function(e) {
    e.preventDefault();
    drawing = true;
    prev.x = e.pageX;
    prev.y = e.pageY;
  });

  doc.bind('mouseup mouseleave', function() {
    drawing = false;
  });

  var lastEmit = $.now();

  doc.on('mousemove', function(e) {
    if($.now() - lastEmit > 30){
      socket.emit('mousemove', {
        'x': e.pageX,
        'y': e.pageY,
        'drawing': drawing,
        'id': id
      });

      lastEmit = $.now();
    }

    if(drawing) {
      drawLine(prev.x, prev.y, e.pageX, e.pageY);

      prev.x = e.pageX;
      prev.y = e.pageY;
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
    // ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    // ctx.closePath();
    console.log(fromx + " test " + tox);
  }
})
