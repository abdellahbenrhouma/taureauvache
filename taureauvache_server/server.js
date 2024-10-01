import express from 'express';
import path from 'path';
import cors from "cors";
import cookieParser from "cookie-parser";
import http from 'http';
import { instrument } from "@socket.io/admin-ui";
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://taureauvache.vercel.app", "https://admin.socket.io"],
    credentials: true
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "https://taureauvache.vercel.app",
  credentials: true
}));

let waitingPlayer = null; // Store the waiting player
let playerTurn = null; // Keep track of whose turn it is

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('playRound', (secretNumber) => {
    if (waitingPlayer) {
      // Pair the waiting player with the new player
      const player1 = waitingPlayer;
      const player2 = socket;

      waitingPlayer = null; // Reset waiting player

      // Notify both players they are paired and send them their opponent's secret number
      player1.emit('startGame', { opponent: player2.id, opponentSecret: secretNumber });
      player2.emit('startGame', { opponent: player1.id, opponentSecret: player1.secretNumber });

      // Set the first turn to Player 1
      playerTurn = player1.id;
      player1.emit('yourTurn', true); // It's Player 1's turn
      player2.emit('yourTurn', false); // It's not Player 2's turn

      // Handle player guesses
      player1.on('guess', (guess) => {
        if (playerTurn === player1.id) {
          player2.emit('opponentGuess', guess);
          // Switch turns
          playerTurn = player2.id;
          player1.emit('yourTurn', false);
          player2.emit('yourTurn', true);
        }
      });

      player2.on('guess', (guess) => {
        if (playerTurn === player2.id) {
          player1.emit('opponentGuess', guess);
          // Switch turns
          playerTurn = player1.id;
          player2.emit('yourTurn', false);
          player1.emit('yourTurn', true);
        }
      });

    } else {
      // No players waiting, put this player in the waiting queue with their secret number
      waitingPlayer = socket;
      waitingPlayer.secretNumber = secretNumber;
      socket.emit('waiting', 'Waiting for an opponent...');
    }

    socket.on('disconnect', () => {
      if (waitingPlayer === socket) {
        waitingPlayer = null; // Reset waiting player on disconnect
      }
      console.log('Player disconnected:', socket.id);
    });
  });
});

instrument(io, {
  auth: false  // Disable authentication for easy access
});

// Start the server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
