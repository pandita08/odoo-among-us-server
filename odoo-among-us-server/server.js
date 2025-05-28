require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RoomManager = require('./room-manager');
const gameLogic = require('./game-logic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'https://pandita08.github.io',
            'http://localhost:3000',
            'http://127.0.0.1:5500'
        ],
        methods: ['GET', 'POST']
    }
});

const roomManager = new RoomManager();

// Middleware
app.use(cors());
app.use(express.json());

// HTTP Routes
app.get('/', (req, res) => {
    res.json({
        status: 'Odoo Among Us Server Running! 🎮',
        timestamp: new Date().toISOString(),
        ...roomManager.getStats()
    });
});

app.get('/stats', (req, res) => {
    res.json(roomManager.getStats());
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create new game room
    socket.on('createGame', ({ playerName }) => {
        const room = roomManager.createRoom(socket.id, playerName);
        socket.join(room.roomCode);
        
        socket.emit('gameCreated', {
            roomCode: room.roomCode,
            players: room.getPlayersArray()
        });
    });

    // Join existing game room
    socket.on('joinGame', ({ roomCode, playerName }) => {
        const result = roomManager.joinRoom(roomCode, socket.id, playerName);
        
        if (!result.success) {
            socket.emit('joinError', { error: result.error });
            return;
        }

        const room = result.room;
        socket.join(roomCode);
        
        socket.emit('joinedGame', {
            roomCode,
            players: room.getPlayersArray()
        });
        
        socket.to(roomCode).emit('playerJoined', {
            players: room.getPlayersArray()
        });
    });

    // Start game
    socket.on('startGame', ({ roomCode }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room || !room.isReadyToStart()) {
            socket.emit('error', { message: 'Cannot start game' });
            return;
        }

        const host = room.players.get(socket.id);
        if (!host || !host.isHost) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
        }

        room.gameState = 'playing';
        room.assignRoles();
        gameLogic.assignTasksToPlayers(room.getPlayersArray());

        io.to(roomCode).emit('gameStarted', {
            players: room.getPlayersArray().map(player => ({
                id: player.id,
                name: player.name,
                role: player.role,
                tasks: player.tasks
            }))
        });
    });

    // Handle chat messages
    socket.on('sendMessage', ({ roomCode, message }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        io.to(roomCode).emit('newMessage', {
            playerId: socket.id,
            playerName: player.name,
            message,
            timestamp: Date.now()
        });
    });

    // Call emergency meeting
    socket.on('callMeeting', ({ roomCode, reason }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.get(socket.id);
        if (!player || !player.isAlive) return;

        room.gameState = 'meeting';
        room.startVoting(reason);

        io.to(roomCode).emit('meetingCalled', {
            calledBy: {
                id: socket.id,
                name: player.name
            },
            reason,
            players: room.getPlayersArray()
        });
    });

    // Handle voting
    socket.on('castVote', ({ roomCode, targetId }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const voter = room.players.get(socket.id);
        const target = room.players.get(targetId);

        if (!gameLogic.validateVote(voter, target, room)) {
            socket.emit('error', { message: 'Invalid vote' });
            return;
        }

        room.processVote(socket.id, targetId);
        
        // Check if all alive players have voted
        const alivePlayers = room.getPlayersArray().filter(p => p.isAlive);
        const votes = room.currentVoting.votes.size;
        
        if (votes === alivePlayers.length) {
            const results = room.getVotingResults();
            if (results.eliminated) {
                const eliminatedPlayer = room.players.get(results.eliminated);
                eliminatedPlayer.isAlive = false;
            }

            io.to(roomCode).emit('votingResults', {
                results,
                eliminated: results.eliminated ? room.players.get(results.eliminated) : null
            });

            // Check win condition
            const winner = room.checkWinCondition();
            if (winner) {
                room.gameState = 'ended';
                io.to(roomCode).emit('gameEnded', {
                    winner,
                    players: room.getPlayersArray()
                });
            } else {
                room.gameState = 'playing';
                io.to(roomCode).emit('meetingEnded', {
                    players: room.getPlayersArray()
                });
            }
        }
    });

    // Complete task
    socket.on('completeTask', ({ roomCode, taskId }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.get(socket.id);
        if (!player || !player.isAlive) return;

        if (gameLogic.checkTaskCompletion(player, taskId)) {
            io.to(roomCode).emit('taskCompleted', {
                playerId: socket.id,
                taskId,
                progress: gameLogic.getPlayerStats(player)
            });
        }
    });

    // Report body
    socket.on('reportBody', ({ roomCode }) => {
        const room = roomManager.getRoom(roomCode);
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.get(socket.id);
        if (!player || !player.isAlive) return;

        room.gameState = 'meeting';
        room.startVoting('Body reported');

        io.to(roomCode).emit('meetingCalled', {
            calledBy: {
                id: socket.id,
                name: player.name
            },
            reason: 'Body reported',
            players: room.getPlayersArray()
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Find and leave room
        for (const [roomCode, room] of roomManager.rooms.entries()) {
            if (room.players.has(socket.id)) {
                roomManager.leaveRoom(roomCode, socket.id);
                io.to(roomCode).emit('playerLeft', {
                    playerId: socket.id,
                    players: room.getPlayersArray()
                });
                break;
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 