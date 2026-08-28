import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SiteFooter.module.css';

export default function SiteFooter({ showFloatingWa = true }) {
  const navigate = useNavigate();
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(false);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {/* Brand Info */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogoRow} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="XL Education" className={styles.brandLogoImg} />
              <span className={styles.brandName}>XL Education</span>
            </div>
            <p>
              Empowering students to achieve academic excellence through expert tuition, small class sizes, and proven teaching methods across 11+ Grammar, Pre-GCSE, and GCSE exams.
            </p>
            <div className={styles.footerSocials}>
              <a 
                href="https://www.linkedin.com/in/mdrashid/" 
                target="_blank" 
                rel="noreferrer" 
                title="LinkedIn Profile" 
                className={styles.socialIconLi}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/md_rashid_18s" 
                target="_blank" 
                rel="noreferrer" 
                title="Twitter / X Profile" 
                className={styles.socialIconX}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/919771648972?text=Hello%20Md%20Rashid,%20I%20have%20an%20enquiry%20about%20XL%20Education%20courses!" 
                target="_blank" 
                rel="noreferrer" 
                title="WhatsApp Chat" 
                className={styles.socialIconWa}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>
              <a href="#fb" aria-label="Facebook">f</a>
              <a href="#ig" aria-label="Instagram">ig</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.footerCol}>
            <h5>Quick Links</h5>
            <ul>
              <li><button onClick={() => navigate('/')}>Home</button></li>
              <li><button onClick={() => navigate('/register')}>11+ Register</button></li>
              <li><button onClick={() => navigate('/register?course=Free%2011%2B%20Baseline%20Assessment')}>Free Assessment</button></li>
              <li><button onClick={() => navigate('/login')}>Student &amp; Staff Login</button></li>
              <li><a href="#centres">Centres &amp; Tuition</a></li>
              <li><a href="#affiliate">Affiliate Hub</a></li>
            </ul>
          </div>

          {/* Programmes / Courses */}
          <div className={styles.footerCol}>
            <h5>Programmes</h5>
            <ul>
              <li><button onClick={() => navigate('/register?course=Year%203%20%E2%80%93%2011%2B%20Introduction')}>Year 3 Introduction</button></li>
              <li><button onClick={() => navigate('/register?course=Year%204%20%E2%80%93%2011%2B%20Foundation')}>Year 4 Foundation</button></li>
              <li><button onClick={() => navigate('/register?course=Year%205%20%E2%80%93%2011%2B%20Preparation')}>Year 5 11+ Preparation</button></li>
              <li><button onClick={() => navigate('/register?course=Year%207%20%E2%80%93%20Foundation')}>Pre-GCSE (Year 7 - 9)</button></li>
              <li><button onClick={() => navigate('/register?course=Year%2010%20%E2%80%93%20FastForward')}>GCSE Masterclasses</button></li>
              <li><button onClick={() => navigate('/register?course=GCSE%20Combined%20Science')}>Mock Exam Series</button></li>
            </ul>
          </div>

          {/* Contact Details & Direct Action Buttons */}
          <div className={styles.footerCol}>
            <h5>Contact &amp; Support</h5>
            <p>📍 House No 184, Thikatola Adalpur, Darbhanga, Bihar</p>
            <p>📞 9771648972</p>
            <p>✉ mrrashidsaikh0365@gmail.com</p>
            <p>🕒 Mon - Sat: 9:00 AM - 6:00 PM</p>
            <div className={styles.footerDirectButtons}>
              <a 
                href="https://wa.me/919771648972?text=Hello%20Md%20Rashid,%20I%20have%20an%20enquiry%20about%20XL%20Education%20courses!" 
                target="_blank" 
                rel="noreferrer" 
                className={styles.footerWaBtn}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>WhatsApp Chat</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/mdrashid/" 
                target="_blank" 
                rel="noreferrer" 
                className={styles.footerLiBtn}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn Profile</span>
              </a>
              <a 
                href="https://x.com/md_rashid_18s" 
                target="_blank" 
                rel="noreferrer" 
                className={styles.footerXBtn}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Twitter / X Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} XL Education Ltd. All rights reserved.</span>
          <span>Privacy Policy · Terms &amp; Conditions · Opportunities · Cookie Settings</span>
        </div>
      </footer>

      {/* Floating WhatsApp Widget */}
      {showFloatingWa && (
        <div className={styles.floatingWhatsApp}>
          {showWhatsAppTooltip && (
            <div className={styles.waTooltip}>
              <button 
                className={styles.waTooltipClose} 
                onClick={() => setShowWhatsAppTooltip(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className={styles.waTooltipHeader}>
                <span className={styles.waDot}></span>
                <strong>Md Rashid (Director / Support)</strong>
              </div>
              <p>👋 Welcome! Need help with course selection, 11+ prep, or mock exams?</p>
              <div className={styles.waTooltipLinks}>
                <a 
                  href="https://wa.me/919771648972?text=Hello%20Md%20Rashid,%20I%20would%20like%20to%20enquire%20about%20XL%20Education%20courses!" 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.waChatLink}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
                <a 
                  href="https://www.linkedin.com/in/mdrashid/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.waLiLink}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>Connect on LinkedIn</span>
                </a>
                <a 
                  href="https://x.com/md_rashid_18s" 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.waXLink}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Follow on X (Twitter)</span>
                </a>
              </div>
            </div>
          )}
          <button 
            className={styles.waFloatingBtn}
            onClick={() => setShowWhatsAppTooltip(prev => !prev)}
            title="WhatsApp Support"
            aria-label="WhatsApp Support"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
