import React, { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ color: '#ff4500', fontSize: '24px' }}>Timer: {seconds} seconds</h2>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Pause' : 'Resume'}
      </button>
      <button onClick={() => setSeconds(0)}>Reset</button>
    </div>
  );
}

export default Timer;
