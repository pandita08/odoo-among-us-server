const TASKS = [
    {
        id: 'task1',
        name: 'Completar informe',
        description: 'Completa el informe mensual de ventas',
        type: 'normal',
        duration: 30000 // 30 seconds
    },
    {
        id: 'task2',
        name: 'Revisar inventario',
        description: 'Verifica el inventario del almacén',
        type: 'normal',
        duration: 45000 // 45 seconds
    },
    {
        id: 'task3',
        name: 'Actualizar base de datos',
        description: 'Sincroniza la base de datos con el servidor',
        type: 'normal',
        duration: 60000 // 1 minute
    },
    {
        id: 'task4',
        name: 'Configurar módulo',
        description: 'Configura el nuevo módulo de contabilidad',
        type: 'normal',
        duration: 40000 // 40 seconds
    },
    {
        id: 'task5',
        name: 'Revisar errores',
        description: 'Revisa y corrige errores en el sistema',
        type: 'normal',
        duration: 35000 // 35 seconds
    }
];

const SABOTAGES = [
    {
        id: 'sabotage1',
        name: 'Cortar energía',
        description: 'Apaga la energía del servidor',
        duration: 120000, // 2 minutes
        type: 'critical'
    },
    {
        id: 'sabotage2',
        name: 'Corromper base de datos',
        description: 'Corrompe la base de datos principal',
        duration: 90000, // 1.5 minutes
        type: 'critical'
    },
    {
        id: 'sabotage3',
        name: 'Bloquear red',
        description: 'Bloquea la conexión de red',
        duration: 60000, // 1 minute
        type: 'normal'
    }
];

class GameLogic {
    constructor() {
        this.tasks = TASKS;
        this.sabotages = SABOTAGES;
    }

    generateTasksForPlayer(playerCount) {
        const tasksPerPlayer = Math.floor(3 + Math.random() * 2); // 3-4 tasks per player
        const totalTasks = playerCount * tasksPerPlayer;
        
        let availableTasks = [...this.tasks];
        const selectedTasks = [];
        
        while (selectedTasks.length < totalTasks) {
            if (availableTasks.length === 0) {
                availableTasks = [...this.tasks];
            }
            
            const randomIndex = Math.floor(Math.random() * availableTasks.length);
            selectedTasks.push({...availableTasks[randomIndex]});
            availableTasks.splice(randomIndex, 1);
        }
        
        return selectedTasks;
    }

    assignTasksToPlayers(players) {
        const allTasks = this.generateTasksForPlayer(players.length);
        const tasksPerPlayer = allTasks.length / players.length;
        
        let taskIndex = 0;
        for (const player of players) {
            player.tasks = allTasks.slice(taskIndex, taskIndex + tasksPerPlayer);
            taskIndex += tasksPerPlayer;
        }
    }

    getRandomSabotage() {
        const randomIndex = Math.floor(Math.random() * this.sabotages.length);
        return {...this.sabotages[randomIndex]};
    }

    calculateTaskProgress(completedTasks, totalTasks) {
        return (completedTasks / totalTasks) * 100;
    }

    canCallMeeting(player, lastMeetingTime) {
        const COOLDOWN = 300000; // 5 minutes
        return Date.now() - lastMeetingTime >= COOLDOWN;
    }

    validateVote(voter, target, room) {
        if (!voter || !target) return false;
        if (!voter.isAlive) return false;
        if (voter.id === target.id) return false;
        if (room.gameState !== 'meeting') return false;
        return true;
    }

    checkTaskCompletion(player, taskId) {
        const task = player.tasks.find(t => t.id === taskId);
        if (!task) return false;
        
        task.completed = true;
        player.tasksCompleted++;
        return true;
    }

    getPlayerStats(player) {
        return {
            id: player.id,
            name: player.name,
            role: player.role,
            isAlive: player.isAlive,
            tasksCompleted: player.tasksCompleted,
            totalTasks: player.tasks.length,
            progress: this.calculateTaskProgress(player.tasksCompleted, player.tasks.length)
        };
    }
}

module.exports = new GameLogic(); 