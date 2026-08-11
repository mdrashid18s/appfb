/**
 * @file StudentAnalyticsBanner.jsx
 * @description Performance Analytics Dashboard with Animated Trend Chart & Subject Progress Bars.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentAnalyticsBanner.module.css';
import { Award, Flame, Target, CheckCircle2, Megaphone, TrendingUp, BookOpen, BarChart3, ShieldCheck } from 'lucide-react';

export default function StudentAnalyticsBanner({ student }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (student) {
      const rollNoToUse = student['roll no'] || student.roll_no || student.login_id || student.id;
      fetchAnalytics(rollNoToUse);
    }
  }, [student]);

  const fetchAnalytics = async (rollNo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${rollNo}/analytics`, {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load student analytics', err);
    }
    setLoading(false);
  };

  if (loading) return null;

  const scoreHistory = analytics?.score_history || [];
  const subjectBreakdown = analytics?.subject_breakdown || [];

  return (
    <div className={styles.container}>
      {/* Live Noticeboard Ticker */}
      {analytics && analytics.notices && analytics.notices.length > 0 && (
        <div className={styles.noticeTicker}>
          <div className={styles.tickerTag}>
            <Megaphone size={14} />
            <span>ANNOUNCEMENTS</span>
          </div>
          <div className={styles.tickerContent}>
            <span className={styles.noticeTitle}>{analytics.notices[0].title}:</span>
            <span className={styles.noticeBody}>{analytics.notices[0].content}</span>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className={styles.bannerGrid}>
        {/* Main Rank Card */}
        <div className={styles.rankCard}>
          <div className={styles.rankBadgeBox}>
            <Award size={28} color="#ffffff" />
          </div>
          <div className={styles.rankInfo}>
            <span className={styles.rankLabel}>YOUR BATCH RANK</span>
            <h2 className={styles.rankValue}>
              Rank #{analytics?.rank || 1} <span className={styles.peerText}>/ {analytics?.total_peers || 454} Students</span>
            </h2>
            <p className={styles.rankSub}>Department of {analytics?.department || 'Computer Applications'}</p>
          </div>
        </div>

        {/* Metric 1: Average Score */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconWrap} ${styles.blueWrap}`}>
            <Target size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricVal}>{analytics?.average_percentage || 85}%</span>
            <span className={styles.metricLbl}>Average Score</span>
          </div>
        </div>

        {/* Metric 2: Tests Completed */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconWrap} ${styles.greenWrap}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricVal}>{analytics?.total_completed || 0}</span>
            <span className={styles.metricLbl}>Completed Tests</span>
          </div>
        </div>

        {/* Metric 3: Streak Tracker */}
        <div className={styles.metricCard}>
          <div className={`${styles.iconWrap} ${styles.orangeWrap}`}>
            <Flame size={20} />
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricVal}>{analytics?.streak || 1} 🔥</span>
            <span className={styles.metricLbl}>Active Streak</span>
          </div>
        </div>
      </div>

      {/* Visual Performance Charts Section */}
      <div className={styles.chartsRow}>
        {/* 📈 Score Trend Bar & Line Graph */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleBox}>
              <TrendingUp size={18} color="#f97316" />
              <h3>Exam Performance Trend Line</h3>
            </div>
            <span className={styles.chartTag}>Last {scoreHistory.length} Exams</span>
          </div>

          <div className={styles.barGraphArea}>
            {scoreHistory.map((item, idx) => (
              <div 
                key={idx} 
                className={styles.barColumn}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className={styles.barValueTooltip}>
                  {item.percentage}%
                </div>
                <div className={styles.barTrack}>
                  <div 
                    className={styles.barFill} 
                    style={{ height: `${item.percentage}%` }} 
                  />
                </div>
                <span className={styles.barLabel}>{item.date || `T${idx+1}`}</span>
              </div>
            ))}
          </div>

          {/* Batch Comparison Legend */}
          <div className={styles.comparisonStrip}>
            <div className={styles.cmpItem}>
              <span className={styles.cmpDot} style={{ background: '#f97316' }} />
              <span>Your Avg: <strong>{analytics?.average_percentage}%</strong></span>
            </div>
            <div className={styles.cmpItem}>
              <span className={styles.cmpDot} style={{ background: '#94a3b8' }} />
              <span>Batch Avg: <strong>{analytics?.batch_average || 68.4}%</strong></span>
            </div>
            <div className={styles.cmpItem}>
              <span className={styles.cmpDot} style={{ background: '#10b981' }} />
              <span>Top Score: <strong>{analytics?.top_score || 98.0}%</strong></span>
            </div>
          </div>
        </div>

        {/* 📊 Subject Mastery Skill Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleBox}>
              <BookOpen size={18} color="#2563eb" />
              <h3>Subject Skill Mastery</h3>
            </div>
            <span className={styles.chartTag}>4 Subjects</span>
          </div>

          <div className={styles.skillsList}>
            {subjectBreakdown.map((sb, idx) => (
              <div key={idx} className={styles.skillRow}>
                <div className={styles.skillMeta}>
                  <span className={styles.skillName}>{sb.subject}</span>
                  <span className={styles.skillGradeBadge}>{sb.grade} • {sb.mastery}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div 
                    className={styles.progressFill} 
                    style={{ 
                      width: `${sb.mastery}%`,
                      background: idx % 2 === 0 ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
