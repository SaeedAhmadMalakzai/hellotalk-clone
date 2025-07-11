import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, CircularProgress, Alert, Stack, Input
} from '@mui/material';

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
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 500,
        mx: 'auto',
        mt: 4,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h6" gutterBottom>Create Moment</Typography>
      <Stack spacing={2}>
        <TextField
          label="What's on your mind?"
          value={content}
          onChange={e => {
            setContent(e.target.value);
            setServerError('');
            setSuccess(false);
          }}
          multiline
          minRows={3}
          fullWidth
        />
        <Input
          type="file"
          inputProps={{ accept: 'image/*,video/*' }}
          onChange={handleFileChange}
          fullWidth
        />
        {mediaPreview && (
          <Box mt={1}>
            <img
              src={mediaPreview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
            />
          </Box>
        )}
        {serverError && <Alert severity="error">{serverError}</Alert>}
        {success && <Alert severity="success">Moment posted!</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Post'}
        </Button>
      </Stack>
    </Box>
  );
}
