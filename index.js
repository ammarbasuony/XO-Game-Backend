import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  let currentRoomId;
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (roomId) => {
    currentRoomId = roomId.toString();
    socket.join(roomId.toString());
    const usersInRoom = io.sockets.adapter.rooms.get(roomId.toString());
    socket.broadcast
      .in(roomId.toString())
      .emit("player_joined", [...usersInRoom]);
    console.log(`User with ID: ${socket.id} joined room: ${roomId}`);
  });

  socket.on("play_game", (data) => {
    const { roomId, squares, current } = data;

    socket.broadcast
      .to(roomId.toString())
      .emit("current_state", { palette: squares, current });

    console.log(
      `Palette: ${squares} in Room ID: ${roomId}. Current Player is ${current}`
    );
  });

  socket.on("new_game", (data) => {
    const { palette, current, roomId } = data;

    socket.broadcast
      .to(roomId.toString())
      .emit("current_state", { palette, current });

    socket.broadcast.to(roomId.toString()).emit("reset", "");

    console.log(
      `Palette: ${palette} in Room ID: ${roomId}. Current Player is ${current}`
    );
  });

  socket.on("close_room", () => {
    socket.broadcast.in(currentRoomId).emit("room_closed");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    socket.broadcast.in(currentRoomId).emit("player_left", socket.id);
  });
});

server.listen(3001, () => {
  console.log("server running at port 3001");
});
