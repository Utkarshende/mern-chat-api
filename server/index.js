// server/index.js (Add core socket listener)
io.on('connection', (socket) => {
  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User ID: ${socket.id} joined room: ${data}`);
  });
});