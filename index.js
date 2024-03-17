const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const fs = require('fs')

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
})

let rooms = {}

async function getUsers (room) {
    let newRoom = {
        users: [],
        words: [],
        teams: {
            orange: [],
            blue: []
        },
        spymasters: {
            orange: [],
            blue: [],
        },
        clues: []
    }
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
        newRoom.users.push(socket.nickname)
    }
    io.to(room).emit('users', newRoom.users)
    rooms[room] = newRoom
}

function durstenfeldShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

function generateWords(callback) {
    fs.readFile('words.txt', 'utf8', (error, data) => {
        const lines = data.split('\n')
        const randomWords = []
        let randomWordsData = []
        while (randomWords.length < 25) {
            let randomWordIndex = Math.floor(Math.random() * lines.length)
            let randomWord = lines[randomWordIndex].trim()
            if (randomWords.includes(randomWord)) {
                continue
            }
            randomWords.push(randomWord)
        }
        for (let i = 0; i < 25; i++) {
            if (i === 0) {
                let data = {
                    word: randomWords[i],
                    colour: 'black'
                }
                randomWordsData.push(data)
            }
            if (i > 0 && i < 8) {
                let data = {
                    word: randomWords[i],
                    colour: 'blue'
                }
                randomWordsData.push(data)
            }
            if (i > 7 && i < 15) {
                let data = {
                    word: randomWords[i],
                    colour: 'orange'
                }
                randomWordsData.push(data)
            }
            if (i > 14) {
                let data = {
                    word: randomWords[i],
                    colour: 'neutral'
                }
                randomWordsData.push(data)
            }
        }
        let shuffledArray = durstenfeldShuffle(randomWordsData)
        callback(shuffledArray)
    })
}

io.on('connection', (socket) => {
    socket.on('join-room', ({name, roomToJoin}) => {
        socket.nickname = name
        socket.join(roomToJoin)
        getUsers(roomToJoin)
    })
    socket.on('start-game', (roomToJoin) => {
        generateWords((words) => {
            const room = rooms[roomToJoin]
            room.words = words
            console.log(JSON.stringify(room, null, 4))
            io.to(roomToJoin).emit('game-started', words)
        })
    })
    socket.on('join-team', ({name, roomToJoin, teamToJoin}) => {
        rooms[roomToJoin].teams[teamToJoin].push(name)
        console.log(rooms[roomToJoin])
        let toSend = {
            orange: rooms[roomToJoin].teams.orange,
            blue: rooms[roomToJoin].teams.blue
        }
        console.log(toSend)
        io.to(roomToJoin).emit('teams', toSend)
    }) 
    socket.on('become-spymaster', ({name, roomToJoin, teamToJoin}) => {
        rooms[roomToJoin].spymasters[teamToJoin].push(name)
        console.log(rooms[roomToJoin])
        let toSend = {
            orange: rooms[roomToJoin].spymasters.orange,
            blue: rooms[roomToJoin].spymasters.blue
        }
        console.log(toSend)
        io.to(roomToJoin).emit('spymasters', toSend)
    })
})

server.listen(3001, () => {
    console.log('server running')
})