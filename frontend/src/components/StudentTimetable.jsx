/**
 * @file StudentTimetable.jsx
 * @description Student Weekly Class Timetable Component.
 * 
 * Features:
 *   - Modern Table with Stacked Day-by-Day Accordion Rows (Monday to Sunday).
 *   - Click on any day (e.g. Monday) to expand and reveal its class rows with smooth animation.
 *   - Other days remain neatly folded inside until clicked.
 *   - Dual Device Responsive: Touch-friendly on mobile & high-contrast on desktop.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentTimetable.module.css';
import { 
  Clock, 
  BookOpen, 
  User, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  LayoutGrid, 
  Table, 
  ChevronDown, 
  GraduationCap,
  Sun,
  ChevronsUpDown,
  Layers,
  CalendarDays
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 🎨 Daily Theme Palette with gradients, glow effects, and modern contrast tokens
const DAY_COLORS = {
  Monday: { 
    primary: '#4f46e5', 
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', 
    bg: '#eef2ff', 
    border: '#c7d2fe', 
    text: '#3730a3',
    glow: 'rgba(79, 70, 229, 0.22)',
    lightBg: 'rgba(99, 102, 241, 0.05)'
  },
  Tuesday: { 
    primary: '#db2777', 
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #be185d 100%)', 
    bg: '#fdf2f8', 
    border: '#fbcfe8', 
    text: '#9d174d',
    glow: 'rgba(219, 39, 119, 0.22)',
    lightBg: 'rgba(219, 39, 119, 0.05)'
  },
  Wednesday: { 
    primary: '#0284c7', 
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', 
    bg: '#f0f9ff', 
    border: '#bae6fd', 
    text: '#075985',
    glow: 'rgba(2, 132, 199, 0.22)',
    lightBg: 'rgba(2, 132, 199, 0.05)'
  },
  Thursday: { 
    primary: '#d97706', 
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', 
    bg: '#fffbeb', 
    border: '#fde68a', 
    text: '#92400e',
    glow: 'rgba(217, 119, 6, 0.22)',
    lightBg: 'rgba(217, 119, 6, 0.05)'
  },
  Friday: { 
    primary: '#16a34a', 
    gradient: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', 
    bg: '#f0fdf4', 
    border: '#bbf7d0', 
    text: '#166534',
    glow: 'rgba(22, 163, 74, 0.22)',
    lightBg: 'rgba(22, 163, 74, 0.05)'
  },
  Saturday: { 
    primary: '#ea580c', 
    gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', 
    bg: '#fff7ed', 
    border: '#fed7aa', 
    text: '#9a3412',
    glow: 'rgba(234, 88, 12, 0.22)',
    lightBg: 'rgba(234, 88, 12, 0.05)'
  },
  Sunday: { 
    primary: '#9333ea', 
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', 
    bg: '#faf5ff', 
    border: '#e9d5ff', 
    text: '#6b21a8',
    glow: 'rgba(147, 51, 234, 0.22)',
    lightBg: 'rgba(147, 51, 234, 0.05)'
  },
};

function getTodayName() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

function getTeacherInitials(name) {
  if (!name) return 'FC';
  const cleaned = name.replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+/i, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (cleaned.substring(0, 2) || 'FC').toUpperCase();
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const displayHr = hr % 12 || 12;
  return `${displayHr}:${m} ${ampm}`;
}

/**
 * Calculates duration between start and end time (e.g. "1h 30m" or "45m")
 */
function calculateDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin <= 0) return null;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${mins}m`;
}

export default function StudentTimetable({ student }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  const today = getTodayName();
  // Expanded days in table accordion mode: Default today is expanded
  const [expandedDays, setExpandedDays] = useState([DAYS.includes(today) ? today : 'Monday']);

  const deptSearch = student?.['roll no'] || student?.roll_no || student?.course_name || student?.department || student?.course_id || 'Year 5';
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

  /**
   * Day Click Handler: Toggle expand/collapse for that specific day
   */
  const toggleDayAccordion = (day) => {
    setExpandedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  /**
   * Toggle Expand All / Collapse All days
   */
  const toggleAllDays = () => {
    if (expandedDays.length === DAYS.length) {
      setExpandedDays([]);
    } else {
      setExpandedDays([...DAYS]);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Fetching your class schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorCard}>
        <AlertCircle className={styles.errorIcon} size={32} />
        <div>
          <h3 className={styles.errorTitle}>Unable to Display Timetable</h3>
          <p className={styles.errorDesc}>{error}</p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
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
  }

  return (
    <div className={styles.container}>
      {/* ── Top Highlight Banner: Today's Summary ────────────────── */}
      <div className={styles.todayBanner}>
        <div className={styles.bannerHeader}>
          <div className={styles.bannerTitleGroup}>
            <div className={styles.bannerBadgeRow}>
              <span className={styles.livePulse}>
                <span className={styles.pulseDot} />
                TODAY'S SCHEDULE
              </span>
              <span className={styles.bannerDatePill}>
                <CalendarDays size={13} />
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className={styles.headingWrap}>
              <h2 className={styles.dayHeading}>{today}</h2>
              {todaySlots.length > 0 && (
                <span className={styles.todayCountPill}>
                  {todaySlots.length} {todaySlots.length === 1 ? 'Live Lecture' : 'Live Lectures'}
                </span>
              )}
            </div>
          </div>
          <div className={styles.deptBadge}>
            <Layers size={14} className={styles.deptIcon} />
            <span>Dept:</span> <strong>{displayDept}</strong>
          </div>
        </div>

        {todaySlots.length === 0 ? (
          <div className={styles.todayNoClass}>
            <div className={styles.todayNoClassIcon}>
              <CheckCircle2 size={24} color="#16a34a" />
            </div>
            <div>
              <strong>No lectures scheduled for today!</strong>
              <p>You have a free day today. Use this time to revise previous lessons or complete assignments.</p>
            </div>
          </div>
        ) : (
          <div className={styles.todayGrid}>
            {todaySlots.map((slot, index) => {
              const duration = calculateDuration(slot.time_start, slot.time_end);
              return (
                <div 
                  key={slot.id || index} 
                  className={styles.todaySlotCard} 
                  style={{ 
                    '--card-accent': todayColor.primary,
                    '--card-gradient': todayColor.gradient,
                    '--card-bg': todayColor.bg,
                    '--card-border': todayColor.border,
                    '--card-text': todayColor.text,
                    '--card-glow': todayColor.glow,
                    '--card-light-bg': todayColor.lightBg
                  }}
                >
                  {/* Top Header: Time Pill + Duration + Slot Pill */}
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.slotTimeBadge}>
                      <Clock size={13} className={styles.badgeClockIcon} />
                      <span>{formatTime(slot.time_start)} – {formatTime(slot.time_end)}</span>
                    </div>
                    <div className={styles.slotHeaderRight}>
                      {duration && (
                        <span className={styles.durationPill}>
                          {duration}
                        </span>
                      )}
                      <span className={styles.slotOrderBadge}>
                        Slot #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Subject Block with Modern 3D Gradient Icon Box */}
                  <div className={styles.subjectBlock}>
                    <div className={styles.subjectIconBox}>
                      <GraduationCap size={22} className={styles.subjectIconSvg} />
                    </div>
                    <div className={styles.subjectTextWrap}>
                      <div className={styles.subjectCategoryPill}>
                        <span className={styles.categorySparkleDot} />
                        <span>Daily Lecture</span>
                      </div>
                      <h4 className={styles.slotSubjectTitle}>
                        {slot.subject}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom Footer: Teacher Profile + Live Badge */}
                  <div className={styles.cardFooterRow}>
                    {slot.teacher ? (
                      <div className={styles.teacherProfileWrap}>
                        <div className={styles.teacherAvatar} style={{ background: todayColor.gradient }}>
                          {getTeacherInitials(slot.teacher)}
                        </div>
                        <div className={styles.teacherDetails}>
                          <span className={styles.teacherRoleLabel}>Faculty</span>
                          <strong className={styles.teacherNameText}>{slot.teacher}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.unassignedWrap}>
                        <div className={styles.unassignedAvatar}>—</div>
                        <span className={styles.unassignedText}>Faculty: Unassigned</span>
                      </div>
                    )}

                    <div className={styles.statusWrap}>
                      <span className={styles.activeSlotPill}>
                        <span className={styles.liveDot} />
                        Live Today
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Weekly Schedule Section Header with Controls ─────────── */}
      <div className={styles.weeklyHeaderGroup}>
        <div className={styles.titleWithCount}>
          <div className={styles.sparkleIconBox}>
            <Sparkles size={18} color="#4f46e5" />
          </div>
          <h3 className={styles.weeklyTitle}>
            Weekly Class Timetable
          </h3>
          <span className={styles.totalSlotCount}>{slots.length} Classes Scheduled</span>
        </div>

        <div className={styles.headerActionGroup}>
          <button
            type="button"
            className={styles.expandCollapseBtn}
            onClick={toggleAllDays}
            title={expandedDays.length === DAYS.length ? 'Collapse all days' : 'Expand all days'}
          >
            <ChevronsUpDown size={15} />
            <span>{expandedDays.length === DAYS.length ? 'Collapse All' : 'Expand All'}</span>
          </button>

          <div className={styles.viewToggleGroup}>
            <button 
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Accordion Modern Table View"
            >
              <Table size={15} />
              <span>Table</span>
            </button>
            <button 
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Cards Grid View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── View 1: Day-by-Day Accordion Modern Table Layout ──────── */}
      {viewMode === 'table' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>DAY</th>
                  <th style={{ width: '22%' }}>TIME SLOT</th>
                  <th style={{ width: '38%' }}>SUBJECT</th>
                  <th style={{ width: '15%' }}>FACULTY</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const daySlots = slotsByDay[day];
                  const color = DAY_COLORS[day];
                  const isToday = day === today;
                  const isExpanded = expandedDays.includes(day);

                  return (
                    <React.Fragment key={day}>
                      {/* Day Accordion Header Row (Click to toggle) */}
                      <tr 
                        className={`${styles.dayAccordionHeaderRow} ${isExpanded ? styles.dayRowExpanded : ''} ${isToday ? styles.tableTodayRow : ''}`}
                        onClick={() => toggleDayAccordion(day)}
                        title={`Click to ${isExpanded ? 'collapse' : 'expand'} ${day} classes`}
                      >
                        <td colSpan="5" className={styles.dayHeaderTd}>
                          <div className={styles.dayHeaderFlex}>
                            <div className={styles.dayHeaderLeft}>
                              <div className={styles.dayColorBar} style={{ background: color.gradient }} />
                              <strong className={styles.dayNameText} style={{ color: color.primary }}>
                                {day}
                              </strong>
                              {isToday && (
                                <span className={styles.tableTodayBadge}>TODAY</span>
                              )}
                              <span className={styles.dayClassCountPill}>
                                {daySlots.length > 0 ? `${daySlots.length} ${daySlots.length === 1 ? 'Class' : 'Classes'}` : 'No Classes'}
                              </span>
                            </div>

                            <div className={styles.dayHeaderRight}>
                              <span className={styles.toggleHintText}>
                                {isExpanded ? 'Click to collapse' : 'Click to view classes'}
                              </span>
                              <ChevronDown 
                                size={18} 
                                className={`${styles.chevronIcon} ${isExpanded ? styles.chevronRotated : ''}`} 
                                style={{ color: color.primary }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Classes Rows for this Day */}
                      {isExpanded && (
                        daySlots.length === 0 ? (
                          <tr className={styles.noClassRow}>
                            <td className={styles.dayIndentTd}>
                              <span className={styles.dayTagSub} style={{ color: color.primary }}>{day}</span>
                            </td>
                            <td colSpan="4" className={styles.noClassTd}>
                              <CheckCircle2 size={16} color="#16a34a" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                              No lectures scheduled for {day}.
                            </td>
                          </tr>
                        ) : (
                          daySlots.map((slot, index) => (
                            <tr 
                              key={slot.id || index} 
                              className={`${styles.classRowAnimated} ${isToday ? styles.classRowToday : ''}`}
                              style={{ animationDelay: `${index * 0.04}s` }}
                            >
                              {/* Left Indicator with Day & Slot # */}
                              <td className={styles.dayIndentTd}>
                                <div className={styles.slotIndicatorBox}>
                                  <span className={styles.slotDot} style={{ backgroundColor: color.primary }} />
                                  <span className={styles.slotText}>Slot #{index + 1}</span>
                                </div>
                              </td>

                              {/* Time Slot */}
                              <td>
                                <span className={styles.tableTimeBadge} style={{ backgroundColor: color.bg, color: color.text }}>
                                  <Clock size={13} />
                                  {formatTime(slot.time_start)} - {formatTime(slot.time_end)}
                                </span>
                              </td>

                              {/* Subject */}
                              <td>
                                <div className={styles.tableSubjectCell}>
                                  <BookOpen size={16} color={color.primary} className={styles.subIconCell} />
                                  <strong className={styles.subjectText}>{slot.subject}</strong>
                                </div>
                              </td>

                              {/* Faculty */}
                              <td>
                                {slot.teacher ? (
                                  <div className={styles.tableTeacherCell}>
                                    <User size={14} color="#64748b" />
                                    <span>{slot.teacher}</span>
                                  </div>
                                ) : (
                                  <span className={styles.unassigned}>—</span>
                                )}
                              </td>

                              {/* Status */}
                              <td style={{ textAlign: 'center' }}>
                                {isToday ? (
                                  <span className={styles.activeSlotPill}>
                                    <span className={styles.liveDot} />
                                    Active Today
                                  </span>
                                ) : (
                                  <span className={styles.scheduledPill}>
                                    <span className={styles.scheduledDot} />
                                    Scheduled
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── View 2: Day-by-Day Accordion Cards Layout ────────────── */
        <div className={styles.cardsAccordionContainer}>
          {DAYS.map(day => {
            const isToday = day === today;
            const daySlots = slotsByDay[day];
            const color = DAY_COLORS[day];
            const isExpanded = expandedDays.includes(day);

            return (
              <div 
                key={day}
                className={`${styles.dayCardAccordion} ${isExpanded ? styles.dayCardExpanded : ''} ${isToday ? styles.dayCardToday : ''}`}
              >
                {/* Clickable Header for this Day */}
                <div 
                  className={styles.dayCardHeader}
                  onClick={() => toggleDayAccordion(day)}
                  style={{ borderLeftColor: color.primary }}
                >
                  <div className={styles.dayCardHeaderLeft}>
                    <div className={styles.dayColorDot} style={{ backgroundColor: color.primary }} />
                    <strong className={styles.dayCardTitle} style={{ color: color.primary }}>
                      {day}
                    </strong>
                    {isToday && (
                      <span className={styles.tableTodayBadge}>TODAY</span>
                    )}
                    <span className={styles.dayClassCountPill}>
                      {daySlots.length > 0 ? `${daySlots.length} ${daySlots.length === 1 ? 'Class' : 'Classes'}` : 'No Classes'}
                    </span>
                  </div>

                  <div className={styles.dayCardHeaderRight}>
                    <span className={styles.toggleHintText}>
                      {isExpanded ? 'Hide cards' : 'Show cards'}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`${styles.chevronIcon} ${isExpanded ? styles.chevronRotated : ''}`} 
                      style={{ color: color.primary }}
                    />
                  </div>
                </div>

                {/* Expanded Class Cards Grid for this Day */}
                {isExpanded && (
                  <div className={styles.dayCardBody}>
                    {daySlots.length === 0 ? (
                      <div className={styles.emptyDayBox}>
                        <CheckCircle2 size={18} color="#16a34a" />
                        <span>No classes scheduled for {day}.</span>
                      </div>
                    ) : (
                      <div className={styles.daySlotsGrid}>
                        {daySlots.map((slot, index) => {
                          const duration = calculateDuration(slot.time_start, slot.time_end);
                          return (
                            <div 
                              key={slot.id || index} 
                              className={styles.expandedSlotCard}
                              style={{ 
                                '--card-accent': color.primary,
                                '--card-gradient': color.gradient,
                                '--card-bg': color.bg,
                                '--card-border': color.border,
                                '--card-text': color.text,
                                '--card-glow': color.glow,
                                '--card-light-bg': color.lightBg,
                                animationDelay: `${index * 0.04}s`
                              }}
                            >
                              {/* Top Header: Time Badge + Slot Order Badge */}
                              <div className={styles.cardHeaderRow}>
                                <div className={styles.expandedTimeBadge}>
                                  <Clock size={13} className={styles.badgeClockIcon} />
                                  <span>{formatTime(slot.time_start)} – {formatTime(slot.time_end)}</span>
                                </div>
                                <div className={styles.slotHeaderRight}>
                                  {duration && (
                                    <span className={styles.durationPill}>
                                      {duration}
                                    </span>
                                  )}
                                  <span className={styles.slotOrderBadge}>
                                    Slot #{index + 1}
                                  </span>
                                </div>
                              </div>

                              {/* Main Subject Section with Glowing Icon Box */}
                              <div className={styles.subjectBlock}>
                                <div className={styles.subjectIconBox}>
                                  <GraduationCap size={22} className={styles.subjectIconSvg} />
                                </div>
                                <div className={styles.subjectTextWrap}>
                                  <div className={styles.subjectCategoryPill}>
                                    <span className={styles.categorySparkleDot} />
                                    <span>Academic Lecture</span>
                                  </div>
                                  <h4 className={styles.expandedSubjectTitle}>
                                    {slot.subject}
                                  </h4>
                                </div>
                              </div>

                              {/* Card Footer: Teacher Avatar & Live/Scheduled Status */}
                              <div className={styles.cardFooterRow}>
                                {slot.teacher ? (
                                  <div className={styles.teacherProfileWrap}>
                                    <div 
                                      className={styles.teacherAvatar} 
                                      style={{ background: color.gradient }}
                                    >
                                      {getTeacherInitials(slot.teacher)}
                                    </div>
                                    <div className={styles.teacherDetails}>
                                      <span className={styles.teacherRoleLabel}>Faculty</span>
                                      <strong className={styles.teacherNameText}>{slot.teacher}</strong>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={styles.unassignedWrap}>
                                    <div className={styles.unassignedAvatar}>—</div>
                                    <span className={styles.unassignedText}>Faculty: Unassigned</span>
                                  </div>
                                )}

                                <div className={styles.statusWrap}>
                                  {isToday ? (
                                    <span className={styles.activeSlotPill}>
                                      <span className={styles.liveDot} />
                                      Live Today
                                    </span>
                                  ) : (
                                    <span className={styles.scheduledPill}>
                                      <span className={styles.scheduledDot} />
                                      Scheduled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
