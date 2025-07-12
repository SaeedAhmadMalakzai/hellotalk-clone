import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  Text,
  Flex,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  List,
  ListItem
} from '@chakra-ui/react';

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
    <Box maxW="500px" mx="auto" mt={4} p={6} bg="white" borderRadius="md" boxShadow="md">
      <Text fontSize="xl" fontWeight="bold" mb={3}>Chat</Text>
      <Box maxH="300px" overflowY="auto" mb={2} p={2} borderWidth="1px" borderRadius="md">
        {loading ? (
          <Flex justify="center"><Spinner /></Flex>
        ) : error ? (
          <Alert status="error"><AlertIcon />{error}</Alert>
        ) : (
          <List spacing={2}>
            {messages.map((msg, idx) => (
              <ListItem key={idx} textAlign={msg.senderId === userId ? 'right' : 'left'}>
                <Box
                  bg={msg.senderId === userId ? 'blue.500' : 'gray.100'}
                  color={msg.senderId === userId ? 'white' : 'black'}
                  borderRadius="md"
                  px={2}
                  py={1}
                  display="inline-block"
                  maxW="70%"
                >
                  {msg.content}
                </Box>
                <Text fontSize="xs" color="gray.500">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      <Flex mt={2} gap={2}>
        <Input
          flex={1}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <Button colorScheme="blue" onClick={sendMessage} isDisabled={!message.trim()}>
          Send
        </Button>
      </Flex>
    </Box>
  );
}
