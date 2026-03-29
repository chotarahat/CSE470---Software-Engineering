import React, { useEffect } from 'react';

export default function KillSwitch() {
  
  const handleKillSwitch = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('https://www.google.com'); 
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleKillSwitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <button 
      onClick={handleKillSwitch} 
      style={{
        backgroundColor: 'var(--red)', 
        color: 'white', 
        border: 'none', 
        padding: '0.4rem 0.75rem', 
        borderRadius: 'var(--radius)',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginRight: '10px'
      }}
      title="Instantly hide this page and clear history"
    >
      Exit Quickly (Esc)
    </button>
  );
}
