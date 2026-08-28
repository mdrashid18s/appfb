import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import sadBoy404 from '../assets/sad_boy_404.png';
import SiteFooter from '../components/SiteFooter';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className={styles['not-found-container']} style={{ flex: 1 }}>
        <button 
          className={styles['go-back-btn']} 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} /> Go to Home
        </button>

        <div className={styles['content-wrapper']}>
          <img 
            src={sadBoy404} 
            alt="Sad boy holding a red question mark pole" 
            className={styles['not-found-image']} 
          />
          <h1 className={styles['not-found-title']}>Page Not Found</h1>
          <h2 className={styles['not-found-subtitle']}>404 Error !</h2>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
