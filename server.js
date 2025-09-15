// const { timeStamp } = require('console');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const http = require('http'); // just so we can have a raw HTTP server
const { Server } = require('socket.io');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors:{
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
},
});


const db = new sqlite3.Database('./chat.db');
db.serialize(() =>{
    db.run(
        `CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
    );
});


io.on('connection', (socket) =>{
    console.log('A user connected');

    //Send chat history to new client
    db.all('SELECT username, message, timestamp FROM messages ORDER BY timestamp ASC', (err, rows) =>{
        if(err){
            console.error(err);
            return;
        }
        socket.emit('chat history', rows);
    });

        socket.on('chat message', (data) => {
            const { username, message } = data;

            db.run(
                `INSERT INTO messages (username, message) VALUES (?,?)`, [username, message], (err)=>{
                    if(err) return console.error(err);
                    io.emit('chat message', {username, message, timestamp: new Date().toISOString() })
                }
            )
        });

        socket.on('disconnect', () =>{
            console.log('user disconnected');
        });  
});

server.listen(5000, () => console.log("Server is connected"));

 



