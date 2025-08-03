'use client';

import { useEffect, useState } from 'react';

export default function IndexingInitializer() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeIndexing = async () => {
      try {
        console.log('[Client] Initializing indexing system...');
        
        const response = await fetch('/api/indexing?action=initialize');
        const result = await response.json();
        
        if (response.ok) {
          setStatus('Indexing system ready');
          console.log('[Client] Indexing system initialized:', result);
        } else {
          throw new Error(result.error || 'Failed to initialize');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setStatus('Initialization failed');
        console.error('[Client] Indexing initialization failed:', err);
      }
    };

    initializeIndexing();
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: error ? '#ff6b6b' : '#4ecdc4',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px'
      }}>
        {error ? `❌ ${error}` : `🔍 ${status}`}
      </div>
    );
  }

  return null; // Don't show in production
}
