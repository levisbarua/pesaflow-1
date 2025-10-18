import React from 'react';

// ✅ Greeting Component: Receives props and displays a message
function Greeting(props) {
  return (
    <div>
      <h1>Hello, {props.name}! 👋</h1>
      <p>Welcome to our React deep-dive session. 🎉</p>
    </div>
  );
}

export default Greeting;
