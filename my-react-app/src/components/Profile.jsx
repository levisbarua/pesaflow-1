import React from 'react';
import './Profile.css';

function Profile({ firstName, lastName, age }) {
  return (
    <div className="profileCard">
      <h3>{firstName} {lastName}</h3>
      <p>Age: {age}</p>
    </div>
  );
}

export default Profile;
