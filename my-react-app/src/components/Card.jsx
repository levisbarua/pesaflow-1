import React from 'react';
import styles from './Card.module.css';
import '../styles/layout.css'; // optional global styles

function Card() {
  return (
    <div className="container">
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>React Styling Magic 🎨</h2>
        <p className={styles.cardText}>
          This card uses both global and modular CSS styles.
        </p>
      </div>
    </div>
  );
}

export default Card;
