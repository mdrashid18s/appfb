import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, GraduationCap, User, Edit, Camera, Upload, 
  Trash2, Image as ImageIcon, Contact, Calendar, MapPin, 
  Mail, Phone, Building, Key, Eye, EyeOff, Edit2, X
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import styles from './MyProfile.module.css';

export default function MyProfile({ student, onUpdateStudent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDpMenu, setShowDpMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new_password: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [isViewingDp, setIsViewingDp] = useState(false);
  const [showPasswordValue, setShowPasswordValue] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();

  const [editForm, setEditForm] = useState({
    name: student?.name || '',
    roll_no: student?.['roll no'] || '',
    department: student?.department || '',
    email_adress: student?.['email adress'] || '',
    phone_no: student?.['phone no'] || '',
    dob: student?.['dob'] || '',
    adress: student?.['adress'] || ''
  });

  const fileInputRef = useRef(null);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
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
      if (data.success) {
        onUpdateStudent(data.student);
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
    setShowDpMenu(false);

    if (action === 'upload') {
      setIsUploading(true);
      return;
    }

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
        onUpdateStudent(data.student);
        setIsUploading(false);
        toast.success('Profile picture updated!');
      } else {
        toast.error(data.message || 'DP action failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to backend');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleDpAction('upload_file', e.target.files[0]);
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
      handleDpAction('upload_file', e.dataTransfer.files[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dpUrl = student?.dp ? `/${student.dp}` : null;
  const initial = student?.name ? student.name.trim().charAt(0).toUpperCase() : 'S';

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'block';
  };

  if (!student) return null;

  return (
    <div className={styles['page-wrapper']}>
      <h1 className={styles['page-title']}>My Profile</h1>
      <div className={styles['profile-card']}>
        
        {/* Cover Photo Area with Back Button Overlaid */}
        <div className={styles['cover-photo']}>
          <button className={styles['back-btn-top']} onClick={() => navigate('/student')}>
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>

        {/* Profile Info overlapping cover photo */}
        <div className={styles['header-info-container']}>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: '2rem'}}>
            <div className={styles['avatar-wrapper']}>
              <div 
                className={styles['dp-circle']}
                onClick={() => !isEditing && !isUploading && !isChangingPassword && setShowDpMenu(!showDpMenu)}
              >
                {dpUrl && (
                  <img src={dpUrl} alt="Profile" className={styles['dp-img']} onError={handleImageError} />
                )}
                <span className={styles['dp-initial']} style={{ display: dpUrl ? 'none' : 'block' }}>
                  {initial}
                </span>

                {!isEditing && !isUploading && !isChangingPassword && (
                  <div className={styles['dp-overlay']}>
                    <Camera size={32} />
                  </div>
                )}
              </div>

              {showDpMenu && (
                <div className={styles['dp-dropdown']}>
                  {dpUrl ? (
                    <>
                      <button onClick={() => { setIsViewingDp(true); setShowDpMenu(false); }}>
                        <ImageIcon size={16}/> View Picture
                      </button>
                      <button onClick={() => handleDpAction('upload')}>
                        <Upload size={16}/> Change Picture
                      </button>
                      <button onClick={() => handleDpAction('remove')} className={styles['text-danger']}>
                        <Trash2 size={16}/> Remove Picture
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleDpAction('upload')}>
                      <Upload size={16}/> Upload Picture
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={styles['student-identity']} style={{ paddingBottom: '10px' }}>
              <h1 className={styles['student-name']}>{student.name}</h1>
              <div className={styles['student-badge']}>
                <GraduationCap size={14} /> <span>Student ID:</span> {student.id}
              </div>
            </div>
          </div>

          <div className={styles['header-actions']}>
            {!isEditing && !isUploading && !isChangingPassword && (
              <button className={styles['btn-primary']} onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className={styles['details-section']}>
          
          {isUploading && (
            <div>
              <h2 className={styles['section-title']}>Upload Profile Picture</h2>
              <div 
                className={`${styles['drag-drop-area']} ${isDragging ? styles['dragging'] : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Camera size={48} color="#94a3b8" />
                <h3 style={{margin: '1rem 0 0.5rem', color: '#1e293b'}}>Click to browse or drag and drop image here</h3>
                <p style={{margin: 0, fontSize: '0.85rem', color: '#64748b'}}>JPEG, PNG, JPG up to 5MB</p>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className={styles['hidden']}
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                 <button className={styles['btn-secondary']} onClick={() => setIsUploading(false)}>Cancel Upload</button>
              </div>
            </div>
          )}

          {isChangingPassword && (
            <div className={styles['form-grid']}>
              <div className={`${styles['form-group']} ${styles['full']}`}>
                <label>New Password</label>
                <input 
                  type="password" 
                  className={styles['form-input']}
                  value={passwordForm.new_password} 
                  onChange={(e) => setPasswordForm({ new_password: e.target.value })}
                  placeholder="Enter new password (minimum 4 characters)"
                />
              </div>
              <div className={styles['form-actions']}>
                <button className={styles['btn-secondary']} onClick={() => setIsChangingPassword(false)}>Cancel</button>
                <button className={styles['btn-primary']} onClick={handlePasswordChange}>Save Password</button>
              </div>
            </div>
          )}

          {isEditing && (
            <div className={styles['form-grid']}>
              <div className={styles['form-group']}>
                <label>Name</label>
                <input type="text" className={styles['form-input']} name="name" value={editForm.name} onChange={handleEditChange} />
              </div>
              <div className={styles['form-group']}>
                <label>Roll Number (Auto-assigned)</label>
                <input type="text" className={styles['form-input']} style={{backgroundColor: '#e2e8f0', cursor: 'not-allowed'}} value={editForm.roll_no} readOnly disabled />
              </div>
              <div className={styles['form-group']}>
                <label>Date of Birth</label>
                <DatePicker 
                  selected={editForm.dob ? new Date(editForm.dob) : null} 
                  onChange={date => setEditForm({...editForm, dob: date ? format(date, 'yyyy-MM-dd') : ''})} 
                  dateFormat="dd MMM yyyy"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  className={styles['form-input']}
                />
              </div>
              <div className={styles['form-group']}>
                <label>Department</label>
                <input type="text" className={styles['form-input']} style={{backgroundColor: '#e2e8f0', cursor: 'not-allowed'}} name="department" value={editForm.department} readOnly disabled />
              </div>
              <div className={styles['form-group']}>
                <label>Email (Login ID)</label>
                <input type="email" className={styles['form-input']} style={{backgroundColor: '#e2e8f0', cursor: 'not-allowed'}} value={editForm.email_adress} readOnly disabled />
              </div>
              <div className={styles['form-group']}>
                <label>Phone</label>
                <input type="text" className={styles['form-input']} name="phone_no" value={editForm.phone_no} onChange={handleEditChange} />
              </div>
              <div className={`${styles['form-group']} ${styles['full']}`}>
                <label>Address</label>
                <input type="text" className={styles['form-input']} name="adress" value={editForm.adress} onChange={handleEditChange} />
              </div>
              
              <div className={styles['form-actions']}>
                <button className={styles['btn-secondary']} onClick={() => setIsEditing(false)}>Cancel</button>
                <button className={styles['btn-primary']} onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          )}

          {!isEditing && !isUploading && !isChangingPassword && (
            <>
              <h2 className={styles['section-title']}>Personal Information</h2>
              <div className={styles['info-grid']}>
                
                <div className={styles['info-card']}>
                  <div className={styles['info-card-header']}>
                    <Mail size={16} className={styles['info-icon']}/> Email Address
                  </div>
                  <div className={styles['info-value']}>{student['email adress'] || 'Not Provided'}</div>
                </div>

                <div className={styles['info-card']}>
                  <div className={styles['info-card-header']}>
                    <Phone size={16} className={styles['info-icon']}/> Phone Number
                  </div>
                  <div className={styles['info-value']}>{student['phone no'] || 'Not Provided'}</div>
                </div>

                <div className={styles['info-card']}>
                  <div className={styles['info-card-header']}>
                    <Calendar size={16} className={styles['info-icon']}/> Date of Birth
                  </div>
                  <div className={styles['info-value']}>{formatDate(student['dob'])}</div>
                </div>

                <div className={styles['info-card']}>
                  <div className={styles['info-card-header']}>
                    <Building size={16} className={styles['info-icon']}/> Department
                  </div>
                  <div className={styles['info-value']}>{student.department || 'Not Provided'}</div>
                </div>

                <div className={styles['info-card']}>
                  <div className={styles['info-card-header']}>
                    <MapPin size={16} className={styles['info-icon']}/> Address
                  </div>
                  <div className={styles['info-value']}>{student.adress || 'Not Provided'}</div>
                </div>

                <div className={`${styles['info-card']} ${styles['password-card']}`}>
                  <div className={styles['info-card-header']}>
                    <Key size={16} className={styles['info-icon']}/> Security
                  </div>
                  <div className={styles['info-value']}>
                     <span style={{letterSpacing: showPasswordValue ? 'normal' : '3px'}}>
                       {showPasswordValue ? (student.password || '••••••••') : '••••••••'}
                     </span>
                     <div className={styles['password-actions']}>
                       <button className={styles['icon-btn']} onClick={() => setShowPasswordValue(!showPasswordValue)} title="Show/Hide Password">
                         {showPasswordValue ? <EyeOff size={14} /> : <Eye size={14} />}
                       </button>
                       <button className={styles['icon-btn']} onClick={() => setIsChangingPassword(true)} title="Change Password">
                          <Edit2 size={14} />
                       </button>
                     </div>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>

      {isViewingDp && dpUrl && (
        <div className={styles['dp-lightbox-overlay']} onClick={() => setIsViewingDp(false)}>
          <div className={styles['dp-lightbox-content']} onClick={(e) => e.stopPropagation()}>
            <img src={dpUrl} alt="Full DP" className={styles['dp-lightbox-img']} />
            <button className={styles['dp-lightbox-close']} onClick={() => setIsViewingDp(false)}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
