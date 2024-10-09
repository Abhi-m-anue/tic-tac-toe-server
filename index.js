const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
// app.use(express.static('public'))
app.get("/", (req, res) => {
  res.send("tic tac toe server");
});

app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // console.log("connected");
  // console.log(io.sockets.adapter.rooms);
  var hostName
  socket.on("createNewRoom", (name) => {
    var thisGameId = Math.floor(Math.random() * 100000);
    socket.join(thisGameId.toString());
    socket.data.hostName = name; // Store the host name on the socket instance
    
    socket.emit("newRoomCreated", {
      gameId: thisGameId,
    });
    
    // console.log(io.sockets.adapter.rooms)
  });

  socket.on("joinRoom", (data) => {
    const { roomId, name } = data;
    // console.log(roomId,name)
    const roomExists = io.sockets.adapter.rooms.has(roomId.toString());
    if (roomExists) {
      const sz = io.sockets.adapter.rooms.get(roomId.toString()).size;
      // console.log(sz)
      if (sz === 1) {
        socket.join(roomId);
        // console.log('joined room')
        // console.log(io.sockets.adapter.rooms)
        // Find the host's socket by checking all sockets in the room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
        let hostSocket;
        for (const socketId of socketsInRoom) {
          const potentialHost = io.sockets.sockets.get(socketId);
          if (potentialHost.data.hostName) {
            hostSocket = potentialHost;
            break;
          }
        }

        // Send the host's name to the player who just joined
        if (hostSocket) {
          socket.emit("joinedRoom", hostSocket.data.hostName);
          socket.to(roomId).emit("beginGame", name); // Notify the host that a player has joined
        }
      } else {
        // console.log('room full')
        socket.emit("cantJoinRoom", `cannot join, room ${roomId} is full`);
      }
    } else {
      // console.log('Invalid room number')
      socket.emit("cantJoinRoom", `Room '${roomId}' does not exist`);
    }
  });

  socket.on("playerMoved", (index, roomCode) => {
    // console.log('player moved',index,roomCode)
    socket
      .to(roomCode.toString())
      .emit("playerMoved", { index: Number(index) });
  });

  socket.on("playerWon", (roomCode) => {
    // console.log('player won',roomCode)
    socket.to(roomCode.toString()).emit("opponentWon");
  });

  socket.on("gameTied", (roomCode) => {
    socket.to(roomCode.toString()).emit("gameTied");
  });

  socket.on('chat', (msg,roomCode)=>{
    socket.to(roomCode.toString()).emit('chat',`${msg}`)
  })

  //   socket.on('disconnect', function(){
  //     /*
  //       socket.rooms is empty here
  //       leaveAll() has already been called
  //     */
  //  });

  socket.on("disconnecting", function () {
    // socket.rooms should isn't empty here
    const rooms = Array.from(socket.rooms);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("opponentLeft");
    });
  });
});

httpServer.listen(3000, () => {
  console.log("server is listening on port 3000");
});
