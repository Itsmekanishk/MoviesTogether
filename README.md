# MoviesTogether

A real-time synchronized watch party platform that enables users to watch YouTube videos together with integrated video chat, text chat, and precise playback synchronization.

## Features

- **Real-Time Video Synchronization**: Watch videos in perfect sync with friends
- **YouTube Integration**: Add videos via URL paste or search
- **Text Chat**: Real-time messaging with emoji reactions and timestamp links
- **Queue Management**: Collaborative playlist with drag-and-drop reordering
- **WebRTC Video Chat**: SFU architecture for scalable video/audio communication
- **Room Management**: Create and join rooms with unique codes
- **Democratic Control**: Any participant can control playback
- **Mobile Responsive**: Fully responsive design for all devices

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Socket.io-client (real-time communication)
- mediasoup-client (WebRTC)
- YouTube IFrame API

### Backend
- Node.js + Express + TypeScript
- Socket.io (WebSocket server)
- mediasoup (SFU for WebRTC)
- MongoDB with Mongoose (optional, for user accounts)

## Prerequisites

- Node.js 18+
- npm or pnpm
- YouTube Data API key (for search functionality)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MoviesTogether
```

### 2. Server Setup

```bash
cd server
npm install
```

Create `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `YOUTUBE_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `CORS_ORIGIN`: Set to your client URL (default: http://localhost:5173)
- Other settings can use defaults for development

Start the server:

```bash
npm run dev
```

Server will run on `http://localhost:3000`

### 3. Client Setup

```bash
cd client
npm install
```

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults should work for local development)

Start the client:

```bash
npm run dev
```

Client will run on `http://localhost:5173`

### 4. Usage

1. Open `http://localhost:5173` in your browser
2. Click "Create New Room" to start a new watch party
3. Share the room URL with friends
4. Add YouTube videos to the queue
5. Anyone can control playback - it syncs for everyone!

## Project Structure

```
MoviesTogether/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Route pages
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS styles
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── routes/        # HTTP routes
│   │   ├── services/      # Business logic
│   │   ├── socket/        # Socket.io handlers
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── index.ts           # Server entry point
└── README.md
```

## Core Features Documentation

### Room Management

- **Create Room**: Generates unique 10-character room ID
- **Join Room**: Enter room code or use shared URL
- **Host Privileges**: Kick users, transfer host, delete room
- **Auto-Cleanup**: Rooms deleted after 24 hours of inactivity

### Video Synchronization

- **Democratic Control**: Any participant can play, pause, or seek
- **Drift Detection**: Automatic resync if drift exceeds 3 seconds
- **Latency Compensation**: Accounts for network delays
- **Buffering Management**: Group pauses if buffering exceeds 5 seconds

### Queue System

- **Add Videos**: Paste YouTube URL or use search
- **Reorder**: Drag and drop to change order
- **Auto-Advance**: Automatically plays next video when current ends
- **Collaborative**: Anyone can add/remove videos

### Chat System

- **Real-Time Messages**: Instant message delivery
- **System Messages**: Automatic notifications for events
- **Emoji Reactions**: React to messages with emojis
- **Timestamp Links**: Click timestamps to jump to specific times

### WebRTC Video Chat

- **SFU Architecture**: Scalable for 20+ participants
- **Auto-Ducking**: Video audio reduces when someone speaks
- **Adaptive Quality**: Adjusts based on network conditions
- **Graceful Degradation**: Works without video chat if needed

## Development

### Building for Production

**Server:**
```bash
cd server
npm run build
npm start
```

**Client:**
```bash
cd client
npm run build
npm run preview
```

### Environment Variables

**Server `.env`:**
- `PORT`: Server port (default: 3000)
- `YOUTUBE_API_KEY`: Required for search functionality
- `MAX_ROOM_PARTICIPANTS`: Maximum users per room (default: 20)
- `MEDIASOUP_*`: WebRTC configuration

**Client `.env`:**
- `VITE_SERVER_URL`: Backend API URL
- `VITE_SOCKET_URL`: WebSocket server URL

## API Endpoints

### HTTP Routes

- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/:roomId` - Get room info
- `GET /api/youtube/search?q=query` - Search YouTube videos

### Socket.io Events

**Client → Server:**
- `room:join` - Join a room
- `room:leave` - Leave room
- `video:play` - Play video
- `video:pause` - Pause video
- `video:seek` - Seek to position
- `chat:message` - Send chat message
- `queue:add` - Add video to queue

**Server → Client:**
- `room:joined` - Successfully joined room
- `sync:broadcast` - Video sync command
- `chat:new-message` - New chat message
- `queue:updated` - Queue changed
- `participant:joined` - User joined
- `participant:left` - User left

## Troubleshooting

**Video won't load:**
- Check if YouTube video is embeddable
- Some videos are restricted by copyright or region

**Connection issues:**
- Verify server is running on correct port
- Check CORS configuration in server .env
- Ensure firewall allows WebSocket connections

**Video chat not working:**
- Grant camera/microphone permissions
- Check mediasoup port range (40000-49999) is open
- Verify STUN/TURN servers if behind restrictive NAT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is provided as-is for educational and personal use.

## Acknowledgments

- Built with React, Node.js, Socket.io, and mediasoup
- YouTube IFrame API for video playback
- TailwindCSS for styling

---

Generated with Claude Code