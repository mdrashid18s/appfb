/**
 * @file NotificationBell.jsx
 * @description Real-time Notification Bell Dropdown component for Student & Admin dashboards.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationBell.module.css';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  ClipboardList, 
  Megaphone, 
  Award, 
  UserCheck, 
  Clock,
  X
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function NotificationBell({ role = 'student', student, onSelectTab }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ role, roll_no: rollNo });
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, [role, rollNo]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, roll_no: rollNo })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id, { stopPropagation: () => {} });
    }
    setOpen(false);

    if (item.link) {
      if (role === 'student' && onSelectTab) {
        if (item.type === 'homework') onSelectTab('homework');
        else if (item.type === 'test') onSelectTab('tests');
        else if (item.type === 'notice') onSelectTab('notices');
      } else {
        navigate(item.link);
      }
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'homework':
        return <div className={`${styles.iconWrap} ${styles.iconHomework}`}><FileText size={16} /></div>;
      case 'test':
        return <div className={`${styles.iconWrap} ${styles.iconTest}`}><ClipboardList size={16} /></div>;
      case 'notice':
        return <div className={`${styles.iconWrap} ${styles.iconNotice}`}><Megaphone size={16} /></div>;
      case 'submission':
        return <div className={`${styles.iconWrap} ${styles.iconSubmission}`}><Award size={16} /></div>;
      default:
        return <div className={`${styles.iconWrap} ${styles.iconSystem}`}><UserCheck size={16} /></div>;
    }
  };

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      <button 
        className={`${styles.bellBtn} ${unreadCount > 0 ? styles.bellActive : ''}`}
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdownModal}>
          <div className={styles.dropdownHeader}>
            <div className={styles.headerTitle}>
              <Bell size={16} className={styles.headerBellIcon} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className={styles.unreadPill}>{unreadCount} new</span>}
            </div>

            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead} title="Mark all as read">
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className={styles.notificationsList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyBox}>
                <Bell size={28} color="#94a3b8" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => {
                let timeAgo = '';
                try {
                  timeAgo = formatDistanceToNow(parseISO(item.created_at), { addSuffix: true });
                } catch {
                  timeAgo = 'Recently';
                }

                return (
                  <div
                    key={item.id}
                    className={`${styles.itemRow} ${!item.is_read ? styles.itemUnread : ''}`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    {renderIcon(item.type)}

                    <div className={styles.itemBody}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        {!item.is_read && <span className={styles.blueDot} />}
                      </div>
                      <p className={styles.itemMessage}>{item.message}</p>
                      <span className={styles.itemTime}>
                        <Clock size={11} /> {timeAgo}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
