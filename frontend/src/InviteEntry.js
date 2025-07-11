import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Typography, CircularProgress, Alert, Stack, TextField
} from '@mui/material';

export default function InviteEntry({ isAdmin }) {
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInvite = async () => {
    setLoading(true);
    setError('');
    setInvite('');
    try {
      const res = await axios.post(
        'http://localhost:5001/api/invites',
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setInvite(res.data.code);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to generate invite code. Please try again.'
      );
    }
    setLoading(false);
  };

  // Only show to admins
  if (isAdmin === false) return null;

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 4,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={generateInvite}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Invite Code'}
        </Button>
        {invite && (
          <TextField
            label="Invite Code"
            value={invite}
            InputProps={{
              readOnly: true,
            }}
            fullWidth
            margin="normal"
          />
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Typography variant="body2" color="textSecondary">
          Only admins can generate invite codes.
        </Typography>
      </Stack>
    </Box>
  );
}
