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
        scores: {
            orange: 8,
            blue: 7,
            black: 1
        },
        guesses: [],
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
                    colour: 'black',
                    found: ''
                }
                randomWordsData.push(data)
            }
            if (i > 0 && i < 8) {
                let data = {
                    word: randomWords[i],
                    colour: 'blue',
                    found: ''
                }
                randomWordsData.push(data)
            }
            if (i > 7 && i < 16) {
                let data = {
                    word: randomWords[i],
                    colour: 'orange',
                    found: ''
                }
                randomWordsData.push(data)
            }
            if (i > 15) {
                let data = {
                    word: randomWords[i],
                    colour: 'neutral',
                    found: ''
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
            scores = room.scores
            console.log(JSON.stringify(room, null, 4))
            io.to(roomToJoin).emit('game-started', {words, scores})
            
        })
    })
    socket.on('join-team', ({name, roomToJoin, teamToJoin}) => {
        rooms[roomToJoin].teams[teamToJoin].push(name)
        let toSend = {
            orange: rooms[roomToJoin].teams.orange,
            blue: rooms[roomToJoin].teams.blue
        }
        io.to(roomToJoin).emit('teams', toSend)
    }) 
    socket.on('become-spymaster', ({name, roomToJoin, teamToJoin}) => {
        rooms[roomToJoin].spymasters[teamToJoin].push(name)
        let toSend = {
            orange: rooms[roomToJoin].spymasters.orange,
            blue: rooms[roomToJoin].spymasters.blue
        }
        io.to(roomToJoin).emit('spymasters', toSend)
    })
    socket.on('give-clue', ({roomToJoin, teamToJoin, clue}) => {
        rooms[roomToJoin].clues.push(clue)
        let toSend = {
            clues: rooms[roomToJoin].clues,

        }
        io.to(roomToJoin).emit('clues', toSend)
    })
    socket.on('give-guess', ({roomToJoin, teamToJoin, a}) => {
        console.log(a)
        if (!(rooms[roomToJoin].guesses.includes(a))) {
            rooms[roomToJoin].guesses.push(a)
            let word = rooms[roomToJoin].words.find((word) => word.word === a)
            if (word.colour === 'orange') {
                rooms[roomToJoin].scores['orange'] = rooms[roomToJoin].scores['orange'] - 1
            }
            if (word.colour === 'blue') {
                rooms[roomToJoin].scores['blue'] = rooms[roomToJoin].scores['blue'] - 1
            }
            if (word.colour === 'black') {
                rooms[roomToJoin].scores['black'] = rooms[roomToJoin].scores['black'] - 1
            }
        }
        console.log(rooms[roomToJoin].guesses)
        let word = rooms[roomToJoin].words.find((word) => word.word === a)
        word.found = word.colour + '-found'
        let words = rooms[roomToJoin].words
        let scores = rooms[roomToJoin].scores
        io.to(roomToJoin).emit('guess-received', {words, scores})

        if (rooms[roomToJoin].scores['black'] == 0) {
            io.to(roomToJoin).emit('black-win', 'black-win')
        }
        if (rooms[roomToJoin].scores['blue'] == 0) {
            io.to(roomToJoin).emit('blue-win', 'blue-win')
        }
        if (rooms[roomToJoin].scores['orange'] == 0) {
            io.to(roomToJoin).emit('orange-win', 'orange-win')
        }
    })
    socket.on('end-turn', ({roomToJoin, teamToJoin}) => {
        io.to(roomToJoin).emit('turn-end', 'turn-end')
    })
})

server.listen(3001, () => {
    console.log('server running')
})