import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

function ErrorAlert({ error, onClose }) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'Đã xảy ra lỗi';

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error" onClose={onClose}>
        <AlertTitle>Lỗi</AlertTitle>
        {errorMessage}
      </Alert>
    </Box>
  );
}

export default ErrorAlert;
