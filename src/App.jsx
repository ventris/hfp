import { useEffect, useRef } from 'react';
import './App.css';

const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

export default function App() {
  const data = useRef({
    "loaded_at": performance.timeOrigin + performance.now(),
    "user_agent": navigator.userAgent,
    "window_size": [],
    "clicks": [],
    "mouseMoves": [],
    "scrolls": [],
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

  useEffect(() => {
    const handleMouseMove = throttle((e) => {
      data.current.mouseMoves.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: performance.timeOrigin + performance.now(),
      });
    }, 100);

    const handleClick = (e) => {
      data.current.clicks.push({
        x: e.clientX,
        y: e.clientY,
        target: e.target.tagName,
        timestamp: performance.timeOrigin + performance.now(),
      });
    };

    const handleScroll = throttle(() => {
      data.current.scrolls.push({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        timestamp: performance.timeOrigin + performance.now(),
      });
    }, 100);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="fingerprint-container">
      <h2>User identification in progress</h2>
      <button onClick={submitData}>I am human</button>
    </div>
  );
}
