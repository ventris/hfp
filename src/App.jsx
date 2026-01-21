import { useEffect, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const data = useRef({
    "loaded_at": performance.timeOrigin + performance.now(),
    "user_agent": navigator.userAgent,
    "window_size": [],
  });

  const submitData = () => {
    data.current.clicked_at = performance.timeOrigin + performance.now();
    
    fetch('/api/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data.current),
    })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to report visit', error);
        }
      });

    alert("Identification complete, awaiting decision")
  };

  // Capture window size changes
  useEffect(() => {
    const updateDimensions = () => {
      var width = 0;
      var height = 0;

      if (typeof window !== 'undefined') {
        width = window.innerWidth;
        height = window.innerHeight;
      }

      data.current.window_size.push({
        "ts": performance.timeOrigin + performance.now(),
        "width": width,
        "height": height,
      })
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="fingerprint-container">
      <h2>User identification in progress</h2>
      <button onClick={submitData}>I am human</button>
    </div>
  );
}
