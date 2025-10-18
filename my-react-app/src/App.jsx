import React from 'react';
import Card from './components/Card';
import Timer from './components/Timer';
import Profile from './components/Profile';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Card />
      <Timer />
      <Profile firstName="Alice" lastName="Smith" age={25} />
      <Profile firstName="Bob" lastName="Johnson" age={30} />
    </div>
  );
}

export default App;
