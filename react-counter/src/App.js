import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedCount = localStorage.getItem('counter');
    if (savedCount) {
      setCount(parseInt(savedCount));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('counter', count.toString());
  }, [count]);

  const increment = () => {
    setCount(prev => prev + 1);
    addToHistory('increment');
  };

  const decrement = () => {
    setCount(prev => prev - 1);
    addToHistory('decrement');
  };

  const reset = () => {
    setCount(0);
    addToHistory('reset');
  };

  const addToHistory = (action) => {
    const timestamp = new Date().toLocaleTimeString();
    setHistory(prev => [...prev.slice(-4), { action, timestamp, value: count }]);
  };

  return (
    <div className="App">
      <div className="counter-container">
        <h1>React Counter</h1>
        <div className="counter-display">
          <span className="count">{count}</span>
        </div>
        <div className="button-group">
          <button onClick={decrement} className="btn btn-danger">
            -
          </button>
          <button onClick={reset} className="btn btn-secondary">
            Reset
          </button>
          <button onClick={increment} className="btn btn-success">
            +
          </button>
        </div>
        
        {history.length > 0 && (
          <div className="history">
            <h3>Recent Actions</h3>
            <ul>
              {history.map((item, index) => (
                <li key={index}>
                  {item.action} at {item.timestamp} (was {item.value})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;