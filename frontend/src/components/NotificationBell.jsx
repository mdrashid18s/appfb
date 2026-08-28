/**
 * @file NotificationBell.jsx
 * @description Real-time Notification Bell Dropdown Component.
 *
 * Features:
 *   1. Live Unread Count Badge on Bell Icon.
 *   2. Auto-polling / Real-time updates with smooth animations.
 *   3. Dropdown Menu with notification items, categories, and direct action links.
 *   4. Mark as Read and Mark All Read actions.
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
  Clock 
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function NotificationBell({ role = 'student', student, onSelectTab }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastFetchedRef = useRef(0);
  const navigate = useNavigate();

  const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';

  const fetchNotifications = async (force = false) => {
    // Prevent duplicate in-flight requests
    if (isFetchingRef.current) return;

    // For student role, wait until rollNo is available
    if (role === 'student' && !rollNo) return;

    // Avoid fetching if document is hidden and not a forced fetch
    if (!force && typeof document !== 'undefined' && document.hidden) return;

    isFetchingRef.current = true;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ role, roll_no: rollNo });
      const res = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        lastFetchedRef.current = Date.now();
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Initial fetch and 60-second background polling
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 60000); // 60 seconds smart polling

    // Refresh when user returns to this browser tab
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastFetchedRef.current > 30000) {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [role, rollNo]);

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
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
        else if (item.type === 'submission' || item.type === 'reportcard') onSelectTab('reportcard');
        else navigate(item.link);
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
      case 'reportcard':
        return <div className={`${styles.iconWrap} ${styles.iconSubmission}`}><Award size={16} /></div>;
      default:
        return <div className={`${styles.iconWrap} ${styles.iconSystem}`}><UserCheck size={16} /></div>;
    }
  };

  return (
    <div className={styles.bellContainer} ref={dropdownRef}>
      {/* Bell Button with Unread Badge */}
      <button 
        className={`${styles.bellBtn} ${unreadCount > 0 ? styles.bellActive : ''}`}
        onClick={() => {
          if (!open) fetchNotifications(true);
          setOpen(!open);
        }}
        title="Notifications"
        type="button"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Popup Modal */}
      {open && (
        <div className={styles.dropdownModal}>
          {/* Dropdown Header */}
          <div className={styles.dropdownHeader}>
            <div className={styles.headerTitle}>
              <Bell size={16} className={styles.headerBellIcon} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className={styles.unreadPill}>{unreadCount} new</span>}
            </div>

            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead} title="Mark all as read" type="button">
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List Body */}
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
