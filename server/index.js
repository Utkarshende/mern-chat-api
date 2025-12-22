const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  // Simple Typing Events
  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("hide_typing");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});