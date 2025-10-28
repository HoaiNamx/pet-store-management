import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

function PageHeader({ title, subtitle, actionLabel, onAction, actionIcon }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={actionIcon || <Add />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

export default PageHeader;
