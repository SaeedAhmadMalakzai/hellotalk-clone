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
      <Heading size="md" mb={4}>Login</Heading>
      <Stack spacing={3}>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={handleInputChange(setEmail)} autoComplete="email" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input type="password" value={password} onChange={handleInputChange(setPassword)} autoComplete="current-password" />
        </FormControl>
        {serverError && (
          <Alert status="error">
            <AlertIcon />
            {serverError}
          </Alert>
        )}
        <Button type="submit" colorScheme="blue" isLoading={loading} width="100%">
          Login
        </Button>
      </Stack>
    </Box>
  );
}
