import React from 'react';

function SimpleTest() {
  return (
    <div style={{ 
      padding: '20px', 
      fontSize: '24px', 
      color: 'red',
      backgroundColor: 'yellow' 
    }}>
      <h1>🎉 React is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}

export default SimpleTest;