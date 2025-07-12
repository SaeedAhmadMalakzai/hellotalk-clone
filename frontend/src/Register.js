import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Stack,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';

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
      as="form"
      onSubmit={handleSubmit}
      maxW="400px"
      mx="auto"
      mt={4}
      p={6}
      bg="white"
      borderRadius="md"
      boxShadow="md"
    >
      <Heading size="md" mb={4}>Register</Heading>
      <Stack spacing={3}>
        <FormControl isRequired isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input name="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </FormControl>
        <FormControl isRequired isInvalid={!!errors.password}>
          <FormLabel>Password</FormLabel>
          <Input type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
        </FormControl>
        <FormControl isRequired isInvalid={!!errors.username}>
          <FormLabel>Username</FormLabel>
          <Input name="username" value={form.username} onChange={handleChange} />
        </FormControl>
        <FormControl isRequired isInvalid={!!errors.inviteCode}>
          <FormLabel>Invite Code</FormLabel>
          <Input name="inviteCode" value={form.inviteCode} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Native Language</FormLabel>
          <Input name="native_language" value={form.native_language} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Learning Language</FormLabel>
          <Input name="learning_language" value={form.learning_language} onChange={handleChange} />
        </FormControl>
        {serverError && (
          <Alert status="error">
            <AlertIcon />
            {serverError}
          </Alert>
        )}
        <Button type="submit" colorScheme="blue" isLoading={loading} width="100%">
          Register
        </Button>
      </Stack>
    </Box>
  );
}
