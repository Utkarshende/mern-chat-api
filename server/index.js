const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

// EXACT URL from your error message (no trailing slash)
const VERCEL_URL = "https://mern-chat-api-azure.vercel.app";

app.use(cors({
  origin: VERCEL_URL,
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: VERCEL_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => socket.join(room));
  socket.on("send_message", (data) => socket.to(data.room).emit("receive_message", data));
  socket.on("typing", (data) => socket.to(data.room).emit("display_typing", data));
  socket.on("stop_typing", (data) => socket.to(data.room).emit("hide_typing"));
  socket.on("disconnect", () => console.log("User Disconnected", socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));