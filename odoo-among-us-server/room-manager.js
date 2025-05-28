class GameRoom {
    constructor(roomCode, hostId) {
        this.roomCode = roomCode;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = 'lobby';
        this.maxPlayers = 8;
        this.currentVoting = null;
        this.tasks = [];
        this.createdAt = Date.now();
    }

    addPlayer(playerId, playerName) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            role: null,
            isAlive: true,
            tasksCompleted: 0,
            isHost: playerId === this.hostId
        });

        return true;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        this.players.delete(playerId);

        // If host left, assign new host
        if (player.isHost && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
            this.hostId = newHost.id;
        }
    }

    assignRoles() {
        const playerCount = this.players.size;
        const roles = [];
        
        // Determine number of saboteurs based on player count
        const saboteurCount = playerCount <= 6 ? 1 : 2;
        
        // Add saboteurs
        for (let i = 0; i < saboteurCount; i++) {
            roles.push('saboteador');
        }
        
        // Add special roles if enough players
        if (playerCount >= 6) {
            roles.push('analista');
            roles.push('tecnico');
        }
        
        // Fill remaining with empleados
        while (roles.length < playerCount) {
            roles.push('empleado');
        }
        
        // Shuffle roles
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }
        
        // Assign roles to players
        let roleIndex = 0;
        for (const player of this.players.values()) {
            player.role = roles[roleIndex++];
        }
    }

    startVoting(reason) {
        this.currentVoting = {
            reason,
            votes: new Map(),
            startTime: Date.now(),
            duration: 120000 // 2 minutes
        };
    }

    processVote(playerId, targetId) {
        if (!this.currentVoting) return false;
        
        const voter = this.players.get(playerId);
        const target = this.players.get(targetId);
        
        if (!voter || !target || !voter.isAlive) return false;
        
        this.currentVoting.votes.set(playerId, targetId);
        return true;
    }

    getVotingResults() {
        if (!this.currentVoting) return null;
        
        const voteCount = new Map();
        for (const targetId of this.currentVoting.votes.values()) {
            voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
        }
        
        let maxVotes = 0;
        let eliminatedPlayer = null;
        
        for (const [playerId, votes] of voteCount.entries()) {
            if (votes > maxVotes) {
                maxVotes = votes;
                eliminatedPlayer = playerId;
            }
        }
        
        return {
            eliminated: eliminatedPlayer,
            voteCount: Object.fromEntries(voteCount)
        };
    }

    checkWinCondition() {
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
        const aliveSaboteurs = alivePlayers.filter(p => p.role === 'saboteador');
        
        // Saboteurs win if they equal or outnumber employees
        if (aliveSaboteurs.length >= alivePlayers.length / 2) {
            return 'saboteurs';
        }
        
        // Employees win if all saboteurs are eliminated
        if (aliveSaboteurs.length === 0) {
            return 'employees';
        }
        
        return null;
    }

    getPlayersArray() {
        return Array.from(this.players.values());
    }

    isReadyToStart() {
        return this.players.size >= 4 && this.gameState === 'lobby';
    }
}

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.cleanupInterval = setInterval(() => this.cleanupRooms(), 300000); // 5 minutes
    }

    generateRoomCode() {
        let code;
        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (this.rooms.has(code));
        return code;
    }

    createRoom(hostId, hostName) {
        const roomCode = this.generateRoomCode();
        const room = new GameRoom(roomCode, hostId);
        room.addPlayer(hostId, hostName);
        this.rooms.set(roomCode, room);
        return room;
    }

    joinRoom(roomCode, playerId, playerName) {
        const room = this.rooms.get(roomCode);
        if (!room || room.gameState !== 'lobby') {
            return { success: false, error: 'Room not found or game already started' };
        }
        
        if (!room.addPlayer(playerId, playerName)) {
            return { success: false, error: 'Room is full' };
        }
        
        return { success: true, room };
    }

    leaveRoom(roomCode, playerId) {
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        room.removePlayer(playerId);
        
        if (room.players.size === 0) {
            this.rooms.delete(roomCode);
        }
    }

    cleanupRooms() {
        const now = Date.now();
        for (const [code, room] of this.rooms.entries()) {
            if (room.players.size === 0 || (now - room.createdAt > 3600000)) { // 1 hour
                this.rooms.delete(code);
            }
        }
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    getStats() {
        return {
            activeRooms: this.rooms.size,
            totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.size, 0),
            rooms: Array.from(this.rooms.values()).map(room => ({
                code: room.roomCode,
                players: room.players.size,
                state: room.gameState,
                maxPlayers: room.maxPlayers
            }))
        };
    }
}

module.exports = RoomManager; 