const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

let players = [];
let wordHistory = [];
let currentPlayerIndex = 0;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    socket.on("joinGame", (name) => {
        players.push({ id: socket.id, name });
        if (players.length === 1) {
            io.emit("turnUpdate", players[currentPlayerIndex].name);
        }
        io.emit("updatePlayers", players);
        io.emit("updateWords", wordHistory);
    });

    socket.on("submitWord", (word) => {
        if (socket.id !== players[currentPlayerIndex].id) return;

        if (wordHistory.length > 0) {
            let lastWord = wordHistory[wordHistory.length - 1].word;
            if (word[0].toLowerCase() !== lastWord.slice(-1).toLowerCase()) {
                socket.emit("invalidWord", "Từ không hợp lệ! Phải bắt đầu bằng: " + lastWord.slice(-1));
                return;
            }
        }

        wordHistory.push({ name: players[currentPlayerIndex].name, word });
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

        io.emit("wordSubmitted", { name: players[currentPlayerIndex].name, word });
        io.emit("turnUpdate", players[currentPlayerIndex].name);
    });

    socket.on("disconnect", () => {
        players = players.filter(p => p.id !== socket.id);
        if (players.length === 0) {
            wordHistory = [];
            currentPlayerIndex = 0;
        } else if (currentPlayerIndex >= players.length) {
            currentPlayerIndex = 0;
        }

        io.emit("updatePlayers", players);
        io.emit("turnUpdate", players.length ? players[currentPlayerIndex].name : null);
    });
});

server.listen(3000, () => {
    console.log("Server chạy trên cổng 3000");
});

