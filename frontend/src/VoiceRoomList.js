import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Text,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Stack,
  Spinner
} from '@chakra-ui/react';

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
    <Box maxW="600px" mx="auto" mt={4} p={6} bg="white" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={3}>Active Voice Rooms</Text>
      {loading ? (
        <Stack align="center"><Spinner /></Stack>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : rooms.length === 0 ? (
        <Alert status="info"><AlertIcon />No active voice rooms at the moment.</Alert>
      ) : (
        <List spacing={2}>
          {rooms.map(room => (
            <ListItem key={room.id} display="flex" justifyContent="space-between" bg="gray.50" borderRadius="md" p={2}>
              <Box>
                <Text fontWeight="medium">{room.title}</Text>
                <Text fontSize="sm" color="gray.500">Host: {room.admin_id} • Created: {new Date(room.created_at).toLocaleString()}</Text>
              </Box>
              <Button colorScheme="blue" onClick={() => onJoin(room.id)}>Join</Button>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
