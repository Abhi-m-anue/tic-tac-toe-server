const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

const app = express()
app.use(express.static('public'))
const httpServer = createServer(app)
const io = new Server(httpServer)

io.on('connection',(socket)=>{
    // console.log('connected')
    socket.on('createNewRoom',()=>{
        var thisGameId = Math.floor(Math.random() * 100000);
        socket.emit('newGameCreated', {gameId: thisGameId, mySocketId: socket.id});
        socket.join(thisGameId.toString());
    })

    socket.on('joinRoom',(data)=>{
        const {roomId} = data;
        // console.log(roomId)
        const roomExists = io.sockets.adapter.rooms.has(roomId.toString());
        if(roomExists){
            const sz = io.sockets.adapter.rooms.get(roomId.toString()).size;
            // console.log(sz)
            if(sz === 1){
                socket.join(roomId)
                // console.log('joined room')
                // console.log(io.sockets.adapter.rooms)
                socket.emit('joinedRoom',`You have joined the room ${roomId}`)
            }
            else{
                // console.log('room full')
                socket.emit('error',`cannot join, room ${roomId} is full`)
            }
        }
        else{
            // console.log('Invalid room number')
            socket.emit('error',`Room ${roomId} does not exist`)
        }
    })
})


httpServer.listen(3000,()=>{
    console.log('server is listening on port 3000')
})