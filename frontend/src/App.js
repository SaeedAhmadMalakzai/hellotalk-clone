import React, { useEffect, useState } from 'react';
import Login from './Login';
import Register from './Register';
import Chat from './Chat';
import CreateMoment from './CreateMoment';
import InviteEntry from './InviteEntry';
import VoiceRoomsList from './VoiceRoomList';
import VoiceRoom from './VoiceRoom';
import { AppBar, Toolbar, Button, Typography, Box, Container, Stack, IconButton } from '@mui/material';
import { useColorMode, useColorModeValue } from '@chakra-ui/react';
import { FaMoon, FaSun } from 'react-icons/fa';
import './App.css';
import axios from 'axios';


export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null); // { id, username, isAdmin }
  const [view, setView] = useState('chat'); // chat, moments, voiceRooms, voiceRoom
  const [activeVoiceRoom, setActiveVoiceRoom] = useState(null);
  const [receiverId, setReceiverId] = useState(2); // For demo: chat with user 2

  // Fetch user info after login
  useEffect(() => {
    if (loggedIn && !user) {
      const token = localStorage.getItem('token');
      console.log("Fetching /api/me with token:", token);
      axios.get('http://localhost:5001/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        console.log('User data:', res.data);
        setUser(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch /api/me:', err.response?.data || err.message);
        setLoggedIn(false);
        localStorage.clear();
      });
    }
  }, [loggedIn, user]);

  const handleLogin = (userId) => {
    setLoggedIn(true);
    setUser(null); // Will trigger user info fetch
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    localStorage.clear();
  };

  if (!loggedIn) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Stack spacing={3}>
          <Login onLogin={handleLogin} />
          <Register onRegister={() => setLoggedIn(true)} />
          <InviteEntry isAdmin={true} />
        </Stack>
      </Container>
    );
  }

  // Navigation bar
  const { colorMode, toggleColorMode } = useColorMode();

  const navBar = (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          HelloTalk Clone
        </Typography>
        <Button color="inherit" onClick={() => setView('chat')}>Chat</Button>
        <Button color="inherit" onClick={() => setView('moments')}>Moments</Button>
        <Button color="inherit" onClick={() => setView('voiceRooms')}>Voice Rooms</Button>
        {user?.isAdmin && (
          <Button color="inherit" onClick={() => setView('invite')}>
            Invite Codes
          </Button>
        )}
        <IconButton
          size="small"
          color="inherit"
          onClick={toggleColorMode}
          sx={{ ml: 1 }}
        >
          {colorMode === 'light' ? <FaMoon /> : <FaSun />}
        </IconButton>
        <Button color="inherit" onClick={handleLogout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );

  // Main content switch
  let content = null;
  if (view === 'chat') {
    content = <Chat userId={user?.id} receiverId={receiverId} />;
  } else if (view === 'moments') {
    content = <CreateMoment userId={user?.id} />;
  } else if (view === 'voiceRooms') {
    content = (
      <VoiceRoomsList onJoin={roomId => {
        setActiveVoiceRoom(roomId);
        setView('voiceRoom');
      }} />
    );
  } else if (view === 'voiceRoom' && activeVoiceRoom) {
    content = (
      <VoiceRoom
        roomId={activeVoiceRoom}
        userId={user?.id}
        username={user?.username}
        isAdmin={user?.isAdmin}
        role="audience"
        onLeave={() => {
          setActiveVoiceRoom(null);
          setView('voiceRooms');
        }}
      />
    );
  } else if (view === 'invite' && user?.isAdmin) {
    content = <InviteEntry isAdmin={true} />;
  }

  return (
    <Box>
      {navBar}
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {content}
      </Container>
    </Box>
  );
}
