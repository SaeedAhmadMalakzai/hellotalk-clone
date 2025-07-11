import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Stack
} from '@mui/material';

export default function VoiceRoomsList({ onJoin }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    setRooms([]);
    axios.get('http://localhost:5001/api/voice-rooms', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (isMounted) setRooms(res.data);
      })
      .catch(() => {
        if (isMounted) setError('Failed to load voice rooms.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: 'auto',
        mt: 4,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom>Active Voice Rooms</Typography>
      {loading ? (
        <Stack alignItems="center"><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : rooms.length === 0 ? (
        <Alert severity="info">No active voice rooms at the moment.</Alert>
      ) : (
        <List>
          {rooms.map(room => (
            <ListItem
              key={room.id}
              secondaryAction={
                <Button variant="contained" onClick={() => onJoin(room.id)}>
                  Join
                </Button>
              }
              sx={{ mb: 1, borderRadius: 2, bgcolor: 'grey.50' }}
            >
              <ListItemText
                primary={room.title}
                secondary={`Host: ${room.admin_id} • Created: ${new Date(room.created_at).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
