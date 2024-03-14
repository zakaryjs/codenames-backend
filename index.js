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

async function getUsers (room) {
    let users = []
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
        users.push(socket.nickname)
    }
    io.to(room).emit('users', users)
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
        for (let i = 0; i < 25; i++) {
            let randomWordIndex = Math.floor(Math.random() * lines.length)
            let randomWord = lines[randomWordIndex].trim()
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
            console.log(words)
            io.to(roomToJoin).emit('game-started', words)
        })
        
    })
})

server.listen(3001, () => {
    console.log('server running')
})