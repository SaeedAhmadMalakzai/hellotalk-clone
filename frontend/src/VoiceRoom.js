import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';

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

      socket.on('stage-approved', ({ userId }) => {
        if (userId === userId) {
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
    <div>
      <h2>Voice Room</h2>
      <audio ref={myAudio} autoPlay controls />
      <div>
        <strong>Stage:</strong> {stage.join(', ')}
        <br />
        <strong>Audience:</strong> {audience.join(', ')}
      </div>
      {role === 'audience' && (
        <button onClick={requestStage}>Request to Speak</button>
      )}
      <div>
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment..." />
        <button onClick={sendComment}>Send</button>
        <ul>
          {comments.map((c, i) => <li key={i}>{c.userId}: {c.comment}</li>)}
        </ul>
      </div>
      {/* Render audio elements for each peer here */}
    </div>
  );
}
