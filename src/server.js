const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const xxh = require('xxhashjs');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const handler = (req, res) => {
  fs.readFile(`${__dirname}/../client/index.html`, (err, data) => {
    if (err) {
      throw err;
    }
    res.writeHead(200);
    res.end(data);
  });
};

const app = http.createServer(handler);
const io = socketio(app);

app.listen(PORT);

io.on('connection', (sock) => {
  const socket = sock;
  socket.join('room1');
  const randX = Math.floor((Math.random() * 525)) + 1;

  socket.square = {
    hash: xxh.h32(`${socket.id}${new Date().getTime()}`, 0xABCDDCBA).toString(16),
    lastUpdate: new Date().getTime(),
    x: randX,
    y: 0,
    prevX: 0,
    prevY: 0,
    destX: randX,
    destY: 0,
    alpha: 0,
    height: 75,
    width: 75,
    jump: false,
  };

  socket.emit('joined', socket.square);

  socket.on('updateGrav', (data) => {
    socket.square = data;
    if (data.destY <= 675) {
      const gravity = data.destY + 5;
      socket.square.destY = gravity;

      io.to(socket.id).emit('getGrav', socket.square);
    }
  });

  socket.on('movementUpdate', (data) => {
    socket.square = data;
    socket.square.lastUpdate = new Date().getTime();

    socket.broadcast.to('room1').emit('updateMovement', socket.square);
  });

  socket.on('disconnect', () => {
    io.sockets.in('room1').emit('disconnect', socket.square.hash);

    socket.leave('room1');
  });
});

console.log(`Listening on port ${PORT}...`);
