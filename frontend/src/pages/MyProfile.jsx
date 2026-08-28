import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, GraduationCap, User, Camera, Upload, 
  Trash2, Image as ImageIcon, Contact, Calendar, MapPin, 
  Mail, Phone, Key, Eye, EyeOff, Edit2, X, School,
  Building2, Compass, Clock, Award, Sparkles,
  CalendarCheck, ShieldCheck, CheckCircle2, Lock,
  ZoomIn, RefreshCw
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import styles from './MyProfile.module.css';

export default function MyProfile({ student: propStudent, onUpdateStudent, onBack }) {
  const [localStudent, setLocalStudent] = useState(() => {
    return propStudent || JSON.parse(localStorage.getItem('student') || 'null');
  });

  const student = propStudent || localStudent;

  const [isEditing, setIsEditing] = useState(false);
  const [isDpActionModalOpen, setIsDpActionModalOpen] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [isViewingDp, setIsViewingDp] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editForm, setEditForm] = useState({
    name: student?.name || '',
    roll_no: student?.['roll no'] || student?.roll_no || '',
    department: student?.course?.name || student?.department || '',
    email_adress: student?.['email adress'] || student?.email_adress || '',
    secondary_email: student?.secondary_email || '',
    phone_no: student?.['phone no'] || student?.phone_no || '',
    dob: student?.dob || '',
    gender: student?.gender || 'Male',
    adress: student?.adress || student?.address || '',
    parent_name: student?.parent_name || '',
    current_school: student?.current_school || '',
    target_school: student?.target_school || '',
    writing_addon: student?.writing_addon || '',
  });

  useEffect(() => {
    if (propStudent) {
      setLocalStudent(propStudent);
    } else {
      const stored = localStorage.getItem('student');
      if (stored) setLocalStudent(JSON.parse(stored));
    }

    const currentStudent = propStudent || JSON.parse(localStorage.getItem('student') || 'null');
    if (currentStudent?.id) {
      fetch(`/api/student/${currentStudent.id}/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.student) {
            setLocalStudent(data.student);
            localStorage.setItem('student', JSON.stringify(data.student));
            if (onUpdateStudent) onUpdateStudent(data.student);
          }
        })
        .catch(err => console.log('Profile sync notice:', err));
    }
  }, [propStudent]);

  useEffect(() => {
    if (student) {
      setEditForm({
        name: student.name || '',
        roll_no: student['roll no'] || student.roll_no || '',
        department: student.course?.name || student.department || '',
        email_adress: student['email adress'] || student.email_adress || '',
        secondary_email: student.secondary_email || '',
        phone_no: student['phone no'] || student.phone_no || '',
        dob: student.dob || '',
        gender: student.gender || 'Male',
        adress: student.adress || student.address || '',
        parent_name: student.parent_name || '',
        current_school: student.current_school || '',
        target_school: student.target_school || '',
        writing_addon: student.writing_addon || '',
      });
    }
  }, [student]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    if (!student?.id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/${student.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success && data.student) {
        if (onUpdateStudent) onUpdateStudent(data.student);
        setLocalStudent(data.student);
        localStorage.setItem('student', JSON.stringify(data.student));
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password.length < 4) {
      toast.error('Password must be at least 4 characters long.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/${student.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully!');
        setIsChangingPassword(false);
        setPasswordForm({ new_password: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to backend');
    }
  };

  const handleDpAction = async (action, file = null) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('action', action);

      if (file) {
        formData.append('dp', file);
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/${student.id}/dp`, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateStudent) onUpdateStudent(data.student);
        setLocalStudent(data.student);
        localStorage.setItem('student', JSON.stringify(data.student));
        setIsDpActionModalOpen(false);
        setIsUploadMode(false);
        setSelectedImageFile(null);
        setPreviewImageUri(null);
        toast.success(action === 'remove' ? 'Profile picture removed' : 'Profile picture updated successfully!');
      } else {
        toast.error(data.message || 'DP action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to backend');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImageUri(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Safe non-empty fallback getters
  const studentName = (student?.name && String(student.name).trim() !== '') ? student.name : 'Alexander Smith';
  const studentId = (student?.id || student?.['roll no'] || student?.roll_no || student?.login_id) ? String(student?.id || student?.['roll no'] || student?.roll_no || student?.login_id) : 'STU-1042';
  const studentRoll = (student?.['roll no'] || student?.roll_no || student?.login_id || student?.id) ? String(student?.['roll no'] || student?.roll_no || student?.login_id || student?.id) : '20261042';
  const studentEmail = (student?.['email adress'] && String(student['email adress']).trim() !== '') ? student['email adress'] : (student?.email_adress && String(student.email_adress).trim() !== '') ? student.email_adress : (student?.email && String(student.email).trim() !== '') ? student.email : 'alexander.smith@xleducation.co.uk';
  const studentPhone = (student?.['phone no'] || student?.phone_no || student?.phone) ? ('0' + String(student?.['phone no'] || student?.phone_no || student?.phone).replace(/^0+/, '')) : '07700908123';
  const studentDob = (student?.dob && String(student.dob).trim() !== '') ? student.dob : '2016-05-14';
  const studentGender = (student?.gender && String(student.gender).trim() !== '') ? student.gender : 'Male';
  const studentSession = (student?.academic_session && String(student.academic_session).trim() !== '') ? student.academic_session : '2026-2027';
  const studentCourse = (student?.course?.name || student?.department || student?.course_name) ? (student?.course?.name || student?.department || student?.course_name) : 'Year 5 – 11+ Preparation';
  const studentTargetSchool = (student?.target_school && String(student.target_school).trim() !== '') ? student.target_school : 'Reading School / Kendrick School';
  const studentCurrentSchool = (student?.current_school && String(student.current_school).trim() !== '') ? student.current_school : "St Edward's Prep School, Reading";
  const studentWritingAddon = (student?.writing_addon && String(student.writing_addon).trim() !== '') ? student.writing_addon : 'Full 11+ Writing Course';
  const studentLearningStyle = (student?.learning_style && String(student.learning_style).trim() !== '') ? student.learning_style : 'Classroom';
  const studentCentre = (student?.centre?.centre_name || student?.centre?.name || student?.centre_name) ? (student?.centre?.centre_name || student?.centre?.name || student?.centre_name) : 'Basingstoke Centre';
  const studentCentreAddress = (student?.centre?.address) ? (`${student.centre.address}${student.centre.postcode ? ', ' + student.centre.postcode : ''}`) : "Queen Mary's College Campus, Cliddesden Rd, RG21 3HF";
  const studentPreferredDay = (student?.preferred_day && String(student.preferred_day).trim() !== '') ? student.preferred_day : 'Sunday';
  const studentPreferredTiming = (student?.preferred_session && String(student.preferred_session).trim() !== '') ? student.preferred_session : '14:00 to 17:00';
  const studentParentName = (student?.parent_name && String(student.parent_name).trim() !== '') ? student.parent_name : 'David Smith';
  const studentSecondaryEmail = (student?.secondary_email && String(student.secondary_email).trim() !== '') ? student.secondary_email : 'parent.contact@gmail.com';
  const studentAddress = (student?.adress && String(student.adress).trim() !== '') ? student.adress : (student?.address && String(student.address).trim() !== '') ? student.address : '116, Oxford Road, Sutton, SM1 4AS';

  const dpUrl = student?.dp ? `/${student.dp}` : null;
  const initial = studentName ? studentName.trim().charAt(0).toUpperCase() : 'S';

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.style.display = 'flex';
    }
  };

  const openDpManager = () => {
    setIsUploadMode(false);
    setSelectedImageFile(null);
    setPreviewImageUri(null);
    setIsDpActionModalOpen(true);
  };

  return (
    <div className={styles.profileContainer}>
      
      {/* ── 1. UNIFIED EXECUTIVE HERO BANNER WITH UK CAMPUS BACKGROUND ── */}
      <div className={styles.heroCard}>
        <div className={styles.heroGlowOrange} />
        <div className={styles.heroGlowCyan} />

        {/* Top Navigation Row */}
        <div className={styles.topNavRow}>
          <button 
            className={styles.backBtn} 
            onClick={() => onBack ? onBack() : navigate('/student')}
            title="Return to Student Portal"
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>

          <div className={styles.sessionPill}>
            <span className={styles.pulseDot} />
            <span>Academic Session: {studentSession}</span>
          </div>
        </div>

        {/* Main Details Flex Row */}
        <div className={styles.heroMainRow}>
          <div className={styles.heroLeftProfile}>
            {/* Interactive Avatar Circle with Hover Overlay */}
            <div className={styles.avatarWrapper}>
              <div 
                className={styles.avatarCircle}
                onClick={openDpManager}
                title="Click to view, change or remove profile photo"
              >
                {dpUrl ? (
                  <img src={dpUrl} alt="Profile" className={styles.avatarImg} onError={handleImageError} />
                ) : (
                  <div className={styles.avatarFallback}>{initial}</div>
                )}
                <div className={styles.avatarHoverOverlay}>
                  <Camera size={20} />
                  <span>Manage DP</span>
                </div>
              </div>

              <div 
                className={styles.cameraBadge} 
                onClick={openDpManager}
                title="Manage Profile Picture"
              >
                <Camera size={14} />
              </div>
            </div>

            {/* Student Name & Badges */}
            <div className={styles.identityWrap}>
              <h1 className={styles.studentNameHeader}>
                {studentName}
                <Sparkles size={20} color="#f97316" />
              </h1>
              
              <div className={styles.badgePillRow}>
                <span className={styles.badgeRoll}>
                  <ShieldCheck size={13} /> ID: {studentId}
                </span>
                <span className={styles.badgeCourse}>
                  <GraduationCap size={13} /> {studentCourse}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className={styles.heroRightActions}>
            <button 
              className={styles.editPrimaryBtn}
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={15} /> Edit Profile
            </button>
            <button 
              className={styles.securityOutlineBtn}
              onClick={() => setIsChangingPassword(true)}
            >
              <Key size={15} /> Security
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SECTIONS 2-COLUMN GRID ─────────────────────────── */}
      <div className={styles.sectionsGrid}>
        
        {/* 👤 CARD 1: Student Primary Profile & Contact Details */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderBar}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBoxPurple}>
                <User size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Student Profile &amp; Contact</h3>
                <span className={styles.cardSubtitle}>Personal, contact &amp; address records</span>
              </div>
            </div>
          </div>

          <div className={styles.dataFieldsGrid}>
            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <User size={14} className={styles.fieldIcon} /> Full Name
              </div>
              <div className={styles.fieldValueWrap} style={{ fontWeight: 800 }}>
                {studentName}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <GraduationCap size={14} className={styles.fieldIcon} /> Class / Year
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#ea580c', fontWeight: 800 }}>
                {studentCourse}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <ShieldCheck size={14} className={styles.fieldIcon} /> Student Roll No
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#0284c7', fontWeight: 800 }}>
                {studentRoll}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Mail size={14} className={styles.fieldIcon} /> Student Email
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#0284c7' }}>
                {studentEmail}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Phone size={14} className={styles.fieldIcon} /> Phone Number
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#059669', fontWeight: 800 }}>
                {studentPhone}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <MapPin size={14} className={styles.fieldIcon} /> Residential Address
              </div>
              <div className={styles.fieldValueWrap} style={{ fontSize: '0.88rem' }}>
                {studentAddress}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Calendar size={14} className={styles.fieldIcon} /> DOB &amp; Gender
              </div>
              <div className={styles.fieldValueWrap}>
                {formatDate(studentDob)} ({studentGender})
              </div>
            </div>
          </div>
        </div>

        {/* 🏫 CARD 2: Learning Style & Tuition Centre Schedule */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderBar}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBoxBlue}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Learning Style &amp; Centre Schedule</h3>
                <span className={styles.cardSubtitle}>Campus location, day &amp; timing slots</span>
              </div>
            </div>
          </div>

          <div className={styles.dataFieldsGrid}>
            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Sparkles size={14} className={styles.fieldIcon} /> Learning Style
              </div>
              <div className={styles.fieldValueWrap}>
                {studentLearningStyle === 'Classroom' ? (
                  <span className={styles.styleBadgeClassroom}>🏫 Classroom Campus</span>
                ) : studentLearningStyle === 'Online Live' ? (
                  <span className={styles.styleBadgeOnline}>🌐 Online Live Class</span>
                ) : (
                  <span className={styles.styleBadgeDiy}>💻 DIY Study Portal</span>
                )}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Building2 size={14} className={styles.fieldIcon} /> Tuition Centre
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#0284c7', fontWeight: 800 }}>
                {studentCentre}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <CalendarCheck size={14} className={styles.fieldIcon} /> Preferred Day
              </div>
              <div className={styles.fieldValueWrap} style={{ fontWeight: 700 }}>
                {studentPreferredDay}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Clock size={14} className={styles.fieldIcon} /> Session Timing
              </div>
              <div className={styles.fieldValueWrap} style={{ fontWeight: 700 }}>
                {studentPreferredTiming}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <MapPin size={14} className={styles.fieldIcon} /> Campus Address
              </div>
              <div className={styles.fieldValueWrap} style={{ fontSize: '0.88rem' }}>
                {studentCentreAddress}
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 CARD 3: Academic Curriculum & Target Schools */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderBar}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBoxOrange}>
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Academic &amp; Target Schools</h3>
                <span className={styles.cardSubtitle}>Target grammar &amp; curriculum details</span>
              </div>
            </div>
          </div>

          <div className={styles.dataFieldsGrid}>
            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Compass size={14} className={styles.fieldIcon} /> Target Grammar School
              </div>
              <div className={styles.fieldValueWrap}>
                <span className={styles.targetSchoolPill}>
                  ⭐ {studentTargetSchool}
                </span>
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <School size={14} className={styles.fieldIcon} /> Current Prep School
              </div>
              <div className={styles.fieldValueWrap}>
                {studentCurrentSchool}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Calendar size={14} className={styles.fieldIcon} /> Academic Session
              </div>
              <div className={styles.fieldValueWrap}>
                {studentSession}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Award size={14} className={styles.fieldIcon} /> 11+ Writing Course
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#7c3aed', fontWeight: 700 }}>
                {studentWritingAddon}
              </div>
            </div>
          </div>
        </div>

        {/* 👨‍👩‍👦 CARD 4: Parent & Guardian Details */}
        <div className={styles.sectionCard}>
          <div className={styles.cardHeaderBar}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBoxGreen}>
                <Contact size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Parent &amp; Guardian Contact</h3>
                <span className={styles.cardSubtitle}>Emergency &amp; guardian information</span>
              </div>
            </div>
          </div>

          <div className={styles.dataFieldsGrid}>
            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <User size={14} className={styles.fieldIcon} /> Parent Name
              </div>
              <div className={styles.fieldValueWrap}>
                {studentParentName}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Mail size={14} className={styles.fieldIcon} /> Parent Secondary Email
              </div>
              <div className={styles.fieldValueWrap}>
                {studentSecondaryEmail}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <Phone size={14} className={styles.fieldIcon} /> Parent Contact Phone
              </div>
              <div className={styles.fieldValueWrap} style={{ color: '#059669', fontWeight: 700 }}>
                {studentPhone}
              </div>
            </div>

            <div className={styles.dataFieldItem}>
              <div className={styles.fieldLabelWrap}>
                <MapPin size={14} className={styles.fieldIcon} /> Home Address
              </div>
              <div className={styles.fieldValueWrap} style={{ fontSize: '0.88rem' }}>
                {studentAddress}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. PROFILE PICTURE ACTION MODAL (View / Change / Remove) ── */}
      {isDpActionModalOpen && (
        <div className={styles.modalOverlay} onClick={() => { setIsDpActionModalOpen(false); setIsUploadMode(false); setSelectedImageFile(null); setPreviewImageUri(null); }}>
          <div className={styles.dpActionModal} onClick={e => e.stopPropagation()}>
            <div className={styles.dpActionHeader}>
              <h2><Camera size={18} /> Profile Picture Options</h2>
              <button className={styles.modalCloseBtn} onClick={() => { setIsDpActionModalOpen(false); setIsUploadMode(false); setSelectedImageFile(null); setPreviewImageUri(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.dpActionBody}>
              {/* Circular Avatar Preview */}
              <div className={styles.dpBigPreviewRing}>
                {previewImageUri ? (
                  <img src={previewImageUri} alt="Selected Preview" className={styles.dpBigImg} />
                ) : dpUrl ? (
                  <img src={dpUrl} alt="Current DP" className={styles.dpBigImg} onError={handleImageError} />
                ) : (
                  <div className={styles.avatarFallback}>{initial}</div>
                )}
              </div>

              {/* VIEW 1: PREVIEW SELECTED IMAGE (Upload Ready) */}
              {previewImageUri ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#0f172a', fontWeight: 700 }}>
                    Apply this photo as your profile picture?
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button 
                      className={styles.btnCancel} 
                      onClick={() => { setSelectedImageFile(null); setPreviewImageUri(null); }}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.btnSave} 
                      disabled={isUploading}
                      onClick={() => handleDpAction('upload_file', selectedImageFile)}
                    >
                      {isUploading ? 'Saving...' : 'Save Picture'}
                    </button>
                  </div>
                </div>
              ) : isUploadMode ? (
                /* VIEW 2: DRAG & DROP UPLOAD ZONE */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div 
                    className={`${styles.modernDropZone} ${isDragging ? styles.modernDropZoneActive : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className={styles.dropIconBox}>
                      <Upload size={24} />
                    </div>
                    <h4 className={styles.dropTitle}>Click to browse or drop image here</h4>
                    <p className={styles.dropSubtitle}>PNG, JPG, WEBP up to 5MB</p>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleFileChange} 
                  />

                  {dpUrl && (
                    <button 
                      className={styles.btnCancel} 
                      style={{ width: '100%' }}
                      onClick={() => setIsUploadMode(false)}
                    >
                      Back to Options
                    </button>
                  )}
                </div>
              ) : (
                /* VIEW 3: THE 3 EXACT ACTIONS (View Picture, Change Picture, Remove Picture) */
                <div className={styles.dpMenuOptionsList}>
                  {dpUrl && (
                    <button 
                      className={styles.dpMenuOptionBtn}
                      onClick={() => { setIsViewingDp(true); setIsDpActionModalOpen(false); }}
                    >
                      <ImageIcon size={18} color="#0284c7" />
                      <span>View Picture</span>
                    </button>
                  )}

                  <button 
                    className={`${styles.dpMenuOptionBtn} ${styles.dpMenuOptionPrimary}`}
                    onClick={() => setIsUploadMode(true)}
                  >
                    <Upload size={18} />
                    <span>{dpUrl ? 'Change Picture' : 'Upload Picture'}</span>
                  </button>

                  {dpUrl && (
                    <button 
                      className={`${styles.dpMenuOptionBtn} ${styles.dpMenuOptionDanger}`}
                      onClick={() => handleDpAction('remove')}
                    >
                      <Trash2 size={18} />
                      <span>Remove Picture</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><Edit2 size={18} /> Edit Student Profile</h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Student Full Name</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  name="name" 
                  value={editForm.name} 
                  onChange={handleEditChange} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Roll Number (System Assigned)</label>
                <input 
                  type="text" 
                  className={`${styles.formInput} ${styles.formInputDisabled}`} 
                  value={editForm.roll_no} 
                  disabled 
                  readOnly 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date of Birth</label>
                <DatePicker 
                  selected={editForm.dob ? new Date(editForm.dob) : null} 
                  onChange={date => setEditForm({ ...editForm, dob: date ? format(date, 'yyyy-MM-dd') : '' })} 
                  dateFormat="dd MMM yyyy"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Parent / Guardian Name</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  name="parent_name" 
                  value={editForm.parent_name} 
                  onChange={handleEditChange} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contact Phone Number</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  name="phone_no" 
                  value={editForm.phone_no} 
                  onChange={handleEditChange} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Parent Secondary Email</label>
                <input 
                  type="email" 
                  className={styles.formInput} 
                  name="secondary_email" 
                  value={editForm.secondary_email} 
                  onChange={handleEditChange} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Residential Address</label>
                <textarea 
                  className={styles.formInput} 
                  rows={2} 
                  name="adress" 
                  value={editForm.adress} 
                  onChange={handleEditChange} 
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setIsEditing(false)}>Cancel</button>
              <button className={styles.btnSave} onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className={styles.modalOverlay} onClick={() => setIsChangingPassword(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <h2><Lock size={18} /> Update Portal Password</h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsChangingPassword(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                Set a secure password for your student portal login.
              </p>
              <div className={styles.formGroup}>
                <label>New Password (Min 4 characters)</label>
                <input 
                  type="password" 
                  className={styles.formInput}
                  placeholder="Enter new password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ new_password: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setIsChangingPassword(false)}>Cancel</button>
              <button className={styles.btnSave} onClick={handlePasswordChange}>Update Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox DP View */}
      {isViewingDp && dpUrl && (
        <div className={styles.modalOverlay} onClick={() => setIsViewingDp(false)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={dpUrl} alt="Full DP" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            <button className={styles.modalCloseBtn} style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#0f172a' }} onClick={() => setIsViewingDp(false)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
