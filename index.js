const express = require('express')

const app = express()

const http = require('http')

const { Server } = require('socket.io')

const cors = require('cors')

app.use(cors())

const server = http.createServer(app)

let users = []

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],

    }
})

io.on('connection', (socket) => {
    console.log(socket.id)
    socket.on('send-nickname', function(nickname) {
        socket.nickname = nickname
        users.push(socket.nickname)
        console.log(users)
        socket.emit('users-list', users)
    })
    socket.on('join-room', function(room) {
        socket.join(room)
        console.log(room)
    })
})



server.listen(3001, () => {
    console.log('server running')
})