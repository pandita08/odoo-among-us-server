# Odoo Among Us Server 🎮

Servidor backend para el juego multijugador "Odoo Among Us" implementado con Node.js, Express y Socket.IO.

## Características 🌟

- Soporte para hasta 8 jugadores por sala
- Sistema de roles: Empleados, Saboteadores, Analista y Técnico
- Chat en tiempo real durante reuniones
- Sistema de votaciones para eliminar jugadores
- Tareas específicas para cada rol
- Gestión automática de salas
- Compatible con Railway deployment

## Requisitos 📋

- Node.js >= 16.0.0
- npm >= 7.0.0

## Instalación 🚀

1. Clona el repositorio:
```bash
git clone https://github.com/yourusername/odoo-among-us-server.git
cd odoo-among-us-server
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto:
```env
PORT=3000
NODE_ENV=development
```

## Desarrollo 💻

Para iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

## Producción 🏗️

Para iniciar el servidor en modo producción:
```bash
npm start
```

## API Endpoints 🌐

### HTTP Endpoints

- `GET /`: Estado del servidor
- `GET /stats`: Estadísticas detalladas

### Socket.IO Events

#### Cliente -> Servidor

- `createGame`: Crear nueva sala
- `joinGame`: Unirse a sala existente
- `startGame`: Iniciar partida
- `sendMessage`: Enviar mensaje de chat
- `callMeeting`: Llamar reunión de emergencia
- `castVote`: Votar para eliminar jugador
- `completeTask`: Marcar tarea como completada
- `reportBody`: Reportar jugador eliminado

#### Servidor -> Cliente

- `gameCreated`: Confirmación de sala creada
- `joinedGame`: Confirmación de unión exitosa
- `joinError`: Error al unirse
- `playerJoined`: Notificar nuevo jugador
- `playerLeft`: Notificar jugador desconectado
- `gameStarted`: Inicio de partida
- `newMessage`: Nuevo mensaje de chat
- `meetingCalled`: Reunión de emergencia iniciada
- `votingResults`: Resultados de votación
- `gameEnded`: Fin de partida

## Despliegue en Railway 🚂

1. Crea una cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno:
   - `PORT`: Puerto del servidor
   - `NODE_ENV`: production

## Contribuir 🤝

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia 📄

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto 📧

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@example.com

Link del Proyecto: [https://github.com/yourusername/odoo-among-us-server](https://github.com/yourusername/odoo-among-us-server) 