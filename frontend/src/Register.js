import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, CircularProgress, Alert, Stack
} from '@mui/material';

export default function Register({ onRegister }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    inviteCode: '',
    native_language: '',
    learning_language: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client-side validation
  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.username) errs.username = 'Username is required';
    if (!form.inviteCode) errs.inviteCode = 'Invite code is required';
    return errs;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setServerError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await axios.post('http://localhost:5001/api/register', {
        ...form,
        email: form.email.trim(),
        inviteCode: form.inviteCode.trim()
      });
      onRegister();
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? err.response.data.errors.map(e => e.msg).join('\n')
          : 'Registration failed')
      );
    }
    setLoading(false);
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
      <Typography variant="h5" gutterBottom>Register</Typography>
      <Stack spacing={2}>
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          autoComplete="email"
          fullWidth
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="new-password"
          fullWidth
          required
        />
        <TextField
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
          fullWidth
          required
        />
        <TextField
          label="Invite Code"
          name="inviteCode"
          value={form.inviteCode}
          onChange={handleChange}
          error={!!errors.inviteCode}
          helperText={errors.inviteCode}
          fullWidth
          required
        />
        <TextField
          label="Native Language"
          name="native_language"
          value={form.native_language}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Learning Language"
          name="learning_language"
          value={form.learning_language}
          onChange={handleChange}
          fullWidth
        />
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Register'}
        </Button>
      </Stack>
    </Box>
  );
}
