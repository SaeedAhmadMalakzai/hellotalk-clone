import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Text,
  Input,
  Alert,
  AlertIcon,
  Stack,
  Spinner
} from '@chakra-ui/react';

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
      maxW="400px"
      mx="auto"
      mt={4}
      p={6}
      bg="white"
      borderRadius="md"
      boxShadow="md"
    >
      <Stack spacing={3}>
        <Button colorScheme="blue" onClick={generateInvite} isLoading={loading} width="100%">
          Generate Invite Code
        </Button>
        {invite && <Input value={invite} isReadOnly />}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Text fontSize="sm" color="gray.500">Only admins can generate invite codes.</Text>
      </Stack>
    </Box>
  );
}
