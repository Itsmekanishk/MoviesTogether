import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import { NotificationProvider } from './context/NotificationContext';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <SocketProvider>
          <RoomProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
            </Routes>
          </RoomProvider>
        </SocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
