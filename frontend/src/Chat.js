import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, Paper, Stack, CircularProgress, Alert, List, ListItem, ListItemText
} from '@mui/material';

const socket = io('http://localhost:5001');

export default function Chat({ userId, receiverId }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Load chat history on mount or when receiver changes
  useEffect(() => {
    setLoading(true);
    setError('');
    axios
      .get(`http://localhost:5001/api/messages?user1=${userId}&user2=${receiverId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => setMessages(res.data))
      .catch(() => setError('Failed to load messages.'))
      .finally(() => setLoading(false));
  }, [userId, receiverId]);

  // Socket.IO: join room and handle incoming messages
  useEffect(() => {
    socket.emit('join', userId);

    const handleReceive = data => setMessages(prev => [...prev, data]);
    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, [userId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const msgObj = { senderId: userId, receiverId, content: message, created_at: new Date().toISOString() };
    socket.emit('send_message', msgObj);
    setMessages(prev => [...prev, msgObj]);
    setMessage('');
  };

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h6" gutterBottom>Chat</Typography>
      <Paper sx={{ maxHeight: 300, overflowY: 'auto', mb: 2, p: 2 }}>
        {loading ? (
          <Stack alignItems="center"><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List>
            {messages.map((msg, idx) => (
              <ListItem
                key={idx}
                sx={{
                  justifyContent: msg.senderId === userId ? 'flex-end' : 'flex-start'
                }}
              >
                <ListItemText
                  primary={msg.content}
                  secondary={new Date(msg.created_at).toLocaleTimeString()}
                  sx={{
                    textAlign: msg.senderId === userId ? 'right' : 'left',
                    bgcolor: msg.senderId === userId ? 'primary.light' : 'grey.100',
                    color: msg.senderId === userId ? 'white' : 'black',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    maxWidth: '70%',
                    display: 'inline-block'
                  }}
                />
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Paper>
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <Button variant="contained" color="primary" onClick={sendMessage} disabled={!message.trim()}>
          Send
        </Button>
      </Stack>
    </Box>
  );
}
