import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, CircularProgress, Alert, Stack
} from '@mui/material';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/login', {
        email: email.trim(),
        password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      onLogin(res.data.userId);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setServerError('');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
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
      <Typography variant="h5" gutterBottom>Login</Typography>
      <Stack spacing={2}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={handleInputChange(setEmail)}
          autoComplete="email"
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={handleInputChange(setPassword)}
          autoComplete="current-password"
          required
          fullWidth
        />
        {/* Uncomment below to add a "Forgot Password?" link in the future */}
        {/* <Button variant="text" color="primary" size="small">Forgot Password?</Button> */}
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
      </Stack>
    </Box>
  );
}
