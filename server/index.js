const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

// 1. Update CORS to allow both local development and your live Vercel URL
app.use(cors({
  origin: ["http://localhost:5173", "https://mern-chat-h7ux4s7w8-utkarshas-projects-b2961f40.vercel.app/"]
}));

// Add this below app.use(cors())
app.get("/", (req, res) => {
  res.send("VibeChat Server is running smoothly!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // 2. Do the same for Socket.io CORS
    origin: ["http://localhost:5173","https://mern-chat-api-azure.vercel.app/"],
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

  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("hide_typing");
  });

  socket.on("leave_room", (room) => {
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// 3. IMPORTANT: Use process.env.PORT for Render deployment
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});