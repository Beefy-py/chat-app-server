const express = require("express");
const socketIo = require("socket.io");
const { createServer } = require("http");
const cors = require("cors");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");

const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    console.log(`error`, error);

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", {
      user: "Admin",
      text: `Hey ${user.name}! Welcome to ${user.room}`,
      color: "gray",
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "Admin",
      text: `${user.name} has joined!`,
      color: "green",
    });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", { user: user.name, text: message });
      console.log(`${user.name} is sending message...`);
    }

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left!`,
        color: "yellow",
      });

      console.log(`${user.name} has left!`);

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.use(router);

httpServer.listen(PORT, () => {
  console.log(`Server has started running on Port:${PORT}`);
});
