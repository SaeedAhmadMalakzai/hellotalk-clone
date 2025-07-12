import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  Textarea,
  Heading,
  Stack,
  Alert,
  AlertIcon,
  Spinner,
  Image
} from '@chakra-ui/react';

export default function CreateMoment({ userId }) {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = e => {
    const file = e.target.files?.[0] || null;
    setMedia(file);
    setServerError('');
    setSuccess(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);
    if (!content.trim() && !media) {
      setServerError('Please enter some text or attach an image.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('content', content);
      if (media) formData.append('media', media);
      await axios.post('http://localhost:5001/api/moments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setContent('');
      setMedia(null);
      setMediaPreview('');
      setSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'Failed to post moment. Please try again.'
      );
    }
    setLoading(false);
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      maxW="500px"
      mx="auto"
      mt={4}
      p={6}
      bg="white"
      borderRadius="md"
      boxShadow="md"
    >
      <Heading size="md" mb={4}>Create Moment</Heading>
      <Stack spacing={3}>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={e => {
            setContent(e.target.value);
            setServerError('');
            setSuccess(false);
          }}
          minH="120px"
        />
        <Input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        {mediaPreview && (
          <Box mt={1}>
            <Image src={mediaPreview} alt="Preview" maxH={200} borderRadius="md" />
          </Box>
        )}
        {serverError && (
          <Alert status="error">
            <AlertIcon />
            {serverError}
          </Alert>
        )}
        {success && (
          <Alert status="success">
            <AlertIcon />Moment posted!
          </Alert>
        )}
        <Button type="submit" colorScheme="blue" isLoading={loading} width="100%">
          Post
        </Button>
      </Stack>
    </Box>
  );
}
