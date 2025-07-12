import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import { Box, Button, Text, Input, Stack } from '@chakra-ui/react';

const socket = io('http://localhost:5001', { transports: ['websocket'] });

export default function VoiceRoom({ roomId, userId, role }) {
  const [stage, setStage] = useState([]);
  const [audience, setAudience] = useState([]);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [stageRequests, setStageRequests] = useState([]);
  const [peers, setPeers] = useState({});
  const myAudio = useRef();

  useEffect(() => {
    // Join room and get audio stream
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      myAudio.current.srcObject = stream;
      socket.emit('join-voice-room', { roomId, userId, role });

      socket.on('room-update', ({ stage, audience }) => {
        setStage(stage);
        setAudience(audience);
      });

      socket.on('stage-request', ({ userId }) => {
        setStageRequests(prev => [...prev, userId]);
      });

      socket.on('stage-approved', ({ userId: approvedUserId }) => {
        if (approvedUserId === userId) {
          // Upgrade to stage: renegotiate peers
        }
      });

      socket.on('signal', ({ signal, fromUserId }) => {
        if (!peers[fromUserId]) {
          const peer = new Peer({ initiator: false, trickle: false, stream });
          peer.signal(signal);
          setPeers(prev => ({ ...prev, [fromUserId]: peer }));
        }
      });

      socket.on('new-comment', data => {
        setComments(prev => [...prev, data]);
      });
    });
    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [roomId, userId, role]);

  const requestStage = () => {
    socket.emit('stage-request', { roomId, userId });
  };

  const sendComment = () => {
    axios.post(`http://localhost:5001/api/voice-rooms/${roomId}/comment`, { comment }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setComment('');
  };

  return (
    <Box p={4}>
      <Text fontSize="xl" fontWeight="bold" mb={3}>Voice Room</Text>
      <audio ref={myAudio} autoPlay controls />
      <Text mt={2}><strong>Stage:</strong> {stage.join(', ')}</Text>
      <Text mb={2}><strong>Audience:</strong> {audience.join(', ')}</Text>
      {role === 'audience' && (
        <Button colorScheme="blue" size="sm" onClick={requestStage} mb={2}>Request to Speak</Button>
      )}
      <Stack direction="row" mb={2}>
        <Input flex={1} value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment..." />
        <Button onClick={sendComment}>Send</Button>
      </Stack>
      <Box as="ul" pl={4}>
        {comments.map((c, i) => (
          <Box as="li" key={i}>{c.userId}: {c.comment}</Box>
        ))}
      </Box>
    </Box>
  );
}
