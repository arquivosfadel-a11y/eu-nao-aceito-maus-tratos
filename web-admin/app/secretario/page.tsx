'use client';

import { useEffect } from 'react';

export default function SecretarioPage() {
  useEffect(() => {
    window.location.href = '/protetor';
  }, []);
  return null;
}
