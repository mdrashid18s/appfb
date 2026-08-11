/**
 * @file StudentTimetable.jsx
 * @description Student department-wise weekly timetable view.
 * Modern, high-contrast, state-of-the-art light theme interface.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentTimetable.module.css';
import { Clock, BookOpen, User, Calendar, Sparkles, AlertCircle, CheckCircle2, LayoutGrid, Table } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_COLORS = {
  Monday:    { primary: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3' },
  Tuesday:   { primary: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d' },
  Wednesday: { primary: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', text: '#075985' },
  Thursday:  { primary: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  Friday:    { primary: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  Saturday:  { primary: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  Sunday:    { primary: '#9333ea', bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
};

function getTodayName() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const displayHr = hr % 12 || 12;
  return `${displayHr}:${m} ${ampm}`;
}

export default function StudentTimetable({ student }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const today = getTodayName();

  const deptSearch = student?.['roll no'] || student?.roll_no || student?.course_name || student?.department || student?.course_id || 'BCA';
  const displayDept = String(student?.department || student?.course_name || student?.course_code || deptSearch).toUpperCase();

  useEffect(() => {
    if (!deptSearch) {
      setLoading(false);
      setError('Your department is not specified in your profile.');
      return;
    }

    fetch(`/api/timetable/${encodeURIComponent(deptSearch)}`, {
      headers: { Accept: 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSlots(data.slots || []);
        else setError('Failed to retrieve timetable from server.');
      })
      .catch(() => setError('Unable to connect to the server.'))
      .finally(() => setLoading(false));
  }, [deptSearch]);

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots
      .filter(s => s.day === day)
      .sort((a, b) => a.time_start.localeCompare(b.time_start));
    return acc;
  }, {});

  const todaySlots = slotsByDay[today] || [];
  const todayColor = DAY_COLORS[today] || DAY_COLORS['Monday'];

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>Fetching your class schedule...</p>
    </div>
  );

  if (error) return (
    <div className={styles.errorCard}>
      <AlertCircle className={styles.errorIcon} size={32} />
      <div>
        <h3 className={styles.errorTitle}>Unable to Display Timetable</h3>
        <p className={styles.errorDesc}>{error}</p>
      </div>
    </div>
  );

  if (slots.length === 0) return (
    <div className={styles.emptyCard}>
      <div className={styles.emptyIconBadge}>
        <Calendar size={36} color="#4f46e5" />
      </div>
      <h3 className={styles.emptyTitle}>
        No Schedule Published Yet for <span className={styles.deptTag}>{displayDept}</span>
      </h3>
      <p className={styles.emptySub}>
        The administrator has not uploaded any timetable slots for your department. Please check back later.
      </p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Top Banner: Today's Highlight */}
      <div className={styles.todayBanner}>
        <div className={styles.bannerHeader}>
          <div className={styles.bannerTitleGroup}>
            <span className={styles.livePulse}>
              <span className={styles.pulseDot} />
              TODAY'S SCHEDULE
            </span>
            <h2 className={styles.dayHeading}>{today}</h2>
          </div>
          <div className={styles.deptBadge}>
            <span>Department:</span> <strong>{displayDept}</strong>
          </div>
        </div>

        {todaySlots.length === 0 ? (
          <div className={styles.todayNoClass}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <strong>No lectures scheduled for today!</strong>
              <p>You have a free day today. Use this time to revise previous lessons or complete assignments.</p>
            </div>
          </div>
        ) : (
          <div className={styles.todayGrid}>
            {todaySlots.map(slot => (
              <div 
                key={slot.id} 
                className={styles.todaySlotCard} 
                style={{ borderLeftColor: todayColor.primary }}
              >
                <div className={styles.slotTimeBadge} style={{ color: todayColor.text, backgroundColor: todayColor.bg }}>
                  <Clock size={14} />
                  <span>{formatTime(slot.time_start)} – {formatTime(slot.time_end)}</span>
                </div>
                <h4 className={styles.slotSubjectTitle}>
                  <BookOpen size={16} className={styles.subIcon} />
                  {slot.subject}
                </h4>
                {slot.teacher && (
                  <div className={styles.slotTeacherInfo}>
                    <User size={14} />
                    <span>Faculty: <strong>{slot.teacher}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule Section Header with View Switcher */}
      <div className={styles.weeklyHeaderGroup}>
        <div className={styles.titleWithCount}>
          <h3 className={styles.weeklyTitle}>
            <Sparkles size={18} color="#4f46e5" />
            Weekly Class Timetable
          </h3>
          <span className={styles.totalSlotCount}>{slots.length} Classes Scheduled</span>
        </div>

        <div className={styles.viewToggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={15} />
            <span>Cards</span>
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('table')}
          >
            <Table size={15} />
            <span>Modern Table</span>
          </button>
        </div>
      </div>

      {/* View 1: Structured Modern Table Layout */}
      {viewMode === 'table' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th>DAY</th>
                  <th>TIME SLOT</th>
                  <th>SUBJECT</th>
                  <th>FACULTY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const daySlots = slotsByDay[day];
                  const color = DAY_COLORS[day];
                  const isToday = day === today;

                  if (daySlots.length === 0) {
                    return (
                      <tr key={day} className={isToday ? styles.tableTodayRow : ''}>
                        <td className={styles.dayTd}>
                          <div className={styles.dayTdBox} style={{ color: color.primary }}>
                            <strong>{day}</strong>
                            {isToday && <span className={styles.tableTodayBadge}>TODAY</span>}
                          </div>
                        </td>
                        <td colSpan="4" className={styles.noClassTd}>No classes scheduled</td>
                      </tr>
                    );
                  }

                  return daySlots.map((slot, index) => (
                    <tr key={slot.id} className={isToday ? styles.tableTodayRow : ''}>
                      {index === 0 && (
                        <td rowSpan={daySlots.length} className={styles.dayTd}>
                          <div className={styles.dayTdBox} style={{ color: color.primary }}>
                            <strong>{day}</strong>
                            {isToday && <span className={styles.tableTodayBadge}>TODAY</span>}
                          </div>
                        </td>
                      )}
                      <td>
                        <span className={styles.tableTimeBadge} style={{ backgroundColor: color.bg, color: color.text }}>
                          <Clock size={13} />
                          {formatTime(slot.time_start)} - {formatTime(slot.time_end)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tableSubjectCell}>
                          <BookOpen size={15} color={color.primary} />
                          <strong>{slot.subject}</strong>
                        </div>
                      </td>
                      <td>
                        {slot.teacher ? (
                          <div className={styles.tableTeacherCell}>
                            <User size={13} color="#64748b" />
                            <span>{slot.teacher}</span>
                          </div>
                        ) : (
                          <span className={styles.unassigned}>—</span>
                        )}
                      </td>
                      <td>
                        {isToday ? (
                          <span className={styles.activeSlotPill}>Active Today</span>
                        ) : (
                          <span className={styles.scheduledPill}>Scheduled</span>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View 2: Clean High-Contrast Cards Grid */
        <div className={styles.gridContainer}>
          {DAYS.map(day => {
            const isToday = day === today;
            const daySlots = slotsByDay[day];
            const color = DAY_COLORS[day];

            return (
              <div
                key={day}
                className={`${styles.dayColumn} ${isToday ? styles.isTodayColumn : ''}`}
              >
                {/* Column Header */}
                <div className={styles.columnHeader} style={{ backgroundColor: color.bg, borderBottomColor: color.border }}>
                  <div className={styles.dayTitleBox}>
                    <span className={styles.dayAbbr} style={{ color: color.primary }}>{day.slice(0, 3).toUpperCase()}</span>
                    <span className={styles.dayFullName}>{day}</span>
                  </div>
                  {isToday ? (
                    <span className={styles.todayBadge}>TODAY</span>
                  ) : (
                    <span className={styles.countBadge}>{daySlots.length}</span>
                  )}
                </div>

                {/* Column Class Slots */}
                <div className={styles.columnBody}>
                  {daySlots.length === 0 ? (
                    <div className={styles.emptyDayBox}>
                      <span>No Classes</span>
                    </div>
                  ) : (
                    daySlots.map(slot => (
                      <div 
                        key={slot.id} 
                        className={styles.miniSlotCard}
                        style={{ borderLeftColor: color.primary }}
                      >
                        <div className={styles.miniTime}>
                          <Clock size={12} color="#475569" />
                          <span>{formatTime(slot.time_start)}</span>
                        </div>
                        <div className={styles.miniSubject}>{slot.subject}</div>
                        {slot.teacher && (
                          <div className={styles.miniTeacher}>
                            <User size={12} color="#64748b" />
                            <span>{slot.teacher}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
