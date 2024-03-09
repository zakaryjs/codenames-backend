const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],

    }
})

async function getUsers (room) {
    let users = []
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
        // console.log(socket.nickname)
        users.push(socket.nickname)
    }
    io.to(room).emit('users', users)
}

io.on('connection', (socket) => {
    socket.on('join-room', ({name, roomToJoin}) => {
        socket.nickname = name
        socket.join(roomToJoin)
        // console.log(name, roomToJoin)
        getUsers(roomToJoin)
    })
})

server.listen(3001, () => {
    console.log('server running')
})