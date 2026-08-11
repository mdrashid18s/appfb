/**
 * @file TimetableEditor.jsx
 * @description Admin panel department/course-wise timetable editor component.
 * Features strict relational database models, master dropdown selection,
 * department-based filtering for subjects & faculty, clear empty states ("No teachers/subjects for this department"),
 * inline adding, inline master editing for subjects, faculty, and courses, and weekly schedule grid management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TimetableEditor.module.css';
import { Plus, X, Edit2, Trash2, Clock, BookOpen, User, ChevronDown, Settings, Check, GraduationCap, AlertCircle, Search, Printer, AlertTriangle, Calendar, ShieldAlert, Award, FlaskConical, FileText, Star } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_SHORT = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
};

const DAY_COLORS = {
  Monday:    { bg: 'rgba(249,115,22,0.18)',  border: '#f97316', text: '#ea580c' },
  Tuesday:   { bg: 'rgba(236,72,153,0.18)',  border: '#ec4899', text: '#ec4899' },
  Wednesday: { bg: 'rgba(14,165,233,0.18)',  border: '#0ea5e9', text: '#0ea5e9' },
  Thursday:  { bg: 'rgba(245,158,11,0.18)',  border: '#f59e0b', text: '#f59e0b' },
  Friday:    { bg: 'rgba(34,197,94,0.18)',   border: '#22c55e', text: '#22c55e' },
  Saturday:  { bg: 'rgba(239,68,68,0.18)',   border: '#ef4444', text: '#ef4444' },
  Sunday:    { bg: 'rgba(168,85,247,0.18)',  border: '#a855f7', text: '#a855f7' },
};

function CustomFacultyPicker({
  selectedTeacherId,
  selectedTeacherName,
  onSelect,
  teachersList,
  currentCourse,
  currentSubjectId,
  placeholder = "-- Select Faculty --"
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTeacher = teachersList.find(t => 
    (selectedTeacherId && String(t.id) === String(selectedTeacherId)) ||
    (selectedTeacherName && t.name === selectedTeacherName)
  );

  // Filtering logic:
  // 1. If subject already has mapped teachers in DB → show only those mapped teachers
  // 2. If no DB mapping for subject → show all teachers (same course recommended at TOP, other courses below)
  const hasSubjectMapping = currentSubjectId && teachersList.some(t => t.assigned_subjects?.some(sub => String(sub.id) === String(currentSubjectId)));

  const baseTeachers = (currentSubjectId && hasSubjectMapping)
    ? teachersList.filter(t => t.assigned_subjects?.some(sub => String(sub.id) === String(currentSubjectId)))
    : teachersList;

  const filteredTeachers = baseTeachers.filter(t => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const nameMatch = t.name.toLowerCase().includes(s);
    const courseMatch = (t.course_code || t.course_name || '').toLowerCase().includes(s);
    return nameMatch || courseMatch;
  });

  const checkDeptMatch = (cCode, cName, deptFilter) => {
    if (!deptFilter || deptFilter === 'ALL') return true;
    if (!cCode && !cName) return true;
    const f = deptFilter.trim().toUpperCase();
    if (cCode && cCode.trim().toUpperCase() === f) return true;
    if (cName && cName.trim().toUpperCase() === f) return true;
    return false;
  };

  const sameCourseTeachers = filteredTeachers.filter(t => checkDeptMatch(t.course_code, t.course_name, currentCourse));
  const otherCourseTeachers = filteredTeachers.filter(t => !checkDeptMatch(t.course_code, t.course_name, currentCourse));

  return (
    <div className={styles.customPickerWrapper} ref={dropdownRef}>
      <div 
        className={`${styles.customPickerTrigger} ${open ? styles.triggerActive : ''}`}
        onClick={() => setOpen(!open)}
      >
        {selectedTeacher ? (
          <div className={styles.triggerSelectedValue}>
            <span className={styles.teacherAvatarBadge}>{selectedTeacher.name.slice(0, 2).toUpperCase()}</span>
            <span className={styles.teacherNameText}>{selectedTeacher.name}</span>
            <span className={styles.triggerCourseTag}>{selectedTeacher.course_code || selectedTeacher.course_name || 'General'}</span>
          </div>
        ) : (
          <span className={styles.triggerPlaceholder}>{placeholder}</span>
        )}
        <ChevronDown size={16} className={`${styles.triggerIcon} ${open ? styles.rotateIcon : ''}`} />
      </div>

      {open && (
        <div className={styles.customPickerMenu}>
          <div className={styles.pickerSearchWrap} onClick={e => e.stopPropagation()}>
            <Search size={14} className={styles.pickerSearchIcon} />
            <input 
              type="text"
              placeholder="Search faculty or course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.pickerSearchInput}
              autoFocus
            />
            {search && <X size={14} className={styles.pickerClearIcon} onClick={() => setSearch('')} />}
          </div>

          <div className={styles.pickerListContainer}>
            <div 
              className={styles.noneOptionItem}
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              🚫 (None / Clear Faculty)
            </div>

            {sameCourseTeachers.length > 0 && (
              <div className={styles.pickerGroup}>
                <div className={styles.pickerGroupHeaderRecommended}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span>⭐ Recommended ({currentCourse !== 'ALL' ? currentCourse : 'Matched'} Faculty)</span>
                  <span className={styles.groupCountBadge}>{sameCourseTeachers.length}</span>
                </div>
                {sameCourseTeachers.map(t => {
                  const isSelected = selectedTeacher && String(selectedTeacher.id) === String(t.id);
                  const teachesSub = currentSubjectId && t.assigned_subjects?.some(sub => String(sub.id) === String(currentSubjectId));
                  return (
                    <div 
                      key={t.id}
                      className={`${styles.pickerOptionCard} ${styles.recommendedCard} ${isSelected ? styles.cardSelected : ''}`}
                      onClick={() => { onSelect(t); setOpen(false); }}
                    >
                      <div className={styles.cardAvatarRecommended}>
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.cardInfo}>
                        <div className={styles.cardNameRow}>
                          <span className={styles.cardName}>{t.name}</span>
                          <span className={styles.coursePillRecommended}>{t.course_code || t.course_name || currentCourse}</span>
                        </div>
                        {teachesSub && (
                          <span className={styles.teachesSubBadge}>✓ Teaches this subject</span>
                        )}
                      </div>
                      {isSelected && <Check size={16} className={styles.selectedCheckIcon} />}
                    </div>
                  );
                })}
              </div>
            )}

            {otherCourseTeachers.length > 0 && (
              <div className={styles.pickerGroup}>
                <div className={styles.pickerGroupHeaderStandard}>
                  <GraduationCap size={13} color="#64748b" />
                  <span>Other Department Faculty</span>
                  <span className={styles.groupCountBadgeSlate}>{otherCourseTeachers.length}</span>
                </div>
                {otherCourseTeachers.map(t => {
                  const isSelected = selectedTeacher && String(selectedTeacher.id) === String(t.id);
                  const teachesSub = currentSubjectId && t.assigned_subjects?.some(sub => String(sub.id) === String(currentSubjectId));
                  return (
                    <div 
                      key={t.id}
                      className={`${styles.pickerOptionCard} ${isSelected ? styles.cardSelected : ''}`}
                      onClick={() => { onSelect(t); setOpen(false); }}
                    >
                      <div className={styles.cardAvatarStandard}>
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.cardInfo}>
                        <div className={styles.cardNameRow}>
                          <span className={styles.cardName}>{t.name}</span>
                          <span className={styles.coursePillStandard}>{t.course_code || t.course_name || 'Other'}</span>
                        </div>
                        {teachesSub && (
                          <span className={styles.teachesSubBadge}>✓ Teaches this subject</span>
                        )}
                      </div>
                      {isSelected && <Check size={16} className={styles.selectedCheckIcon} />}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredTeachers.length === 0 && (
              <div className={styles.noPickerResults}>
                No faculty matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  id: null,
  course_id: '',
  department: '',
  day: 'Monday',
  time_start: '09:00',
  time_end: '10:00',
  subject_id: '',
  subject: '',
  teacher_id: '',
  teacher: '',
};

export default function TimetableEditor({ onOpenFaculty }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [coursesList, setCoursesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [slots, setSlots] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(false);

  // All Timetable Slots for Conflict Alert & Faculty Unified View
  const [allSlots, setAllSlots] = useState([]);

  // Faculty Schedule View Mode State
  const [facultyViewActive, setFacultyViewActive] = useState(false);
  const [selectedFacultyViewId, setSelectedFacultyViewId] = useState('');

  // Subject Type & Teacher Designation State
  const [newSubjectType, setNewSubjectType] = useState('theory');
  const [editSubjectType, setEditSubjectType] = useState('theory');
  const [newTeacherDesignation, setNewTeacherDesignation] = useState('Assistant Professor');
  const [editTeacherDesignation, setEditTeacherDesignation] = useState('Assistant Professor');

  // Modal State for Slot Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  // Inline Add New Subject / Teacher State in Form
  const [showAddSubjectInput, setShowAddSubjectInput] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  const [showAddTeacherInput, setShowAddTeacherInput] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);

  // Master Management Drawer Modal State
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageDeptFilter, setManageDeptFilter] = useState('ALL');

  // Faculty List Modal State
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('ALL');
  const [facultySearch, setFacultySearch] = useState('');

  // Editing items inside Master Management Modal
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');

  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editTeacherName, setEditTeacherName] = useState('');

  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [newCourseInput, setNewCourseInput] = useState('');

  // Master lists quick add inputs
  const [newMasterSubjectInput, setNewMasterSubjectInput] = useState('');
  const [newMasterTeacherInput, setNewMasterTeacherInput] = useState('');

  // Subject Assignment to Teacher State
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [selectedTeacherSubjectIds, setSelectedTeacherSubjectIds] = useState([]);
  const [savingTeacherSubjects, setSavingTeacherSubjects] = useState(false);

  const openAssignSubjectsModal = (teacher) => {
    setAssigningTeacher(teacher);
    const existingIds = (teacher.assigned_subjects || []).map(s => s.id);
    setSelectedTeacherSubjectIds(existingIds);
  };

  const toggleTeacherSubjectId = (subjectId) => {
    if (selectedTeacherSubjectIds.includes(subjectId)) {
      setSelectedTeacherSubjectIds(selectedTeacherSubjectIds.filter(id => id !== subjectId));
    } else {
      setSelectedTeacherSubjectIds([...selectedTeacherSubjectIds, subjectId]);
    }
  };

  const handleSaveTeacherSubjects = async () => {
    if (!assigningTeacher) return;
    setSavingTeacherSubjects(true);
    try {
      const res = await fetch('/api/admin/teachers/assign-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          teacher_id: assigningTeacher.id,
          subject_ids: selectedTeacherSubjectIds
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated subject mapping for ${assigningTeacher.name}`);
        setAssigningTeacher(null);
        fetchTeachers();
      } else {
        toast.error(data.message || 'Failed to save subject mapping');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving subject mapping');
    }
    setSavingTeacherSubjects(false);
  };

  // Subject-Centric Faculty Assignment State
  const [activeAssignSubjectId, setActiveAssignSubjectId] = useState(null);
  const [selectedTeacherIdToAssign, setSelectedTeacherIdToAssign] = useState('');
  const [customTeacherNameToAssign, setCustomTeacherNameToAssign] = useState('');
  const [assigningFacultyLoading, setAssigningFacultyLoading] = useState(false);

  const handleAssignTeacherToSubject = async (subjectId) => {
    if (!selectedTeacherIdToAssign && !customTeacherNameToAssign.trim()) {
      toast.error('Please select an existing teacher or type a new teacher name.');
      return;
    }

    setAssigningFacultyLoading(true);
    try {
      const res = await fetch('/api/admin/subjects/assign-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          subject_id: subjectId,
          teacher_id: selectedTeacherIdToAssign || null,
          teacher_name: customTeacherNameToAssign.trim() || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Faculty assigned to subject');
        setActiveAssignSubjectId(null);
        setSelectedTeacherIdToAssign('');
        setCustomTeacherNameToAssign('');
        fetchSubjects();
        fetchTeachers();
      } else {
        toast.error(data.message || 'Could not assign faculty');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
    setAssigningFacultyLoading(false);
  };

  const handleUnassignTeacherFromSubject = async (subjectId, teacherId) => {
    try {
      const res = await fetch('/api/admin/subjects/unassign-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ subject_id: subjectId, teacher_id: teacherId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Faculty unassigned');
        fetchSubjects();
        fetchTeachers();
      }
    } catch (err) {
      console.error(err);
    }
  };




  // Fetch Courses & Departments
  const fetchCourses = useCallback(() => {
    fetch('/api/admin/courses', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.courses) {
          setCoursesList(data.courses);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const fetchDepartments = useCallback(() => {
    fetch('/api/admin/departments', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDepartments(data.departments);
          if (data.departments.length > 0 && !selectedDept) setSelectedDept(data.departments[0]);
        }
      })
      .catch(() => toast.error('Could not load departments list'));
  }, [selectedDept]);

  // Fetch Master Subjects
  const fetchSubjects = useCallback(() => {
    fetch('/api/admin/subjects', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSubjectsList(data.subjects || []);
      })
      .catch(() => console.error('Could not load subjects list'));
  }, []);

  // Fetch Master Teachers
  const fetchTeachers = useCallback(() => {
    fetch('/api/admin/teachers', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setTeachersList(data.teachers || []);
      })
      .catch(() => console.error('Could not load teachers list'));
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchSubjects();
    fetchTeachers();
  }, [fetchCourses, fetchDepartments, fetchSubjects, fetchTeachers]);

  // Fetch slots when selected department changes
  const fetchSlots = useCallback(() => {
    if (!selectedDept) return;
    setLoading(true);
    fetch(`/api/timetable/${encodeURIComponent(selectedDept)}`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSlots(data.slots || []);
      })
      .catch(() => toast.error('Could not load timetable for selected department'))
      .finally(() => setLoading(false));
  }, [selectedDept]);

  // Trigger slot fetch whenever selected department changes
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Fetch All Slots across all courses for Realtime Conflict Detection
  const fetchAllSlots = useCallback(() => {
    fetch('/api/admin/timetable', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setAllSlots(data.slots || []);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchAllSlots();
  }, [fetchAllSlots, slots]);

  // Realtime Conflict Detection Helper
  const getTeacherConflict = (teacherId, day, timeStart, timeEnd, currentSlotId) => {
    if (!teacherId || !day || !timeStart || !timeEnd) return null;

    const teachObj = teachersList.find(t => String(t.id) === String(teacherId));
    const teacherName = teachObj ? teachObj.name : 'Selected Faculty';

    const conflict = allSlots.find(s => {
      if (currentSlotId && String(s.id) === String(currentSlotId)) return false;
      if (String(s.teacher_id) !== String(teacherId)) return false;
      if (s.day.toUpperCase() !== day.toUpperCase()) return false;

      // Time overlap check: startA < endB && endA > startB
      return (timeStart < s.time_end) && (timeEnd > s.time_start);
    });

    if (conflict) {
      return {
        teacherName,
        subjectName: conflict.subject_name || conflict.subject || 'another subject',
        department: conflict.course_code || conflict.course_name || conflict.department || 'another department',
        day: conflict.day,
        timeStart: conflict.time_start,
        timeEnd: conflict.time_end
      };
    }

    return null;
  };

  // Helper to count teacher daily load
  const getTeacherDailyLoad = (teacherId, day) => {
    if (!teacherId || !day) return 0;
    return allSlots.filter(s => 
      String(s.teacher_id) === String(teacherId) && 
      s.day.toUpperCase() === day.toUpperCase()
    ).length;
  };

  const handlePrintTimetable = () => {
    window.print();
  };

  // Helper to check if item belongs to department (by code or name)
  const isDeptMatch = (courseCode, courseName, deptFilter) => {

    if (!deptFilter || deptFilter === 'ALL') return true;
    if (!courseCode && !courseName) return true;
    const f = deptFilter.trim().toUpperCase();
    if (courseCode && courseCode.trim().toUpperCase() === f) return true;
    if (courseName && courseName.trim().toUpperCase() === f) return true;
    return false;
  };

  // Filter subjects for current form department
  const filteredFormSubjects = subjectsList.filter(s => 
    isDeptMatch(s.course_code, s.course_name, form.department)
  );

  // Filter and prioritize teachers for current form department slot creation
  const getGroupedFormTeachers = () => {
    const currentDept = form.department;
    const currentSubId = form.subject_id;

    const sameDeptTeachers = [];
    const qualifiedOtherDeptTeachers = [];
    const otherDeptTeachers = [];

    teachersList.forEach(t => {
      const isSameDept = isDeptMatch(t.course_code, t.course_name, currentDept);
      const teachesSubject = currentSubId && t.assigned_subjects?.some(s => String(s.id) === String(currentSubId));

      if (isSameDept) {
        sameDeptTeachers.push({ ...t, isSameDept: true, teachesSubject });
      } else if (teachesSubject) {
        qualifiedOtherDeptTeachers.push({ ...t, isSameDept: false, teachesSubject: true });
      } else {
        otherDeptTeachers.push({ ...t, isSameDept: false, teachesSubject: false });
      }
    });

    return { sameDeptTeachers, qualifiedOtherDeptTeachers, otherDeptTeachers };
  };

  const filteredFormTeachers = teachersList.filter(t => {
    const deptMatch = isDeptMatch(t.course_code, t.course_name, form.department);
    if (deptMatch) return true;
    if (form.subject_id && t.assigned_subjects) {
      return t.assigned_subjects.some(sub => String(sub.id) === String(form.subject_id));
    }
    return false;
  });

  // Search filter query inside Master Lists Modal
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  // Filter subjects for Master Management Modal
  const filteredManageSubjects = subjectsList.filter(s => {
    const deptOk = isDeptMatch(s.course_code, s.course_name, manageDeptFilter);
    if (!deptOk) return false;
    if (!masterSearchQuery) return true;
    return s.name.toLowerCase().includes(masterSearchQuery.toLowerCase());
  });

  // Filter teachers for Master Management Modal
  const filteredManageTeachers = teachersList.filter(t => {
    const deptOk = isDeptMatch(t.course_code, t.course_name, manageDeptFilter);
    if (!deptOk) return false;
    if (!masterSearchQuery) return true;
    const nameMatch = t.name.toLowerCase().includes(masterSearchQuery.toLowerCase());
    const subMatch = t.assigned_subjects?.some(sub => sub.name.toLowerCase().includes(masterSearchQuery.toLowerCase()));
    return nameMatch || subMatch;
  });


  const openAdd = () => {
    const defaultSubObj = filteredFormSubjects.length > 0 ? filteredFormSubjects[0] : null;
    const defaultTeachObj = filteredFormTeachers.length > 0 ? filteredFormTeachers[0] : null;
    const currentCourseObj = coursesList.find(c => c.name.toUpperCase() === selectedDept.toUpperCase());

    setForm({ 
      ...EMPTY_FORM, 
      department: selectedDept, 
      course_id: currentCourseObj ? currentCourseObj.id : '',
      subject_id: defaultSubObj ? defaultSubObj.id : '',
      subject: defaultSubObj ? defaultSubObj.name : '', 
      teacher_id: defaultTeachObj ? defaultTeachObj.id : '',
      teacher: defaultTeachObj ? defaultTeachObj.name : '' 
    });
    setShowAddSubjectInput(false);
    setShowAddTeacherInput(false);
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setForm({
      id: slot.id,
      course_id: slot.course_id || '',
      department: slot.department,
      day: slot.day,
      time_start: slot.time_start,
      time_end: slot.time_end,
      subject_id: slot.subject_id || '',
      subject: slot.subject,
      teacher_id: slot.teacher_id || '',
      teacher: slot.teacher || '',
    });
    setShowAddSubjectInput(false);
    setShowAddTeacherInput(false);
    setShowModal(true);
  };

  // Add New Subject inline from Slot Modal
  const handleAddNewSubjectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newSubjectName.trim()) { toast.error('Please enter a subject name'); return; }
    setAddingSubject(true);
    try {
      const currentCourseObj = coursesList.find(c => c.name.toUpperCase() === form.department.toUpperCase());
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          name: newSubjectName.trim(), 
          department: form.department,
          course_id: currentCourseObj ? currentCourseObj.id : null 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Subject "${data.subject.name}" added to ${form.department}!`);
        await fetchSubjects();
        setForm(prev => ({ ...prev, subject_id: data.subject.id, subject: data.subject.name }));
        setNewSubjectName('');
        setShowAddSubjectInput(false);
      } else {
        toast.error(data.message || 'Subject name already exists');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add new subject');
    } finally {
      setAddingSubject(false);
    }
  };

  // Add New Faculty inline from Slot Modal
  const handleAddNewTeacherSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newTeacherName.trim()) { toast.error('Please enter a faculty name'); return; }
    setAddingTeacher(true);
    try {
      const currentCourseObj = coursesList.find(c => c.name.toUpperCase() === form.department.toUpperCase());
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          name: newTeacherName.trim(),
          department: form.department,
          course_id: currentCourseObj ? currentCourseObj.id : null
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Faculty "${data.teacher.name}" added to ${form.department}!`);
        await fetchTeachers();
        setForm(prev => ({ ...prev, teacher_id: data.teacher.id, teacher: data.teacher.name }));
        setNewTeacherName('');
        setShowAddTeacherInput(false);
      } else {
        toast.error(data.message || 'Teacher name already exists');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add new faculty');
    } finally {
      setAddingTeacher(false);
    }
  };

  // Save Subject Edit Name (Spelling Fix)
  const handleSaveEditedSubject = async (id) => {
    if (!editSubjectName.trim()) { toast.error('Subject name cannot be empty'); return; }
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: editSubjectName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subject name updated cleanly across all slots!');
        setEditingSubjectId(null);
        fetchSubjects();
        fetchSlots();
      } else {
        toast.error(data.message || 'Failed to update subject name');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating subject name');
    }
  };

  // Save Teacher Edit Name (Spelling Fix)
  const handleSaveEditedTeacher = async (id) => {
    if (!editTeacherName.trim()) { toast.error('Faculty name cannot be empty'); return; }
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: editTeacherName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Faculty name updated cleanly across all slots!');
        setEditingTeacherId(null);
        fetchTeachers();
        fetchSlots();
      } else {
        toast.error(data.message || 'Failed to update faculty name');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating faculty name');
    }
  };

  // Add & Save Course in Master Lists Modal
  const handleAddCourse = async () => {
    if (!newCourseInput.trim()) { toast.error('Please enter course name (e.g. BBA)'); return; }
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: newCourseInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Course "${data.course.name}" created successfully!`);
        setNewCourseInput('');
        fetchCourses();
        fetchDepartments();
      } else {
        toast.error(data.message || 'Course name already exists');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating course');
    }
  };

  // Add Subject directly inside Master Lists Modal
  const handleAddMasterSubject = async () => {
    if (!newMasterSubjectInput.trim()) { toast.error('Please enter a subject name'); return; }
    try {
      const targetDept = manageDeptFilter !== 'ALL' ? manageDeptFilter : null;
      const targetCourseObj = targetDept ? coursesList.find(c => c.name.toUpperCase() === targetDept.toUpperCase()) : null;
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          name: newMasterSubjectInput.trim(),
          department: targetDept,
          course_id: targetCourseObj ? targetCourseObj.id : null
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Subject "${data.subject.name}" added to ${targetDept || 'master list'}!`);
        setNewMasterSubjectInput('');
        fetchSubjects();
      } else {
        toast.error(data.message || 'Subject name already exists');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding subject');
    }
  };

  // Add Teacher directly inside Master Lists Modal
  const handleAddMasterTeacher = async () => {
    if (!newMasterTeacherInput.trim()) { toast.error('Please enter a faculty name'); return; }
    try {
      const targetDept = manageDeptFilter !== 'ALL' ? manageDeptFilter : null;
      const targetCourseObj = targetDept ? coursesList.find(c => c.name.toUpperCase() === targetDept.toUpperCase()) : null;
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          name: newMasterTeacherInput.trim(),
          department: targetDept,
          course_id: targetCourseObj ? targetCourseObj.id : null
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Faculty "${data.teacher.name}" added to ${targetDept || 'master list'}!`);
        setNewMasterTeacherInput('');
        fetchTeachers();
      } else {
        toast.error(data.message || 'Teacher name already exists');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding faculty');
    }
  };


  const handleSaveEditedCourse = async (id) => {
    if (!editCourseName.trim()) { toast.error('Course name cannot be empty'); return; }
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: editCourseName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Course name updated!');
        setEditingCourseId(null);
        fetchCourses();
        fetchDepartments();
        fetchSlots();
      } else {
        toast.error(data.message || 'Failed to update course');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating course');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject from master list?')) return;
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success) {
        toast.success('Subject deleted');
        fetchSubjects();
      }
    } catch {
      toast.error('Could not delete subject');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Delete this faculty member from master list?')) return;
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success) {
        toast.success('Faculty deleted');
        fetchTeachers();
      }
    } catch {
      toast.error('Could not delete faculty');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Delete this course? All associated slots will be removed.')) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success) {
        toast.success('Course deleted');
        fetchCourses();
        fetchDepartments();
      }
    } catch {
      toast.error('Could not delete course');
    }
  };

  // Save Slot Handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.subject && !form.subject_id) { toast.error('Please select or add a subject name'); return; }
    if (form.time_start >= form.time_end) { toast.error('End time must be after start time'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(form.id ? 'Slot updated successfully!' : 'New slot added successfully!');
        setShowModal(false);
        fetchSlots();
      } else {
        toast.error(data.message || 'An error occurred while saving the slot');
      }
    } catch {
      toast.error('Unable to connect to the server');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class slot?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/timetable/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Class slot deleted successfully');
        setSlots(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error(data.message || 'Could not delete class slot');
      }
    } catch {
      toast.error('Unable to delete class slot');
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day);
    return acc;
  }, {});

  const totalSlots = slots.length;

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>📅</div>
          <div>
            <h2 className={styles.headerTitle}>Timetable Manager</h2>
            <p className={styles.headerSub}>Manage course-wise weekly class schedule & faculty workload</p>
          </div>
        </div>

        <div className={styles.headerBtnGroup}>
          <button className={styles.addBtn} onClick={openAdd}>
            <Plus size={18} />
            <span>Add Slot</span>
          </button>
        </div>
      </div>


      {/* Course / Department Bar */}
      <div className={styles.deptBar}>
        <div className={styles.deptScroll}>
          {departments.map(dept => (
            <button
              key={dept}
              className={`${styles.deptChip} ${selectedDept === dept ? styles.deptChipActive : ''}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
          {departments.length === 0 && (
            <span className={styles.noDept}>No courses found — add a course in Master Lists Manager</span>
          )}
        </div>
        {totalSlots > 0 && (
          <span className={styles.slotCount}>{totalSlots} slots assigned</span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <span>Loading timetable...</span>
        </div>
      )}

      {/* Weekly Grid */}
      {!loading && selectedDept && (
        <div className={styles.grid}>
          {DAYS.map(day => {
            const color = DAY_COLORS[day];
            const daySlots = slotsByDay[day];
            return (
              <div
                key={day}
                className={styles.dayCol}
                style={{ '--day-bg': color.bg, '--day-border': color.border }}
              >
                <div className={styles.dayHeader} style={{ borderColor: color.border }}>
                  <span className={styles.dayName} style={{ color: color.text }}>{DAY_SHORT[day]}</span>
                  <span className={styles.dayFull}>{day}</span>
                  <span className={styles.dayCount}>{daySlots.length}</span>
                </div>

                <div className={styles.daySlots}>
                  {daySlots.length === 0 ? (
                    <div className={styles.emptyDay}>
                      <span>No classes</span>
                    </div>
                  ) : (
                    daySlots
                      .sort((a, b) => a.time_start.localeCompare(b.time_start))
                      .map(slot => (
                        <div key={slot.id} className={styles.slotCard} style={{ borderLeft: `3px solid ${color.border}` }}>
                          <div className={styles.slotTime}>
                            <Clock size={12} />
                            <span>{slot.time_start.slice(0,5)} – {slot.time_end.slice(0,5)}</span>
                          </div>
                          <div className={styles.slotSubject}>
                            <BookOpen size={13} />
                            <span>{slot.subject}</span>
                          </div>
                          {slot.teacher && (
                            <div className={styles.slotTeacher}>
                              <User size={12} />
                              <span>{slot.teacher}</span>
                            </div>
                          )}
                          <div className={styles.slotActions}>
                            <button className={styles.editBtn} onClick={() => openEdit(slot)} title="Edit Slot">
                              <Edit2 size={13} />
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(slot.id)}
                              disabled={deletingId === slot.id}
                              title="Delete Slot"
                            >
                              {deletingId === slot.id ? <div className={styles.microSpin} /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        </div>
                      ))
                  )}

                  {/* Quick Add Slot */}
                  <button
                    className={styles.quickAdd}
                    onClick={() => { 
                      const defaultSubObj = filteredFormSubjects.length > 0 ? filteredFormSubjects[0] : null;
                      const defaultTeachObj = filteredFormTeachers.length > 0 ? filteredFormTeachers[0] : null;
                      const currentCourseObj = coursesList.find(c => c.name.toUpperCase() === selectedDept.toUpperCase());
                      setForm({ 
                        ...EMPTY_FORM, 
                        department: selectedDept, 
                        course_id: currentCourseObj ? currentCourseObj.id : '',
                        day, 
                        subject_id: defaultSubObj ? defaultSubObj.id : '',
                        subject: defaultSubObj ? defaultSubObj.name : '', 
                        teacher_id: defaultTeachObj ? defaultTeachObj.id : '',
                        teacher: defaultTeachObj ? defaultTeachObj.name : '' 
                      });
                      setShowAddSubjectInput(false);
                      setShowAddTeacherInput(false);
                      setShowModal(true); 
                    }}
                    style={{ '--day-border': color.border }}
                  >
                    <Plus size={14} /> Add Slot
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && selectedDept && slots.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>Timetable is currently empty for course {selectedDept.toUpperCase()}</h3>
          <p>Click the "Add Slot" button to add your first lecture slot for this course.</p>
          <button className={styles.addBtn} onClick={openAdd}>
            <Plus size={16} /> Add First Slot
          </button>
        </div>
      )}

      {/* Modal: Add / Edit Class Slot */}
      {showModal && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{form.id ? '✏️ Edit Class Slot' : '➕ Add New Class Slot'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.modalForm}>
              {/* Course / Department & Day */}
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Course / Department</label>
                  <div className={styles.selectWrap}>
                    <select
                      value={form.department}
                      onChange={e => {
                        const selectedName = e.target.value;
                        const matched = coursesList.find(c => c.name.toUpperCase() === selectedName.toUpperCase());
                        setForm({ 
                          ...form, 
                          department: selectedName, 
                          course_id: matched ? matched.id : form.course_id 
                        });
                      }}
                      required
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Day</label>
                  <div className={styles.selectWrap}>
                    <select
                      value={form.day}
                      onChange={e => setForm({ ...form, day: e.target.value })}
                      required
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={16} className={styles.selectIcon} />
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={form.time_start}
                    onChange={e => setForm({ ...form, time_start: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={form.time_end}
                    onChange={e => setForm({ ...form, time_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Subject Selection (Master Dropdown filtered by Department) */}
              <div className={styles.field}>
                <label>Select Subject for {form.department}</label>
                <div className={styles.selectWrap}>
                  <select
                    value={form.subject}
                    onChange={e => {
                      const selectedSubName = e.target.value;
                      const subObj = subjectsList.find(s => s.name === selectedSubName);
                      const subId = subObj ? subObj.id : '';

                      const matchingTeachers = teachersList.filter(t => {
                        const deptMatch = isDeptMatch(t.course_code, t.course_name, form.department);
                        if (!deptMatch) return false;

                        if (!subId) return true;
                        if (!t.assigned_subjects || t.assigned_subjects.length === 0) return true;
                        return t.assigned_subjects.some(s => String(s.id) === String(subId));
                      });

                      const defaultTeacher = matchingTeachers.length > 0 ? matchingTeachers[0] : null;

                      setForm({ 
                        ...form, 
                        subject: selectedSubName, 
                        subject_id: subId,
                        teacher: defaultTeacher ? defaultTeacher.name : '',
                        teacher_id: defaultTeacher ? defaultTeacher.id : ''
                      });
                    }}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {filteredFormSubjects.length === 0 ? (
                      <option value="" disabled>⚠️ No subjects assigned for {form.department} department</option>
                    ) : (
                      filteredFormSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    )}
                  </select>
                  <ChevronDown size={16} className={styles.selectIcon} />
                </div>
              </div>

              {/* Custom Modern Faculty Selection */}
              <div className={styles.field}>
                <label>Select Faculty for {form.department} (optional)</label>

                {form.subject && (
                  <div className={styles.subjectTeacherBadge}>
                    💡 Showing faculty for <strong>{form.subject}</strong> ({filteredFormTeachers.length} available)
                  </div>
                )}

                <CustomFacultyPicker
                  selectedTeacherId={form.teacher_id}
                  selectedTeacherName={form.teacher}
                  onSelect={(teachObj) => {
                    setForm({
                      ...form,
                      teacher: teachObj ? teachObj.name : '',
                      teacher_id: teachObj ? teachObj.id : ''
                    });
                  }}
                  teachersList={teachersList}
                  currentCourse={form.department}
                  currentSubjectId={form.subject_id}
                  placeholder="-- Choose Faculty --"
                />

                {form.teacher && (
                  <div className={styles.selectedTeacherSubtext}>
                    👨‍🏫 <strong>{form.teacher}</strong>
                    {(() => {
                      const tObj = teachersList.find(t => 
                        (form.teacher_id && String(t.id) === String(form.teacher_id)) ||
                        (form.teacher && t.name === form.teacher)
                      );
                      if (!tObj) return null;
                      return (
                        <span className={styles.subtextMeta}>
                          • Course: <span className={styles.coursePill}>{tObj.course_code || tObj.course_name || form.department}</span>
                          {tObj.designation && ` • ${tObj.designation}`}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>



              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <><div className={styles.microSpin} /> Saving...</> : <>{form.id ? '✅ Update Slot' : '✅ Save Slot'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Lists Manager Modal Drawer with Department Filter & Empty States */}




      {/* NESTED SUBJECT ASSIGNMENT MODAL */}
      {assigningTeacher && (
        <div className={styles.nestedOverlay} onClick={() => setAssigningTeacher(null)}>
          <div className={styles.nestedModal} onClick={e => e.stopPropagation()}>
            <div className={styles.nestedHeader}>
              <div>
                <h4>📚 Assign Subjects to {assigningTeacher.name}</h4>
                <p className={styles.nestedSub}>Select subjects this faculty member is qualified to teach</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setAssigningTeacher(null)}><X size={18} /></button>
            </div>

            <div className={styles.nestedBody}>
              <div className={styles.subjectChecklistGrid}>
                {subjectsList
                  .filter(s => !assigningTeacher.course_name || !s.course_name || s.course_name.toUpperCase() === assigningTeacher.course_name.toUpperCase())
                  .map(s => {
                    const isChecked = selectedTeacherSubjectIds.includes(s.id);
                    return (
                      <label key={s.id} className={`${styles.checkItemLabel} ${isChecked ? styles.checkedLabel : ''}`}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTeacherSubjectId(s.id)}
                        />
                        <span className={styles.checkItemText}>{s.name}</span>
                        {s.course_code && <span className={styles.checkCourseTag}>{s.course_code}</span>}
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className={styles.nestedFooter}>
              <button className={styles.cancelBtn} onClick={() => setAssigningTeacher(null)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSaveTeacherSubjects} disabled={savingTeacherSubjects}>
                {savingTeacherSubjects ? 'Saving Mapping...' : '✅ Save Subject Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

