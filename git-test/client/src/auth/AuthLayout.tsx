import React from 'react';
import { Container } from '@mui/material';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Container maxWidth="xs" sx={{ marginTop: '20vh', textAlign: 'center' }}>
      {children}
    </Container>
  );
};

export default AuthLayout;

