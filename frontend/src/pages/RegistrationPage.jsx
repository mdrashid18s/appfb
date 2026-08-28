/**
 * @file RegistrationPage.jsx
 * @description Multi-step Student Registration Page — content from XL Education,
 * styled to match the XL Education website theme (orange #ea580c) with interactive
 * Course Mega Menu & 11+ dropdown navigation popups.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import SiteFooter from "../components/SiteFooter";
import styles from "./RegistrationPage.module.css";

const STEPS = [
  { id: 1, label: "Registration", sub: "Submit details for registration" },
  { id: 2, label: "Review", sub: "Review fee breakdown & details" },
  { id: 3, label: "Payment", sub: "Secure your place with payment" },
  { id: 4, label: "Confirmation", sub: "Receive confirmation & total" },
];

const COURSES = [
  "Year 3 – 11+ Introduction",
  "Year 4 – 11+ Foundation",
  "Year 5 – 11+ Preparation",
  "Year 5 – 11+ English & Maths",
  "Year 7 – Foundation",
  "Year 8 – Intermediate",
  "Year 9 – StepUp",
  "Year 10 – FastForward",
  "GCSE Mathematics",
  "GCSE Combined Science",
  "A-Level Mathematics",
];

const COURSE_GROUPS = [
  {
    group: "11+ Preparation Courses",
    courses: [
      "Year 3 – 11+ Introduction",
      "Year 4 – 11+ Foundation",
      "Year 5 – 11+ Preparation",
      "Year 5 – 11+ English & Maths",
    ],
  },
  {
    group: "Pre-GCSE Courses",
    courses: [
      "Year 7 – Foundation",
      "Year 8 – Intermediate",
      "Year 9 – StepUp",
    ],
  },
  {
    group: "GCSE & A-Level",
    courses: [
      "Year 10 – FastForward",
      "GCSE Mathematics",
      "GCSE Combined Science",
      "A-Level Mathematics",
    ],
  },
];

const TARGET_SCHOOLS_BY_REGION = [
  {
    region: "Berkshire - Reading",
    schools: ["Reading School (Boys)", "Kendrick School (Girls)"],
  },
  {
    region: "Birmingham",
    schools: [
      "Bishop Vesey's Grammar School",
      "King Edward VI Aston School",
      "King Edward VI Camp Hill School (Boys)",
      "King Edward VI Camp Hill School (Girls)",
      "King Edward VI Five Ways School",
      "King Edward VI Handsworth School (Girls)",
      "Sutton Coldfield Grammar School (Girls)",
      "Handsworth Grammar School",
    ],
  },
  {
    region: "Buckinghamshire",
    schools: [
      "Royal Grammar School (High Wycombe)",
      "Sir William Borlase's Grammar School",
      "Dr Challoner's Grammar School",
      "Dr Challoner's High School",
      "Beaconsfield High School",
      "Chesham Grammar School",
      "Aylesbury Grammar School (Boys)",
      "Aylesbury High School (Girls)",
      "Sir Henry Floyd Grammar School",
      "Royal Latin School",
      "Burnham Grammar School",
    ],
  },
  {
    region: "Gloucestershire",
    schools: [
      "Pate's Grammar School",
      "Sir Thomas Rich's School",
      "The Crypt School",
      "Denmark Road High School",
      "Ribston Hall High School",
      "Stroud High School",
      "Marling School",
    ],
  },
  {
    region: "Berkshire - Slough",
    schools: [
      "Upton Court Grammar School",
      "Herschel Grammar School",
      "Langley Grammar School",
      "St Bernard's Catholic Grammar School",
    ],
  },
  {
    region: "Greater London & Surrey",
    schools: [
      "Tiffin School (Boys)",
      "Tiffin Girls' School",
      "Wilson's School",
      "Wallington County Grammar School",
      "Wallington High School for Girls",
      "Sutton Grammar School",
      "Nonsuch High School for Girls",
      "Queen Elizabeth's School (Barnet)",
      "Henrietta Barnett School",
      "St Olave's Grammar School",
      "Newstead Wood School",
    ],
  },
];

const ACADEMIC_SESSIONS = ["2025-2026", "2026-2027", "2027-2028"];
const SCHOOL_YEARS = [
  "Year 2 (September 2026)",
  "Year 3 (September 2026)",
  "Year 4 (September 2026)",
  "Year 5 (September 2026)",
  "Year 6 (September 2026)",
  "Year 7 (September 2026)",
];

const DOB_ELIGIBILITY = {
  "Year 2": {
    label: "Year 2 (age 6-7)",
    min: "2019-09-01",
    max: "2020-08-31",
    minFormatted: "1st September 2019",
    maxFormatted: "31st August 2020",
  },
  "Year 3": {
    label: "Year 3 (age 7-8)",
    min: "2018-09-01",
    max: "2019-08-31",
    minFormatted: "1st September 2018",
    maxFormatted: "31st August 2019",
  },
  "Year 4": {
    label: "Year 4 (age 8-9)",
    min: "2017-09-01",
    max: "2018-08-31",
    minFormatted: "1st September 2017",
    maxFormatted: "31st August 2018",
  },
  "Year 5": {
    label: "Year 5 (age 9-10)",
    min: "2016-09-01",
    max: "2017-08-31",
    minFormatted: "1st September 2016",
    maxFormatted: "31st August 2017",
  },
  "Year 6": {
    label: "Year 6 (age 10-11)",
    min: "2015-09-01",
    max: "2016-08-31",
    minFormatted: "1st September 2015",
    maxFormatted: "31st August 2016",
  },
  "Year 7": {
    label: "Year 7 (age 11-12)",
    min: "2014-09-01",
    max: "2015-08-31",
    minFormatted: "1st September 2014",
    maxFormatted: "31st August 2015",
  },
};

const getDobEligibilityError = (dob, schoolYear, session = "2026-2027") => {
  if (!dob || !schoolYear) return "";
  const matchKey = Object.keys(DOB_ELIGIBILITY).find(key => schoolYear.includes(key));
  if (!matchKey) return "";
  const rule = DOB_ELIGIBILITY[matchKey];
  if (dob < rule.min || dob > rule.max) {
    return `For ${rule.label} eligibility (${session} academic year), date of birth must be between ${rule.minFormatted} and ${rule.maxFormatted}.`;
  }
  return "";
};

export const ALL_COURSE_CATEGORIES = [
  {
    category: "11+ Primary Programmes (Grammar & Independent School Prep)",
    courses: [
      { name: "Year 3 – 11+ Introduction", defaultYear: "Year 3 (September 2026)" },
      { name: "Year 4 – 11+ Foundation", defaultYear: "Year 4 (September 2026)" },
      { name: "Year 5 – 11+ Preparation", defaultYear: "Year 5 (September 2026)" },
      { name: "Year 6 – 11+ Advanced & Mock Exam Mastery", defaultYear: "Year 6 (September 2026)" },
      { name: "Year 2 – Early Learners Maths & English Introduction", defaultYear: "Year 2 (September 2026)" },
    ],
  },
  {
    category: "GCSE & Secondary Programmes",
    courses: [
      { name: "Year 7 – Foundation (Pre-GCSE)", defaultYear: "Year 7 (September 2026)" },
      { name: "Year 8 – Pre-GCSE Mastery", defaultYear: "Year 7 (September 2026)" },
      { name: "Year 9 – Pre-GCSE Accelerated", defaultYear: "Year 7 (September 2026)" },
      { name: "Year 10 – GCSE FastForward", defaultYear: "Year 7 (September 2026)" },
      { name: "GCSE Combined Science & Maths Masterclass", defaultYear: "Year 7 (September 2026)" },
    ],
  },
  {
    category: "Baseline Diagnostic Assessment",
    courses: [
      { name: "Free 11+ Baseline Diagnostic Assessment (Year 3 - 6)", defaultYear: "Year 5 (September 2026)" },
    ],
  },
];

export const YEAR_SCHEDULE_MATRIX = {
  "Year 2": {
    yearLabel: "Year 2 (Little Learners / Early 11+ Introduction)",
    courses: [
      "Year 2 – Early Learners Maths & English Introduction",
      "Year 2 – Phonics & Creative Problem Solving"
    ],
    locations: [
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:30 to 11:30", "11:45 to 13:45"],
          "Sunday": ["09:30 to 11:30"]
        }
      },
      {
        city: "Langley",
        centreName: "Langley Centre",
        address: "Langley Grammar & Academy Hub, Langley Road, SL3 7EF",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:30 to 11:30", "14:00 to 16:00"],
          "Sunday": ["09:30 to 11:30"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Saturday"],
        sessions: {
          "Saturday": ["10:00 to 12:00", "13:00 to 15:00"]
        }
      }
    ]
  },
  "Year 3": {
    yearLabel: "Year 3 (11+ Introduction & Core Mastery)",
    courses: [
      "Year 3 – 11+ Introduction",
      "Year 3 – Foundation Reasoning & Vocabulary"
    ],
    locations: [
      {
        city: "Basingstoke",
        centreName: "Basingstoke Centre",
        address: "Queen Mary's College Campus, Cliddesden Rd, RG21 3HF",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:00", "13:00 to 16:00"],
          "Sunday": ["09:00 to 12:00"]
        }
      },
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Saturday", "Sunday", "Weekday Evening"],
        sessions: {
          "Saturday": ["09:00 to 12:00", "14:00 to 17:00"],
          "Sunday": ["09:00 to 12:00", "14:00 to 17:00"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Langley",
        centreName: "Langley Centre",
        address: "Langley Grammar & Academy Hub, Langley Road, SL3 7EF",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:00", "14:00 to 17:00"],
          "Sunday": ["09:00 to 12:00"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:00"],
          "Sunday": ["09:00 to 12:00", "14:00 to 17:00"]
        }
      }
    ]
  },
  "Year 4": {
    yearLabel: "Year 4 (11+ Foundation & Reasoning)",
    courses: [
      "Year 4 – 11+ Foundation",
      "Year 4 – VR & NVR Intensive Practice"
    ],
    locations: [
      {
        city: "Basingstoke",
        centreName: "Basingstoke Centre",
        address: "Queen Mary's College Campus, Cliddesden Rd, RG21 3HF",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Langley",
        centreName: "Langley Centre",
        address: "Langley Grammar & Academy Hub, Langley Road, SL3 7EF",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Manchester",
        centreName: "Manchester Centre",
        address: "Altrincham Grammar & Trafford Learning Hub, Cavendish Rd, WA14 2NP",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Sunday": ["09:00 to 12:30"]
        }
      }
    ]
  },
  "Year 5": {
    yearLabel: "Year 5 (11+ Intensive Preparation)",
    courses: [
      "Year 5 – 11+ Preparation",
      "Year 5 – 11+ English & Maths",
      "Year 5 – 11+ Masterclass & Mock Exam Pack"
    ],
    locations: [
      {
        city: "Basingstoke",
        centreName: "Basingstoke Centre",
        address: "Queen Mary's College Campus, Cliddesden Rd, RG21 3HF",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Langley",
        centreName: "Langley Centre",
        address: "Langley Grammar & Academy Hub, Langley Road, SL3 7EF",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      },
      {
        city: "Manchester",
        centreName: "Manchester Centre",
        address: "Altrincham Grammar & Trafford Learning Hub, Cavendish Rd, WA14 2NP",
        days: ["Sunday", "Saturday", "Weekday Evening"],
        sessions: {
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00", "17:00 to 19:30"],
          "Weekday Evening": ["17:00 to 19:30"]
        }
      }
    ]
  },
  "Year 6": {
    yearLabel: "Year 6 (11+ Final Sprint & Secondary Transition)",
    courses: [
      "Year 6 – 11+ Final Sprint & Mock Mastery",
      "Year 6 – Secondary School Transition Foundation"
    ],
    locations: [
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:30", "14:00 to 17:00"],
          "Sunday": ["09:00 to 12:30"]
        }
      },
      {
        city: "Langley",
        centreName: "Langley Centre",
        address: "Langley Grammar & Academy Hub, Langley Road, SL3 7EF",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["09:00 to 12:30"],
          "Sunday": ["09:00 to 12:30", "14:00 to 17:00"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["14:00 to 17:00"],
          "Sunday": ["09:00 to 12:30"]
        }
      }
    ]
  },
  "Year 7": {
    yearLabel: "Year 7 (Pre-GCSE Excellence)",
    courses: [
      "Year 7 – Foundation Pre-GCSE (Maths & Science)",
      "Year 7 – Advanced Reasoning & English"
    ],
    locations: [
      {
        city: "Reading",
        centreName: "Reading Centre",
        address: "University of Reading Campus, Crescent Road, RG1 5RQ",
        days: ["Saturday", "Weekday Evening"],
        sessions: {
          "Saturday": ["10:00 to 13:00", "14:00 to 17:00"],
          "Weekday Evening": ["17:30 to 20:00"]
        }
      },
      {
        city: "Manchester",
        centreName: "Manchester Centre",
        address: "Altrincham Grammar & Trafford Learning Hub, Cavendish Rd, WA14 2NP",
        days: ["Saturday", "Sunday"],
        sessions: {
          "Saturday": ["10:00 to 13:00"],
          "Sunday": ["14:00 to 17:00"]
        }
      },
      {
        city: "Sutton",
        centreName: "Sutton Centre",
        address: "Sutton Grammar / Cheam Learning Centre, Manor Road, SM1 4AS",
        days: ["Sunday"],
        sessions: {
          "Sunday": ["10:00 to 13:00", "14:00 to 17:00"]
        }
      }
    ]
  }
};

const blank = {
  firstName: "", surname: "",
  academicSession: "2026-2027", schoolYear: "",
  gender: "", dob: "", currentSchool: "",
  parentFirstName: "", parentSurname: "",
  primaryEmail: "", secondaryEmail: "",
  mobile: "", address: "",
  course: "", targetSchool: "",
  learningStyle: "Classroom",
  centreLocation: "",
  preferredDay: "",
  preferredSession: "",
  writingAddon: "",
  skipMainCourse: false,
  consent: false,
};

export default function RegistrationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [missingToastMsg, setMissingToastMsg] = useState("");
  const [refNum] = useState("REG-" + Math.random().toString(36).substring(2,9).toUpperCase());
  const [searchParams] = useSearchParams();

  // Pre-select course from URL query params (e.g. from Landing Page carousel)
  useEffect(() => {
    const courseParam = searchParams.get("course");
    if (courseParam) {
      setForm((prev) => ({ ...prev, course: courseParam }));
      setErrors((prev) => ({ ...prev, course: "" }));
    }
  }, [searchParams]);

  // Active navigation dropdown: 'courses' | '11plus' | 'gcse' | null
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  // Custom Course Dropdown
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef(null);

  // Custom Primary Target School Dropdown
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const schoolDropdownRef = useRef(null);

  // Step 2 Review States
  const [mainStartDate, setMainStartDate] = useState("13 Sept 2026 – Sunday");
  const [addonStartDate, setAddonStartDate] = useState("05 Oct 2026 – Monday");
  const [confirmCorrect, setConfirmCorrect] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isInfoPackOpen, setIsInfoPackOpen] = useState(false);
  const [infoPackTitle, setInfoPackTitle] = useState("Course Information Pack");

  const [courseHierarchy, setCourseHierarchy] = useState(null);
  const [dbLocations, setDbLocations] = useState([]);
  const [apiAddons, setApiAddons] = useState([]);
  const [apiCreativityAddons, setApiCreativityAddons] = useState([]);

  // Helper to parse Course -> Location -> Mode -> Days -> Sessions hierarchy structure
  const formatHierarchyResponse = (res) => {
    if (!res || res.status !== 1) return;
    setCourseHierarchy(res);

    if (Array.isArray(res.addons)) {
      setApiAddons(res.addons);
    }
    if (Array.isArray(res.creativity_addons)) {
      setApiCreativityAddons(res.creativity_addons);
    }

    const locations = res.course?.locations || [];
    if (Array.isArray(locations) && locations.length > 0) {
      const formatted = locations.map(loc => {
        const classroomMode = (loc.modes || []).find(m => m.name === "Classroom" || m.id === 13);
        const days = (classroomMode?.days || []).map(d => d.day_text);
        const sessionsObj = {};
        const allSlots = [];
        (classroomMode?.days || []).forEach(d => {
          sessionsObj[d.day_text] = (d.sessions || []).map(s => s.timing);
          (d.sessions || []).forEach(s => {
            allSlots.push({
              id: s.id,
              day_of_week: d.day_text,
              session_timing: s.timing,
              is_full: s.is_full === 1,
              remaining_seats: s.remaining_seats,
            });
          });
        });
        return {
          id: loc.id,
          city: loc.name,
          centreName: `${loc.name} Centre`,
          days: days,
          sessions: sessionsObj,
          timingSlots: allSlots,
          modes: loc.modes || [],
        };
      });
      if (formatted.length > 0) {
        setDbLocations(formatted);
      }
    }
  };

  // Fetch initial location slots hierarchy from DB / API
  useEffect(() => {
    const courseQuery = form.course ? `?course=${encodeURIComponent(form.course)}` : '';
    fetch(`/api/locations${courseQuery}`)
      .then((res) => res.json())
      .then((res) => {
        if (res && res.status === 1) {
          formatHierarchyResponse(res);
        }
      })
      .catch(() => {});
  }, [form.course]);

  // Derived locations available for the selected course
  const availableLocations = useMemo(() => {
    if (dbLocations.length > 0) return dbLocations;
    // Fallback: list unique locations across matrix
    const allLocs = [];
    const seen = new Set();
    Object.values(YEAR_SCHEDULE_MATRIX).forEach((y) => {
      (y.locations || []).forEach((l) => {
        if (!seen.has(l.city)) {
          seen.add(l.city);
          allLocs.push(l);
        }
      });
    });
    return allLocs;
  }, [dbLocations]);

  const selectedLocationObj = availableLocations.find(l => l.city === form.centreLocation) || null;

  // Filter slots for the current selected course/school year
  const matchingSlots = useMemo(() => {
    if (!selectedLocationObj) return [];
    const allSlots = selectedLocationObj.timingSlots || [];
    if (!form.course && !form.schoolYear) return allSlots;
    const yr = Object.keys(YEAR_SCHEDULE_MATRIX).find(k => (form.course || form.schoolYear).includes(k));
    if (!yr) return allSlots;
    const yearFiltered = allSlots.filter(s => !s.school_year || s.school_year.includes(yr));
    return yearFiltered.length > 0 ? yearFiltered : allSlots;
  }, [selectedLocationObj, form.course, form.schoolYear]);

  const availableDays = useMemo(() => {
    if (matchingSlots.length > 0) {
      const days = Array.from(new Set(matchingSlots.map(s => s.day_of_week).filter(Boolean)));
      if (days.length > 0) return days;
    }
    if (selectedLocationObj && Array.isArray(selectedLocationObj.days) && selectedLocationObj.days.length > 0) {
      return selectedLocationObj.days;
    }
    // Fallback from schedule matrix
    const yr = Object.keys(YEAR_SCHEDULE_MATRIX).find(k => (form.course || form.schoolYear || "").includes(k)) || "Year 5";
    const locInMatrix = (YEAR_SCHEDULE_MATRIX[yr]?.locations || []).find(l => l.city === form.centreLocation);
    if (locInMatrix && Array.isArray(locInMatrix.days) && locInMatrix.days.length > 0) {
      return locInMatrix.days;
    }
    return ["Saturday", "Sunday"];
  }, [matchingSlots, selectedLocationObj, form.course, form.schoolYear, form.centreLocation]);

  const availableSessions = useMemo(() => {
    if (!form.preferredDay) return [];
    if (matchingSlots.length > 0) {
      const daySlots = matchingSlots.filter(s => s.day_of_week === form.preferredDay);
      if (daySlots.length > 0) {
        return daySlots.map(s => {
          const timingStr = s.session_timing || (s.time_start && s.time_end ? `${s.time_start.slice(0,5)} to ${s.time_end.slice(0,5)}` : "Session");
          const remaining = s.remaining_seats !== undefined ? s.remaining_seats : (s.max_seats - (s.booked_seats || 0));
          const isFull = s.is_full || remaining <= 0;
          return {
            value: timingStr,
            label: isFull 
              ? `${timingStr} (FULL - 0 seats left)` 
              : `${timingStr} (${remaining} seats available)`,
            remainingSeats: remaining,
            isFull: isFull,
            isAvailable: s.is_available,
          };
        });
      }
    }
    // Fallback 1: selectedLocationObj.sessions
    const raw = (selectedLocationObj && selectedLocationObj.sessions && selectedLocationObj.sessions[form.preferredDay]) || [];
    if (raw.length > 0) {
      return raw.map(str => (typeof str === 'string' ? { value: str, label: `${str} (Seats Available)`, isFull: false } : str));
    }
    // Fallback 2: Matrix for this year & location
    const yr = Object.keys(YEAR_SCHEDULE_MATRIX).find(k => (form.course || form.schoolYear || "").includes(k)) || "Year 5";
    const locInMatrix = (YEAR_SCHEDULE_MATRIX[yr]?.locations || []).find(l => l.city === form.centreLocation);
    if (locInMatrix && locInMatrix.sessions && locInMatrix.sessions[form.preferredDay]) {
      return locInMatrix.sessions[form.preferredDay].map(str => ({ value: str, label: `${str} (Seats Available)`, isFull: false }));
    }
    // Fallback 3: Standard Sessions
    return [
      { value: "09:00 to 12:30", label: "09:00 to 12:30 (Morning Batch - Available)", isFull: false },
      { value: "14:00 to 17:00", label: "14:00 to 17:00 (Afternoon Batch - Available)", isFull: false },
    ];
  }, [matchingSlots, form.preferredDay, selectedLocationObj, form.course, form.schoolYear, form.centreLocation]);

  const handleSelectCourse = (courseName) => {
    let matchedYear = form.schoolYear;
    for (const cat of ALL_COURSE_CATEGORIES) {
      const found = cat.courses.find(c => c.name === courseName);
      if (found) {
        matchedYear = found.defaultYear;
        break;
      }
    }

    setForm(p => ({
      ...p,
      course: courseName,
      schoolYear: matchedYear || p.schoolYear || "Year 5 (September 2026)",
      // Reset downstream selections when course changes
      centreLocation: "",
      preferredDay: "",
      preferredSession: "",
    }));
    setErrors(p => ({ ...p, course: "", centreLocation: "", preferredDay: "", preferredSession: "" }));
    setIsCourseDropdownOpen(false);
  };

  const [submittingReg, setSubmittingReg] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(refNum);
  const [duplicateError, setDuplicateError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  /**
   * Real-time validator: checks combination of email AND student name on backend
   */
  const checkEmailAndStudentDuplicate = async (emailVal, firstNameVal, surnameVal) => {
    const email = (emailVal !== undefined ? emailVal : form.primaryEmail)?.trim();
    const firstName = (firstNameVal !== undefined ? firstNameVal : form.firstName)?.trim();
    const surname = (surnameVal !== undefined ? surnameVal : form.surname)?.trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return false;
    }

    try {
      setIsCheckingDuplicate(true);
      const res = await fetch("/api/registrations/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, firstName, surname })
      });
      const data = await res.json();
      setIsCheckingDuplicate(false);

      if (data.is_duplicate) {
        const studentLabel = (firstName || surname) ? `${firstName} ${surname}`.trim() : 'This student';
        const msg = data.message || `${studentLabel} with email ${email} is already registered. Please log in.`;
        setDuplicateError(msg);
        setErrors((prev) => ({ ...prev, primaryEmail: `${studentLabel} is already registered with this email` }));
        return true;
      } else {
        setDuplicateError("");
        setErrors((prev) => {
          if (prev.primaryEmail && prev.primaryEmail.includes("already registered")) {
            const next = { ...prev };
            delete next.primaryEmail;
            return next;
          }
          return prev;
        });
        return false;
      }
    } catch (err) {
      console.warn("Duplicate check error", err);
      setIsCheckingDuplicate(false);
      return false;
    }
  };

  // Real-time debounced check as soon as email or student name changes
  useEffect(() => {
    if (!form.primaryEmail || !/\S+@\S+\.\S+/.test(form.primaryEmail)) return;
    const timer = setTimeout(() => {
      checkEmailAndStudentDuplicate(form.primaryEmail, form.firstName, form.surname);
    }, 600);
    return () => clearTimeout(timer);
  }, [form.primaryEmail, form.firstName, form.surname]);

  // Razorpay Status Popups State: 'idle' | 'success' | 'failed'
  const [paymentModal, setPaymentModal] = useState("idle");
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [paymentErrorData, setPaymentErrorData] = useState(null);

  const startRazorpayPayment = async () => {
    if (submittingReg) return;
    setSubmittingReg(true);
    setDuplicateError("");

    try {
      // 1. Create Razorpay Order on Backend (with student name and email duplicate check)
      const orderRes = await fetch('/api/registrations/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: 49.00,
          email: form.primaryEmail,
          firstName: form.firstName,
          surname: form.surname,
          mobile: form.mobile,
          name: `${form.parentFirstName} ${form.parentSurname}`.trim(),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success || !orderData.razorpay_order_id) {
        setSubmittingReg(false);
        if (orderData.already_registered || orderData.is_duplicate) {
          const dupMsg = orderData.message || 'This student with this email is already registered.';
          setDuplicateError(dupMsg);
          setErrors(p => ({ ...p, primaryEmail: dupMsg }));
          setStep(1);
          if (toast && typeof toast.error === 'function') {
            toast.error(dupMsg);
          }
          return;
        }
        setPaymentErrorData({
          title: 'Payment Gateway Error',
          reason: orderData.message || 'Unable to connect with Razorpay. Please try again.',
          code: 'ORDER_INIT_FAILED',
        });
        setPaymentModal('failed');
        return;
      }

      if (!window.Razorpay) {
        setSubmittingReg(false);
        setPaymentErrorData({
          title: 'Gateway SDK Not Loaded',
          reason: 'Razorpay SDK is not loaded. Please refresh the page and try again.',
          code: 'SDK_MISSING',
        });
        setPaymentModal('failed');
        return;
      }

      // 2. Configure Razorpay Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'XL Education Portal',
        description: `Student Registration Fee - ${form.course || 'Course Enrollment'}`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: `${form.parentFirstName} ${form.parentSurname}`.trim() || `${form.firstName} ${form.surname}`.trim(),
          email: form.primaryEmail,
          contact: form.mobile,
        },
        theme: {
          color: '#0284c7',
        },
        modal: {
          ondismiss: function () {
            setSubmittingReg(false);
          },
        },
        handler: function (response) {
          // ── 1. INSTANT POPUP (0ms Delay) ──
          const initialRef = refNum;
          setSubmittedRef(initialRef);
          setPaymentSuccessData({
            refNumber: initialRef,
            rollNo: 'Assigned ✓',
            paymentId: response.razorpay_payment_id || 'RZP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            amount: '49.00',
            email: form.primaryEmail,
            studentName: `${form.firstName} ${form.surname}`.trim(),
            course: form.course,
          });
          setPaymentModal('success');
          setSubmittingReg(false);

          // ── 2. Background Sync Registration & Dispatch Emails ──
          fetch('/api/registrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              ...form,
              academicSession: form.academicSession || '2026-2027',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount_paid: 49.00,
            }),
          })
          .then(res => res.json())
          .then(regData => {
            if (regData.success) {
              const assignedRef = regData.ref_number || initialRef;
              const assignedRoll = regData.roll_no || 'Confirmed';
              setSubmittedRef(assignedRef);
              setPaymentSuccessData(prev => ({
                ...prev,
                refNumber: assignedRef,
                rollNo: assignedRoll,
              }));
            }
          })
          .catch(err => {
            console.warn("Background registration sync notice:", err);
          });
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (errResponse) {
        setSubmittingReg(false);
        setPaymentErrorData({
          title: 'Payment Failed / Declined',
          reason: errResponse?.error?.description || 'Your payment was declined by the bank or gateway timeout occurred.',
          code: errResponse?.error?.code || 'PAYMENT_FAILED',
        });
        setPaymentModal('failed');
      });

      rzp.open();
    } catch (e) {
      setSubmittingReg(false);
      setPaymentErrorData({
        title: 'Connection Error',
        reason: 'Failed to initiate Razorpay checkout. Please check your internet connection.',
        code: 'CLIENT_ERROR',
      });
      setPaymentModal('failed');
    }
  };

  // Close dropdowns on outside click
  const [topEnrolHover, setTopEnrolHover] = useState(false);
  const [topEnrolOpen, setTopEnrolOpen] = useState(false);
  const topEnrolRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) {
        setIsSchoolDropdownOpen(false);
      }
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setIsCourseDropdownOpen(false);
      }
      if (topEnrolRef.current && !topEnrolRef.current.contains(event.target)) {
        setTopEnrolOpen(false);
        setTopEnrolHover(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleDropdown = (menuName) => {
    setActiveDropdown((prev) => (prev === menuName ? null : menuName));
  };

  const handleSelectCourseFromMenu = (courseName) => {
    let matchedYear = "";
    if (courseName.includes("Year 2")) matchedYear = "Year 2 (September 2026)";
    else if (courseName.includes("Year 3")) matchedYear = "Year 3 (September 2026)";
    else if (courseName.includes("Year 4")) matchedYear = "Year 4 (September 2026)";
    else if (courseName.includes("Year 5")) matchedYear = "Year 5 (September 2026)";
    else if (courseName.includes("Year 6")) matchedYear = "Year 6 (September 2026)";
    else if (courseName.includes("Year 7")) matchedYear = "Year 7 (September 2026)";

    setForm((prev) => ({ 
      ...prev, 
      schoolYear: matchedYear || prev.schoolYear,
      course: courseName,
      centreLocation: "",
      preferredDay: "",
      preferredSession: ""
    }));
    setErrors((prev) => ({ ...prev, course: "", schoolYear: "" }));
    setActiveDropdown(null);
    setIsCourseDropdownOpen(false);
    if (step !== 1) setStep(1);
    
    // Smooth scroll to course section if visible
    const el = document.getElementById("reg-course");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const pct = Math.round(((step - 1) / (STEPS.length - 1)) * 100);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    setForm((p) => {
      const updated = { ...p, [name]: newVal };

      // Year change resets course
      if (name === "schoolYear") {
        updated.course = "";
      }

      // Location change resets day & session
      if (name === "centreLocation") {
        updated.preferredDay = "";
        updated.preferredSession = "";
      }

      // Preferred Day change resets session
      if (name === "preferredDay") {
        updated.preferredSession = "";
      }

      if (name === "dob" || name === "schoolYear" || name === "academicSession") {
        const targetDob = name === "dob" ? newVal : updated.dob;
        const targetYear = name === "schoolYear" ? newVal : updated.schoolYear;
        const targetSession = name === "academicSession" ? newVal : (updated.academicSession || "2026-2027");

        if (targetDob) {
          const dobErr = getDobEligibilityError(targetDob, targetYear, targetSession);
          setErrors((prev) => ({ ...prev, [name]: "", dob: dobErr }));
        } else {
          setErrors((prev) => ({ ...prev, [name]: "" }));
        }
      }

      if (name === "primaryEmail") {
        setDuplicateError("");
      }

      return updated;
    });
  };

  /**
   * Evaluates all form validation rules and returns an array of missing field descriptors
   * with explicit English labels and guidance messages.
   */
  const getMissingFieldsList = () => {
    const missing = [];
    if (!form.firstName?.trim()) {
      missing.push({ key: 'firstName', name: 'Student First Name', message: 'Please enter Student First Name' });
    }
    if (!form.surname?.trim()) {
      missing.push({ key: 'surname', name: 'Student Surname', message: 'Please enter Student Surname' });
    }
    if (!form.academicSession) {
      missing.push({ key: 'academicSession', name: 'Academic Session', message: 'Please select Academic Session (e.g. 2026-2027)' });
    }
    if (!form.schoolYear) {
      missing.push({ key: 'schoolYear', name: 'School Year', message: 'Please select School Year (e.g. Year 5)' });
    }
    if (!form.gender) {
      missing.push({ key: 'gender', name: 'Student Gender', message: 'Please select Student Gender (Male / Female)' });
    }
    
    if (!form.dob) {
      missing.push({ key: 'dob', name: 'Date of Birth', message: 'Student Date of Birth is required' });
    } else {
      const dobEligibilityErr = getDobEligibilityError(form.dob, form.schoolYear, form.academicSession || "2026-2027");
      if (dobEligibilityErr) {
        missing.push({ key: 'dob', name: 'Date of Birth Eligibility', message: dobEligibilityErr });
      }
    }

    if (!form.currentSchool?.trim()) {
      missing.push({ key: 'currentSchool', name: 'Current Primary School', message: 'Please enter Current Primary School' });
    }
    if (!form.parentFirstName?.trim()) {
      missing.push({ key: 'parentFirstName', name: "Parent's First Name", message: "Please enter Parent's First Name" });
    }
    if (!form.parentSurname?.trim()) {
      missing.push({ key: 'parentSurname', name: "Parent's Surname", message: "Please enter Parent's Surname" });
    }
    
    if (!form.primaryEmail?.trim()) {
      missing.push({ key: 'primaryEmail', name: 'Parent Email Address', message: 'Please enter Parent Primary Email Address' });
    } else if (!/\S+@\S+\.\S+/.test(form.primaryEmail)) {
      missing.push({ key: 'primaryEmail', name: 'Email Address Format', message: 'Please enter a valid email format (e.g. parent@example.com)' });
    }

    if (!form.mobile?.trim()) {
      missing.push({ key: 'mobile', name: 'Parent Mobile Number', message: 'Please enter UK Mobile Number (e.g. 07xxxxxxxxx)' });
    }
    if (!form.course) {
      missing.push({ key: 'course', name: 'Course Selection', message: 'Please select an 11+ Course from dropdown' });
    }
    if (!form.learningStyle) {
      missing.push({ key: 'learningStyle', name: 'Learning Style / Delivery Mode', message: 'Please choose Learning Style (Classroom / Online Live / DIY)' });
    }
    
    if (form.learningStyle === "Classroom" && !form.centreLocation) {
      missing.push({ key: 'centreLocation', name: 'Classroom Centre Location', message: 'Please select Centre Location (Reading, Basingstoke, Langley, Sutton, etc.)' });
    }

    if (form.learningStyle && form.learningStyle !== "DIY") {
      if (!form.preferredDay) {
        missing.push({ key: 'preferredDay', name: 'Preferred Class Day', message: 'Please choose Preferred Day (Saturday / Sunday)' });
      }
      if (!form.preferredSession) {
        missing.push({ key: 'preferredSession', name: 'Preferred Timing Session', message: 'Please select a Preferred Timing Session' });
      }
    }

    if (!form.consent) {
      missing.push({ key: 'consent', name: 'Terms & Privacy Agreement', message: 'Please check the Terms & Conditions consent agreement box' });
    }

    return missing;
  };

  const validate = () => {
    const missing = getMissingFieldsList();
    const e = {};
    missing.forEach(m => {
      e[m.key] = m.message;
    });
    setErrors(e);
    return missing.length === 0;
  };

  const isStep1Valid = getMissingFieldsList().length === 0;

  const next = async () => {
    const missing = getMissingFieldsList();
    if (missing.length > 0) {
      validate();
      const firstMissing = missing[0];
      const alertMsg = firstMissing.message || `Please fill in: ${firstMissing.name}`;
      
      // Global toast notification (auto-dismisses)
      if (toast && typeof toast.error === 'function') {
        toast.error(alertMsg);
      }

      // Display 2-second in-page flash notice
      setMissingToastMsg(alertMsg);
      setTimeout(() => {
        setMissingToastMsg("");
      }, 2000);
      
      // Auto-scroll smoothly to the first missing element
      const targetEl = document.querySelector(`[name="${firstMissing.key}"], #${firstMissing.key}, [id*="${firstMissing.key}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.focus?.();
      }
      return;
    }

    // Check duplicate email + student name combo before moving to Review / Payment
    const isDup = await checkEmailAndStudentDuplicate(form.primaryEmail, form.firstName, form.surname);
    if (isDup) {
      const studentLabel = (form.firstName || form.surname) ? `${form.firstName} ${form.surname}`.trim() : 'This student';
      const dupAlert = `${studentLabel} is already registered with email (${form.primaryEmail}). Please log in.`;
      if (toast && typeof toast.error === 'function') {
        toast.error(dupAlert);
      }
      setMissingToastMsg(dupAlert);
      setTimeout(() => setMissingToastMsg(""), 3000);
      return;
    }

    setStep(2);
  };
  const reset = () => { setForm(blank); setErrors({}); setDuplicateError(""); setMissingToastMsg(""); };

  return (
    <div className={styles.page}>

      {/* ── TOP UTILITY STRIP ── */}
      <div className={styles.topStrip}>
        <div className={styles.topStripInner}>
          <div className={styles.locationsList}>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#reading-section')}>
              Reading
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#branch-locations-section')}>
              Basingstoke
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#branch-locations-section')}>
              Langley
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#branch-locations-section')}>
              Sutton
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#online-services-section')}>
              Online
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => navigate('/#franchise-partners-section')}>
              Manchester
            </button>
          </div>
          <div className={styles.topStripRight}>
            <div 
              ref={topEnrolRef}
              className={styles.topStripEnrolWrap}
              onMouseEnter={() => setTopEnrolHover(true)}
              onMouseLeave={() => setTopEnrolHover(false)}
            >
              <button 
                type="button"
                className={styles.topStripEnrolPill} 
                onClick={(e) => { 
                  e.stopPropagation();
                  setTopEnrolOpen(prev => !prev);
                }}
              >
                <span className={styles.greenLiveDot} />
                <span>Enrol Now — 2026/27</span>
                <span className={styles.pillSparkle}>✨</span>
              </button>

              {/* ── HOVER & CLICK-LOCKED DROPDOWN ── */}
              {(topEnrolHover || topEnrolOpen) && (
                <div className={styles.topStripEnrolDropdown} onClick={(e) => e.stopPropagation()}>
                  <div 
                    className={styles.topStripDropdownItem}
                    onClick={() => {
                      setTopEnrolOpen(false);
                      setTopEnrolHover(false);
                      setForm(prev => ({ ...prev, course: "Year 5 – 11+ Preparation" }));
                      setStep(1);
                    }}
                  >
                    <div className={styles.itemIconCircle}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemHeading}>11+ Primary</span>
                      <span className={styles.itemSubheading}>Year 3, 4 &amp; 5</span>
                    </div>
                  </div>

                  <div className={styles.dropdownItemDivider} />

                  <div 
                    className={styles.topStripDropdownItem}
                    onClick={() => {
                      setTopEnrolOpen(false);
                      setTopEnrolHover(false);
                      setForm(prev => ({ ...prev, course: "GCSE Combined Science" }));
                      setStep(1);
                    }}
                  >
                    <div className={styles.itemIconCircle}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemHeading}>GCSE Courses</span>
                      <span className={styles.itemSubheading}>Year 7, 8, 9 &amp; 10</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <a 
              href="https://wa.me/919771648972?text=Hello%20Md%20Rashid,%20I%20have%20a%20query%20about%20Registration!" 
              target="_blank" 
              rel="noreferrer" 
              className={styles.whatsappStripBtn}
              title="WhatsApp Chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>WhatsApp: 9771648972</span>
            </a>
            <span className={styles.contactItem}>✉ mrrashidsaikh0365@gmail.com</span>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER & NAVBAR ── */}
      <header className={styles.header}>
        <div className={styles.headerInner} ref={navRef}>
          <div className={styles.brand} onClick={() => navigate("/")}>
            <img src="/logo.svg" alt="XL Education" className={styles.brandLogoImg} />
            <span className={styles.brandName}>XL Education</span>
          </div>

          <nav className={styles.nav}>
            <button className={styles.navLink} onClick={() => navigate("/")}>
              Home
            </button>

            {/* Courses Dropdown Button */}
            <div className={styles.navItemWithDropdown}>
              <button 
                className={`${styles.navDropdownTrigger} ${activeDropdown === "courses" ? styles.navActive : ""}`}
                onClick={() => toggleDropdown("courses")}
              >
                <span>Courses</span>
                <span className={styles.chevron}>▾</span>
              </button>

              {/* ── COURSES MEGA MENU POPUP ── */}
              {activeDropdown === "courses" && (
                <div className={styles.megaMenuPopup}>
                  <div className={styles.megaGrid}>
                    {/* Column 1: 11+ Courses */}
                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>11+ Courses</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 3 – 11+ Introduction")}>
                            Year 3 – 11+ Introduction
                          </button>
                        </li>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 4 – 11+ Foundation")}>
                            Year 4 – 11+ Foundation
                          </button>
                        </li>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 5 – 11+ Preparation")}>
                            Year 5 – 11+ Preparation
                          </button>
                        </li>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 5 – 11+ English & Maths")}>
                            Year 5 – 11+ English & Maths
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2: Pre-GCSE */}
                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>Pre-GCSE</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 7 – Foundation")}>
                            Year 7 – Foundation
                          </button>
                        </li>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 8 – Intermediate")}>
                            Year 8 – Intermediate
                          </button>
                        </li>
                        <li>
                          <button 
                            className={styles.highlightedItem}
                            onClick={() => handleSelectCourseFromMenu("Year 9 – StepUp")}
                          >
                            Year 9 – StepUp
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Column 3: GCSE */}
                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>GCSE</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li>
                          <button onClick={() => handleSelectCourseFromMenu("Year 10 – FastForward")}>
                            Year 10 – FastForward
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.megaFooter}>
                    <button 
                      className={styles.megaFooterLink}
                      onClick={() => {
                        setStep(1);
                        setActiveDropdown(null);
                        const el = document.getElementById("reg-course");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      View all courses and detailed information &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 11+ Dropdown Button */}
            <div className={styles.navItemWithDropdown}>
              <button 
                className={`${styles.navDropdownTrigger} ${activeDropdown === "11plus" ? styles.navActive : ""}`}
                onClick={() => toggleDropdown("11plus")}
              >
                <span>11+</span>
                <span className={styles.chevron}>▾</span>
              </button>

              {/* ── 11+ DROPDOWN POPUP ── */}
              {activeDropdown === "11plus" && (
                <div className={styles.simpleDropdownPopup}>
                  <ul className={styles.simpleDropdownList}>
                    <li>
                      <button onClick={() => { setStep(1); setActiveDropdown(null); }}>
                        11+ Register
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("Year 5 – 11+ English & Maths")}>
                        11+ Add-ons
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("Year 5 – 11+ Preparation")}>
                        11+ Exams
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("Year 4 – 11+ Foundation")}>
                        11+ Mockathon
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* GCSE Dropdown Button */}
            <div className={styles.navItemWithDropdown}>
              <button 
                className={`${styles.navDropdownTrigger} ${activeDropdown === "gcse" ? styles.navActive : ""}`}
                onClick={() => toggleDropdown("gcse")}
              >
                <span>GCSE</span>
                <span className={styles.chevron}>▾</span>
              </button>

              {/* ── GCSE DROPDOWN POPUP ── */}
              {activeDropdown === "gcse" && (
                <div className={styles.simpleDropdownPopup}>
                  <ul className={styles.simpleDropdownList}>
                    <li>
                      <button onClick={() => { setStep(1); setActiveDropdown(null); }}>
                        GCSE Register
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("Year 10 – FastForward")}>
                        GCSE Add-ons
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("GCSE Mathematics")}>
                        GCSE Exams
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleSelectCourseFromMenu("GCSE Combined Science")}>
                        GCSE Mock Tests
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <span className={styles.offersBadge}>
              ✨ OFFERS
            </span>
          </nav>

          <div className={styles.headerRight}>
            <button className={styles.loginLink} onClick={() => navigate("/login")}>Login</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>

        {/* ── TOP HORIZONTAL STEPPER (REGISTRATION — REVIEW — PAYMENT — CONFIRMATION) ── */}
        <div className={styles.topHorizontalStepper}>
          <div className={styles.hStepperInner}>
            {STEPS.map((s, idx) => {
              const isDone = step > s.id;
              const isActive = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div 
                    className={`${styles.hStepItem} ${isActive ? styles.hStepActive : ""} ${isDone ? styles.hStepDone : ""}`}
                    onClick={() => { if (isDone) setStep(s.id); }}
                    style={{ cursor: isDone ? "pointer" : "default" }}
                  >
                    <div className={`${styles.hStepCircle} ${isDone ? styles.hStepCircleDone : ""}`}>
                      {isDone ? "✓" : s.id}
                    </div>
                    <span className={styles.hStepLabel}>{s.label.toUpperCase()}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`${styles.hConnector} ${step > s.id ? styles.hConnectorDone : ""}`}>
                      <div 
                        className={styles.hConnectorProgress} 
                        style={{ width: step > s.id ? "100%" : step === s.id ? "50%" : "0%" }} 
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── LOCKED RIGHT-SIDE FLOATING PROGRESS WIDGET (OVERLAY WITHOUT EMPTY SPACE) ── */}
        <div className={styles.lockedRightWidget}>
          <div className={styles.lockedWidgetCard}>
            <div className={styles.lockedWidgetHeader}>
              <span className={styles.lockedLiveDot}></span>
              <span className={styles.lockedWidgetTitle}>Progress</span>
              <strong className={styles.lockedWidgetPercent}>{pct}%</strong>
            </div>
            <div className={styles.lockedProgressBar}>
              <div className={styles.lockedProgressFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.lockedStepInfo}>
              Step {step} of 4: <span>{STEPS.find(s => s.id === step)?.label}</span>
            </div>
          </div>
        </div>

        {/* ── MAIN FULL-WIDTH FORM CONTENT ── */}
        <div className={styles.fullFormContainer}>
          {/* ══════════════ STEP 1 ══════════════ */}
          {step === 1 && (
          <div className={styles.stepContent}>
            {/* Step header */}
            <div className={styles.stepHeader}>
              <div>
                <h2 className={styles.stepTitle}>Step 1: Registration Details</h2>
                <p className={styles.stepDesc}>Submit your details for registration. This is a <strong>NO OBLIGATION, NO PAYMENT</strong> step.</p>
              </div>
              <button className={styles.resetBtn} onClick={reset}>↺ Reset Form</button>
            </div>

            <div className={styles.infoBanner}>
              <span className={styles.infoBannerCheck}>✓</span>
              Includes account setup for <strong>FREE Baseline Assessment</strong> and free weekly tests.
            </div>

            {/* Two column grid */}
            <div className={styles.formGrid}>

              {/* ── LEFT: Student & Parent ── */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.cardIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>Student &amp; Parent Details</h3>
                    <p className={styles.cardSub}>Enter your information below</p>
                  </div>
                </div>

                <p className={styles.sectionLabel}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                  Student Information
                </p>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>First Name <span className={styles.req}>*</span></label>
                    <input id="reg-firstName" name="firstName" value={form.firstName} onChange={set} placeholder="e.g. Sarah" className={errors.firstName ? styles.err : ""} />
                    {errors.firstName && <span className={styles.errMsg}>{errors.firstName}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Surname <span className={styles.req}>*</span></label>
                    <input id="reg-surname" name="surname" value={form.surname} onChange={set} placeholder="e.g. Johnson" className={errors.surname ? styles.err : ""} />
                    {errors.surname && <span className={styles.errMsg}>{errors.surname}</span>}
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Academic Session <span className={styles.req}>*</span>
                    </label>
                    <select id="reg-session" name="academicSession" value={form.academicSession} onChange={set} className={errors.academicSession ? styles.err : ""}>
                      <option value="">2026-2027</option>
                      {ACADEMIC_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.academicSession && <span className={styles.errMsg}>{errors.academicSession}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      School Year (in September 2026) <span className={styles.req}>*</span>
                    </label>
                    <select id="reg-year" name="schoolYear" value={form.schoolYear} onChange={set} className={errors.schoolYear ? styles.err : ""}>
                      <option value="">Select year</option>
                      {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors.schoolYear && <span className={styles.errMsg}>{errors.schoolYear}</span>}
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Gender <span className={styles.req}>*</span></label>
                    <div className={styles.radioRow}>
                      <label className={styles.radioOpt}><input type="radio" name="gender" value="Male" checked={form.gender === "Male"} onChange={set}/> Male</label>
                      <label className={styles.radioOpt}><input type="radio" name="gender" value="Female" checked={form.gender === "Female"} onChange={set}/> Female</label>
                    </div>
                    {errors.gender && <span className={styles.errMsg}>{errors.gender}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Date of Birth <span className={styles.req}>*</span></label>
                    <input 
                      id="reg-dob" 
                      type="date" 
                      name="dob" 
                      value={form.dob} 
                      onChange={set} 
                      className={errors.dob ? styles.err : ""} 
                    />
                    {errors.dob ? (
                      <div className={styles.dobErrorMessage}>
                        <span className={styles.dobErrorIcon}>!</span>
                        <span>{errors.dob}</span>
                      </div>
                    ) : (
                      <small className={styles.hint}>Please select a school year first to see eligible date ranges</small>
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Current School <span className={styles.req}>*</span></label>
                  <input id="reg-school" name="currentSchool" value={form.currentSchool} onChange={set} className={errors.currentSchool ? styles.err : ""} />
                  {errors.currentSchool && <span className={styles.errMsg}>{errors.currentSchool}</span>}
                </div>

                {/* Parent */}
                <p className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  Parent Information
                </p>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Parent{"'"}s First Name <span className={styles.req}>*</span></label>
                    <input id="reg-parentFirst" name="parentFirstName" value={form.parentFirstName} onChange={set} className={errors.parentFirstName ? styles.err : ""} />
                    {errors.parentFirstName && <span className={styles.errMsg}>{errors.parentFirstName}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Parent{"'"}s Surname <span className={styles.req}>*</span></label>
                    <input id="reg-parentSurname" name="parentSurname" value={form.parentSurname} onChange={set} className={errors.parentSurname ? styles.err : ""} />
                    {errors.parentSurname && <span className={styles.errMsg}>{errors.parentSurname}</span>}
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Primary Email <span className={styles.req}>*</span></label>
                    <input 
                      id="reg-email" 
                      type="email" 
                      name="primaryEmail" 
                      value={form.primaryEmail} 
                      onChange={set} 
                      onBlur={() => checkEmailAndStudentDuplicate(form.primaryEmail, form.firstName, form.surname)}
                      placeholder="parent@example.com"
                      className={errors.primaryEmail ? styles.err : ""} 
                    />
                    {errors.primaryEmail && <span className={styles.errMsg}>{errors.primaryEmail}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Secondary Email</label>
                    <input id="reg-email2" type="email" name="secondaryEmail" value={form.secondaryEmail} onChange={set} placeholder="Optional secondary email" />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Mobile Number <span className={styles.req}>*</span></label>
                  <input id="reg-mobile" name="mobile" value={form.mobile} onChange={set} placeholder="07xxxxxxxx or +44xxxxxxxxx" className={errors.mobile ? styles.err : ""} />
                  {errors.mobile && <span className={styles.errMsg}>{errors.mobile}</span>}
                </div>

                <div className={styles.field}>
                  <label>Address</label>
                  <textarea id="reg-address" name="address" value={form.address} onChange={set} rows={3} />
                </div>
              </div>

              {/* ── RIGHT: Course Selection ── */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={[styles.cardIcon, styles.cardIconBook].join(" ")}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>Course Selection</h3>
                    <p className={styles.cardSub}>Choose your perfect 11+ program</p>
                  </div>
                </div>

                {/* ── Course Section Header ── */}
                <div 
                  className={styles.schoolSectionHeader}
                  onClick={() => setIsCourseDropdownOpen(prev => !prev)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.courseBookIcon}>
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <span>Course</span>
                  <span className={styles.req}>*</span>
                </div>

                <div className={styles.customDropdownWrapper} ref={courseDropdownRef}>
                  {/* Select Box Trigger - Clickable anytime (Unlocked) */}
                  <button
                    id="reg-course"
                    type="button"
                    className={`${styles.customSelectTrigger} ${isCourseDropdownOpen ? styles.customSelectTriggerActive : ""} ${errors.course ? styles.err : ""}`}
                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                  >
                    <div className={styles.customSelectLeft}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.selectBookIcon}>
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      <span className={form.course ? styles.customSelectValue : styles.customSelectPlaceholder}>
                        {form.course || "Select Course (11+ Primary, GCSE, Assessment)"}
                      </span>
                    </div>
                    <svg className={styles.selectRightChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Grouped Course Dropdown Menu */}
                  {isCourseDropdownOpen && (
                    <div className={styles.customDropdownMenu}>
                      <div className={styles.customDropdownScrollArea}>
                        {ALL_COURSE_CATEGORIES.map((cat) => (
                          <div key={cat.category} className={styles.dropdownRegionGroup}>
                            <div className={styles.dropdownRegionHeader}>{cat.category}</div>
                            {cat.courses.map((item) => {
                              const isSelected = form.course === item.name;
                              return (
                                <button
                                  key={item.name}
                                  type="button"
                                  className={`${styles.dropdownOptionItem} ${isSelected ? styles.dropdownOptionSelected : ""}`}
                                  onClick={() => handleSelectCourse(item.name)}
                                >
                                  <span>{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.course && <span className={styles.errMsg}>{errors.course}</span>}
                </div>

                {form.course && (
                  <div className={styles.courseInfoBox}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    You can view the information pack in a popup on the next page for full details of all course variants.
                  </div>
                )}
                <p className={styles.hintText}>Select a course to see delivery options and add-ons.</p>

                {/* ── Primary Target School Header ── */}
                <div 
                  className={styles.schoolSectionHeader} 
                  style={{ marginTop: "1.75rem" }}
                  onClick={() => setIsSchoolDropdownOpen(prev => !prev)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.schoolGradCap}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  <span>Primary Target School</span>
                </div>

                <div className={styles.customDropdownWrapper} ref={schoolDropdownRef}>
                  {/* Select Box Trigger */}
                  <button
                    type="button"
                    className={`${styles.customSelectTrigger} ${isSchoolDropdownOpen ? styles.customSelectTriggerActive : ""}`}
                    onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                  >
                    <div className={styles.customSelectLeft}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.selectCapIcon}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      <span className={form.targetSchool ? styles.customSelectValue : styles.customSelectPlaceholder}>
                        {form.targetSchool || "Select One"}
                      </span>
                    </div>
                  </button>

                  {/* Grouped School Dropdown Menu */}
                  {isSchoolDropdownOpen && (
                    <div className={styles.customDropdownMenu}>
                      <div className={styles.customDropdownScrollArea}>
                        {TARGET_SCHOOLS_BY_REGION.map((group) => (
                          <div key={group.region} className={styles.dropdownRegionGroup}>
                            <div className={styles.dropdownRegionHeader}>{group.region}</div>
                            {group.schools.map((school) => {
                              const isSelected = form.targetSchool === school;
                              return (
                                <button
                                  key={school}
                                  type="button"
                                  className={`${styles.dropdownOptionItem} ${isSelected ? styles.dropdownOptionSelected : ""}`}
                                  onClick={() => {
                                    setForm((prev) => ({ ...prev, targetSchool: school }));
                                    setIsSchoolDropdownOpen(false);
                                  }}
                                >
                                  <span>{school}</span>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className={styles.dropdownBottomChevron}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                <p className={styles.hintText}>
                  This is to share relevant information and offers. You can add up to five target schools once your account is setup.
                </p>

                {/* ── 1. Choose Your Learning Style (Revealed once Course is selected) ── */}
                {form.course && (
                  <div className={styles.learningStyleSection} style={{ marginTop: "1.75rem" }}>
                    <div className={styles.learningStyleHeader}>
                      <span className={styles.lightningIcon}>⚡</span>
                      <span className={styles.learningStyleTitle}>Choose Your Learning Style</span>
                      <span className={styles.req}>*</span>
                    </div>

                    {/* Learning Style Grid: Year 3 has 2 modes (Classroom, DIY), others have 3 modes */}
                    <div className={styles.learningStyleGrid}>
                      {/* Card 1: Classroom */}
                      <div 
                        className={`${styles.styleCard} ${form.learningStyle === "Classroom" ? styles.styleCardActive : ""}`}
                        onClick={() => {
                          setForm(p => ({ 
                            ...p, 
                            learningStyle: "Classroom",
                            centreLocation: "",
                            preferredDay: "",
                            preferredSession: "",
                          }));
                          setErrors(p => ({ ...p, learningStyle: "", centreLocation: "", preferredDay: "", preferredSession: "" }));
                        }}
                      >
                        <div className={styles.cardRadioWrap}>
                          <div className={`${styles.radioOuter} ${form.learningStyle === "Classroom" ? styles.radioOuterActive : ""}`}>
                            {form.learningStyle === "Classroom" && <div className={styles.radioInnerDot} />}
                          </div>
                        </div>
                        <div className={`${styles.cardIconBox} ${form.learningStyle === "Classroom" ? styles.cardIconBoxActive : styles.cardIconBoxInactive}`}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={form.learningStyle === "Classroom" ? "#ffffff" : "#0284c7"} strokeWidth="2.2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        </div>
                        <div className={`${styles.styleCardTitle} ${form.learningStyle === "Classroom" ? styles.styleTitleActive : ""}`}>
                          Classroom <span className={styles.goldStar}>★</span>
                        </div>
                        <div className={styles.styleCardSub}>In-person tuition centre</div>
                      </div>

                      {/* Card 2: Online Live (Hidden for Year 3 / Year 2 as per requirement) */}
                      {!((form.course || form.schoolYear).includes("Year 3") || (form.course || form.schoolYear).includes("Year 2")) && (
                        <div 
                          className={`${styles.styleCard} ${form.learningStyle === "Online Live" ? styles.styleCardActive : ""}`}
                          onClick={() => {
                            setForm(p => ({ 
                              ...p, 
                              learningStyle: "Online Live",
                              centreLocation: "",
                              preferredDay: "Saturday",
                              preferredSession: "Morning Batch (9:30 AM – 12:00 PM)",
                            }));
                            setErrors(p => ({ ...p, learningStyle: "", centreLocation: "", preferredDay: "", preferredSession: "" }));
                          }}
                        >
                          <div className={styles.cardRadioWrap}>
                            <div className={`${styles.radioOuter} ${form.learningStyle === "Online Live" ? styles.radioOuterActive : ""}`}>
                              {form.learningStyle === "Online Live" && <div className={styles.radioInnerDot} />}
                            </div>
                          </div>
                          <div className={`${styles.cardIconBox} ${form.learningStyle === "Online Live" ? styles.cardIconBoxActive : styles.cardIconBoxInactive}`}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={form.learningStyle === "Online Live" ? "#ffffff" : "#0284c7"} strokeWidth="2.2">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                              <line x1="8" y1="21" x2="16" y2="21"/>
                              <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                          </div>
                          <div className={`${styles.styleCardTitle} ${form.learningStyle === "Online Live" ? styles.styleTitleActive : ""}`}>
                            Online Live
                          </div>
                          <div className={styles.styleCardSub}>Interactive virtual class</div>
                        </div>
                      )}

                      {/* Card 3: DIY */}
                      <div 
                        className={`${styles.styleCard} ${form.learningStyle === "DIY" ? styles.styleCardActive : ""}`}
                        onClick={() => {
                          setForm(p => ({ 
                            ...p, 
                            learningStyle: "DIY",
                            centreLocation: "",
                            preferredDay: "",
                            preferredSession: "",
                          }));
                          setErrors(p => ({ ...p, learningStyle: "", centreLocation: "", preferredDay: "", preferredSession: "" }));
                        }}
                      >
                        <div className={styles.cardRadioWrap}>
                          <div className={`${styles.radioOuter} ${form.learningStyle === "DIY" ? styles.radioOuterActive : ""}`}>
                            {form.learningStyle === "DIY" && <div className={styles.radioInnerDot} />}
                          </div>
                        </div>
                        <div className={`${styles.cardIconBox} ${form.learningStyle === "DIY" ? styles.cardIconBoxActive : styles.cardIconBoxInactive}`}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={form.learningStyle === "DIY" ? "#ffffff" : "#0284c7"} strokeWidth="2.2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                            <line x1="9" y1="7" x2="15" y2="7"/>
                            <line x1="9" y1="11" x2="13" y2="11"/>
                          </svg>
                        </div>
                        <div className={`${styles.styleCardTitle} ${form.learningStyle === "DIY" ? styles.styleTitleActive : ""}`}>
                          DIY
                        </div>
                        <div className={styles.styleCardSub}>Self-paced study & tests</div>
                      </div>
                    </div>
                    {errors.learningStyle && <span className={styles.errMsg}>{errors.learningStyle}</span>}

                    {/* ── 2. Choose Location (Revealed ONLY when Classroom mode is selected) ── */}
                    {form.learningStyle === "Classroom" && (
                      <div className={styles.locationSectionWrap}>
                        {/* Choose Location Dropdown */}
                        <div className={styles.cleanFieldGroup}>
                          <label className={styles.cleanFieldLabel}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>Choose Location / Centre</span>
                            <span className={styles.req}>*</span>
                          </label>
                          <div className={styles.cleanSelectBoxWrap}>
                            <svg className={styles.selectLeftIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <select 
                              name="centreLocation" 
                              value={form.centreLocation} 
                              onChange={(e) => {
                                setForm(p => ({ ...p, centreLocation: e.target.value, preferredDay: "", preferredSession: "" }));
                                setErrors(p => ({ ...p, centreLocation: "", preferredDay: "", preferredSession: "" }));
                              }}
                              className={`${styles.cleanSelectInput} ${errors.centreLocation ? styles.err : ""}`}
                            >
                              <option value="">-- Choose Tuition Centre / Location --</option>
                              {availableLocations.filter(loc => !loc.city.toLowerCase().includes('online')).map(loc => (
                                <option key={loc.city} value={loc.city}>
                                  {loc.city} ({loc.centreName})
                                </option>
                              ))}
                            </select>
                            <svg className={styles.selectRightChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          {errors.centreLocation && <span className={styles.errMsg}>{errors.centreLocation}</span>}
                        </div>

                        {/* ── 3. Preferred Day & Preferred Session (Revealed ONLY after Location is chosen) ── */}
                        {form.centreLocation && (
                          <div className={styles.cleanTwoColRow}>
                            {/* Preferred Day */}
                            <div className={styles.cleanFieldGroup}>
                              <label className={styles.cleanFieldLabel}>
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Preferred Day</span>
                                <span className={styles.req}>*</span>
                              </label>
                              <div className={styles.cleanSelectBoxWrap}>
                                <svg className={styles.selectLeftIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <select 
                                  name="preferredDay" 
                                  value={form.preferredDay} 
                                  onChange={(e) => {
                                    setForm(p => ({ ...p, preferredDay: e.target.value, preferredSession: "" }));
                                    setErrors(p => ({ ...p, preferredDay: "", preferredSession: "" }));
                                  }}
                                  className={`${styles.cleanSelectInput} ${errors.preferredDay ? styles.err : ""}`}
                                >
                                  <option value="">-- Select Preferred Day --</option>
                                  {availableDays.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                                <svg className={styles.selectRightChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                              {errors.preferredDay && <span className={styles.errMsg}>{errors.preferredDay}</span>}
                            </div>

                            {/* Preferred Session */}
                            <div className={styles.cleanFieldGroup}>
                              <label className={styles.cleanFieldLabel}>
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Preferred Session</span>
                                <span className={styles.req}>*</span>
                              </label>
                              <div className={styles.cleanSelectBoxWrap}>
                                <svg className={styles.selectLeftIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <select 
                                  name="preferredSession" 
                                  value={form.preferredSession} 
                                  onChange={(e) => {
                                    setForm(p => ({ ...p, preferredSession: e.target.value }));
                                    setErrors(p => ({ ...p, preferredSession: "" }));
                                  }}
                                  disabled={!form.preferredDay}
                                  className={`${styles.cleanSelectInput} ${errors.preferredSession ? styles.err : ""}`}
                                >
                                  {!form.preferredDay ? (
                                    <option value="">Choose Preferred Day first</option>
                                  ) : (
                                    <>
                                      <option value="">-- Select Timing Session --</option>
                                      {availableSessions.map(s => {
                                        const val = typeof s === 'object' ? s.value : s;
                                        const lbl = typeof s === 'object' ? s.label : s;
                                        return (
                                          <option key={val} value={val}>
                                            {lbl}
                                          </option>
                                        );
                                      })}
                                    </>
                                  )}
                                </select>
                                <svg className={styles.selectRightChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                              {errors.preferredSession && <span className={styles.errMsg}>{errors.preferredSession}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Sub-Options for Online Live ── */}
                    {form.learningStyle === "Online Live" && (
                      <div className={styles.deliverySubOptionsBox}>
                        <div className={styles.row2}>
                          <div className={styles.field}>
                            <label>
                              <span className={styles.fieldIcon}>📅</span>
                              Preferred Live Day <span className={styles.req}>*</span>
                            </label>
                            <select 
                              name="preferredDay" 
                              value={form.preferredDay} 
                              onChange={set}
                              className={errors.preferredDay ? styles.err : ""}
                            >
                              <option value="Saturday">Saturday</option>
                              <option value="Sunday">Sunday</option>
                              <option value="Weekday Evening (Mon - Thu)">Weekday Evening (Mon - Thu)</option>
                            </select>
                            {errors.preferredDay && <span className={styles.errMsg}>{errors.preferredDay}</span>}
                          </div>

                          <div className={styles.field}>
                            <label>
                              <span className={styles.fieldIcon}>⏰</span>
                              Preferred Live Batch <span className={styles.req}>*</span>
                            </label>
                            <select 
                              name="preferredSession" 
                              value={form.preferredSession} 
                              onChange={set}
                              className={errors.preferredSession ? styles.err : ""}
                            >
                              <option value="Morning Batch (9:30 AM – 12:00 PM)">Morning Batch (9:30 AM – 12:00 PM)</option>
                              <option value="Evening Batch (5:00 PM – 7:30 PM)">Evening Batch (5:00 PM – 7:30 PM)</option>
                            </select>
                            {errors.preferredSession && <span className={styles.errMsg}>{errors.preferredSession}</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Info Banner for DIY ── */}
                    {form.learningStyle === "DIY" && (
                      <div className={styles.diyInfoBox}>
                        <span>💡</span>
                        <div>
                          <strong>Self-Paced Digital Access:</strong> Includes 24/7 video lesson bank, downloadable topic worksheets, weekly timed homework tests, and automated instant scorecard reporting.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 11+ Writing Add-on Options Box ── */}
                <div className={styles.addonBox}>
                  <div className={styles.addonHeaderRow}>
                    <div className={styles.addonTitleWrap}>
                      <span className={styles.addonIcon}>✨</span>
                      <span className={styles.addonTitle}>11+ Writing Add-on options — Pick One</span>
                      <span className={styles.remotePill}>Remote</span>
                    </div>
                    <span className={styles.saveBadge}>Save 20% when booking with main course</span>
                  </div>

                  {/* Skip main course toggle */}
                  <div className={styles.skipToggleRow}>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={form.skipMainCourse} 
                        onChange={(e) => setForm(p => ({ ...p, skipMainCourse: e.target.checked }))}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                    <span className={styles.skipLabel}>Skip the main course</span>
                  </div>

                  {/* Addon Choice Options */}
                  <div className={styles.addonOptionsGrid}>
                    {[
                      { id: "full", title: "Full 11+ Writing Course", desc: "Comprehensive creative & persuasive writing skills with weekly live feedback.", price: "£24 / wk" },
                      { id: "creative", title: "Creative Writing Mastery", desc: "Focus on narrative storytelling, vocabulary and descriptive structure.", price: "£18 / wk" },
                    ].map((addon) => (
                      <label 
                        key={addon.id} 
                        className={`${styles.addonRadioCard} ${form.writingAddon === addon.title ? styles.addonCardSelected : ""}`}
                      >
                        <input 
                          type="radio" 
                          name="writingAddon" 
                          value={addon.title} 
                          checked={form.writingAddon === addon.title}
                          onChange={(e) => setForm(p => ({ ...p, writingAddon: e.target.value }))}
                          className={styles.addonRadio}
                        />
                        <div className={styles.addonCardContent}>
                          <div className={styles.addonCardTop}>
                            <strong>{addon.title}</strong>
                            <span className={styles.addonPrice}>{addon.price}</span>
                          </div>
                          <p>{addon.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* What you get */}
                <div className={styles.benefitBox}>
                  <p className={styles.benefitTitle}>Included with your free registration:</p>
                  <ul className={styles.benefitList}>
                    {[
                      "Free Baseline Assessment",
                      "Personalised learning report",
                      "Weekly practice tests access",
                      "Course information pack",
                      "No payment required at this stage",
                    ].map(b => (
                      <li key={b}>
                        <span className={styles.benefitCheck}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Consent */}
            <div className={styles.consentRow}>
              <label className={styles.consentLabel}>
                <input id="reg-consent" type="checkbox" name="consent" checked={form.consent} onChange={set} />
                <span>
                  I consent to being contacted by XL Education regarding this registration and future course information.
                  Your information will be used in accordance with our{" "}
                  <a href="#" className={styles.link}>privacy policy</a>.
                </span>
              </label>
              {errors.consent && <span className={styles.errMsg}>{errors.consent}</span>}
            </div>

            {duplicateError && (
              <div className={styles.duplicateAlert}>
                <div className={styles.duplicateAlertContent}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <strong className={styles.duplicateAlertTitle}>Already Registered!</strong>
                    <p className={styles.duplicateAlertText}>{duplicateError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.loginRedirectBtn}
                  onClick={() => navigate('/login/student')}
                >
                  Go to Login →
                </button>
              </div>
            )}

            <div className={styles.submitRow}>
              {/* ── 2-Second Flash Alert Banner (Only shown when field is missed) ── */}
              {missingToastMsg && (
                <div className={styles.flashToastBanner}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{missingToastMsg}</span>
                </div>
              )}

              <button
                id="reg-submit-btn"
                className={styles.submitBtn}
                onClick={next}
                disabled={isCheckingDuplicate}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {isCheckingDuplicate ? "Verifying..." : "Proceed to Review"}
              </button>
              <p className={styles.noObligation}>This is a no-obligation registration. You can review all details before confirming.</p>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 2: REVIEW & CONFIRM ══════════════ */}
        {step === 2 && (
          <div className={styles.stepContent}>
            {/* Step Header */}
            <div className={styles.stepHeader}>
              <div>
                <h2 className={styles.stepTitle}>Step 2: Review &amp; Confirm</h2>
                <p className={styles.stepDesc}>
                  Review fee breakdown, course highlights and information pack with course calendar. Confirm details and review T&amp;Cs before proceeding to payment.
                </p>
              </div>
            </div>

            {/* ── TOP SUMMARY CARD: REGISTRATION DETAILS ── */}
            <div className={styles.reviewDetailsCard}>
              <div className={styles.reviewDetailsHead}>
                <div className={styles.reviewDetailsTitleWrap}>
                  <div className={styles.reviewDetailsAvatar}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <h3 className={styles.reviewDetailsTitle}>Registration Details</h3>
                </div>
                <button className={styles.editBtn} onClick={() => setStep(1)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span>Edit</span>
                </button>
              </div>

              <div className={styles.reviewDetailsGrid}>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Student</span>
                  <strong className={styles.detailValue}>{form.firstName || "Md"} {form.surname || "Rashid"}</strong>
                </div>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Year</span>
                  <strong className={styles.detailValue}>{form.schoolYear || "Year 5"}</strong>
                </div>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Parent</span>
                  <strong className={styles.detailValue}>{form.parentFirstName || "Md"} {form.parentSurname || "Ali"}</strong>
                </div>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Phone</span>
                  <strong className={styles.detailValue}>{form.mobile || "9771648972"}</strong>
                </div>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Email</span>
                  <strong className={styles.detailValue}>{form.primaryEmail || "mrrashidsaikh0365@gmail.com"}</strong>
                </div>
                <div className={styles.reviewDetailItem}>
                  <span className={styles.detailLabel}>Current School</span>
                  <strong className={styles.detailValue}>{form.currentSchool || "Aman Academy"}</strong>
                </div>
              </div>
            </div>

            {/* ── 3-COLUMN MAIN REVIEW GRID ── */}
            <div className={styles.reviewThreeColGrid}>

              {/* ── COLUMN 1: MAIN COURSE (Blue Theme) ── */}
              <div className={styles.reviewCourseCol}>
                <div className={styles.reviewColCard}>
                  <div className={styles.colCardHead}>
                    <div className={styles.colCardTitleWrap}>
                      <span className={styles.blueBookIcon}>📖</span>
                      <h4 className={styles.colCardTitle}>Main Course</h4>
                    </div>
                    <button 
                      type="button" 
                      className={styles.infoPackBtn} 
                      onClick={() => { setInfoPackTitle("Main Course Information Pack"); setIsInfoPackOpen(true); }}
                    >
                      <span>ℹ Info Pack</span>
                    </button>
                  </div>

                  <div className={styles.datePickerWrap}>
                    <label className={styles.datePickerLabel}>📅 Course Start Date</label>
                    <select 
                      className={styles.dateSelect} 
                      value={mainStartDate} 
                      onChange={(e) => setMainStartDate(e.target.value)}
                    >
                      <option>13 Sept 2026 – Sunday</option>
                      <option>20 Sept 2026 – Sunday</option>
                      <option>27 Sept 2026 – Sunday</option>
                    </select>
                  </div>

                  <div className={styles.blueInnerCard}>
                    <div className={styles.innerCardHead}>
                      <h5 className={styles.innerCourseName}>{form.course || "Year 5 – 11+ Preparation"}</h5>
                      <span className={styles.cardSchedule}>
                        {form.learningStyle === "DIY" 
                          ? "Self-Paced Digital Access" 
                          : `${form.preferredDay || "Saturday"} · ${form.preferredSession || "Morning"}`}
                      </span>
                      <span className={styles.onlineBadge}>
                        {form.learningStyle === "Classroom" 
                          ? `🏫 ${form.centreLocation || "Classroom"}` 
                          : form.learningStyle === "DIY" 
                          ? "💻 DIY Portal" 
                          : "🌐 Online Live"}
                      </span>
                    </div>

                    <div className={styles.innerFeeSection}>
                      <div className={styles.feeSectionTitleRow}>
                        <span className={styles.feeIconSmall}>📖</span>
                        <span className={styles.feeSectionTitle}>Course Fee Breakdown</span>
                      </div>
                      <div className={styles.feeTotalRow}>
                        <span>Total Course Fee</span>
                        <strong>£3050</strong>
                      </div>
                    </div>

                    <div className={styles.paymentScheduleSection}>
                      <h6 className={styles.scheduleSectionTitle}>Payment Schedule</h6>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Registration Fee</span>
                          <span className={styles.scheduleSub}>Due now to secure your place</span>
                        </div>
                        <strong className={styles.schedulePrice}>£250</strong>
                      </div>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Monthly Installments</span>
                          <span className={styles.scheduleSub}>Starting from 01-10-2026</span>
                        </div>
                        <strong className={styles.schedulePrice}>£280</strong>
                      </div>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Remaining Fee</span>
                          <span className={styles.scheduleSub}>£280 × 10 months</span>
                        </div>
                        <strong className={styles.schedulePrice}>£2800</strong>
                      </div>
                    </div>

                    <div className={styles.whatsIncludedSection}>
                      <h6 className={styles.includedTitle}>What's Included</h6>
                      <ul className={styles.includedList}>
                        <li><span className={styles.blueCheck}>✓</span> Free baseline assessment with clear insights</li>
                        <li><span className={styles.blueCheck}>✓</span> Weekly tests with focus session follow-up</li>
                        <li><span className={styles.blueCheck}>✓</span> Structured tuition in Maths, English, VR and NVR</li>
                        <li><span className={styles.blueCheck}>✓</span> All course materials included</li>
                        <li><span className={styles.blueCheck}>✓</span> 10 scheduled mock exams with tracking</li>
                        <li><span className={styles.blueCheck}>✓</span> Adaptive personalised tests for targeted improvement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COLUMN 2: COURSE ADD-ONS (Orange Theme) ── */}
              <div className={styles.reviewCourseCol}>
                <div className={styles.reviewColCard}>
                  <div className={styles.colCardHead}>
                    <div className={styles.colCardTitleWrap}>
                      <span className={styles.orangeSparkleIcon}>✨</span>
                      <h4 className={styles.colCardTitle}>Course Add-ons</h4>
                    </div>
                    <button 
                      type="button" 
                      className={styles.infoPackBtn} 
                      onClick={() => { setInfoPackTitle("11+ Creativity Add-on Information Pack"); setIsInfoPackOpen(true); }}
                    >
                      <span>ℹ Info Pack</span>
                    </button>
                  </div>

                  <div className={styles.datePickerWrap}>
                    <label className={styles.datePickerLabel}>📅 Add-on Start Date</label>
                    <select 
                      className={styles.dateSelect} 
                      value={addonStartDate} 
                      onChange={(e) => setAddonStartDate(e.target.value)}
                    >
                      <option>05 Oct 2026 – Monday</option>
                      <option>12 Oct 2026 – Monday</option>
                      <option>19 Oct 2026 – Monday</option>
                    </select>
                  </div>

                  <div className={styles.orangeInnerCard}>
                    <div className={styles.innerCardHead}>
                      <h5 className={styles.innerAddonName}>{form.writingAddon || "11+ Creativity"}</h5>
                      <span className={styles.cardSchedule}>Tuesday 18:00–19:00</span>
                      <span className={styles.remoteBadge}>🌐 Remote</span>
                    </div>

                    <div className={styles.innerFeeSection}>
                      <div className={styles.feeSectionTitleRow}>
                        <span className={styles.feeIconSmall}>✨</span>
                        <span className={styles.feeSectionTitle}>Add-on Fee Breakdown</span>
                      </div>
                      <div className={styles.feeSubRow}>
                        <span>Original Add-on Fee</span>
                        <span>£950</span>
                      </div>
                      <div className={`${styles.feeSubRow} ${styles.discountHighlight}`}>
                        <span>Bundle Discount (20%)</span>
                        <span>-£190</span>
                      </div>
                      <div className={styles.feeTotalRow}>
                        <span>Revised Add-on Fee</span>
                        <strong className={styles.orangeText}>£760</strong>
                      </div>
                    </div>

                    <div className={styles.paymentScheduleSection}>
                      <h6 className={styles.scheduleSectionTitle}>Payment Schedule</h6>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Add-on Registration</span>
                          <span className={styles.scheduleSub}>Due now with course registration</span>
                        </div>
                        <strong className={styles.schedulePrice}>£200</strong>
                      </div>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Monthly Installments</span>
                          <span className={styles.scheduleSub}>Starting from 01-11-2026</span>
                        </div>
                        <strong className={styles.schedulePrice}>£62</strong>
                      </div>
                      <div className={styles.scheduleRow}>
                        <div>
                          <span className={styles.scheduleItemName}>Remaining Fee</span>
                          <span className={styles.scheduleSub}>£62 × 9 months</span>
                        </div>
                        <strong className={styles.schedulePrice}>£558</strong>
                      </div>
                    </div>

                    <div className={styles.whatsIncludedSection}>
                      <h6 className={styles.includedTitle}>What's Included</h6>
                      <ul className={styles.includedList}>
                        <li><span className={styles.orangeCheck}>✓</span> Weekly guided writing sessions</li>
                        <li><span className={styles.orangeCheck}>✓</span> Structured homework with targeted assignments</li>
                        <li><span className={styles.orangeCheck}>✓</span> Scoring and detailed feedback</li>
                        <li><span className={styles.orangeCheck}>✓</span> Techniques for planning, structuring, and improving writing</li>
                        <li><span className={styles.orangeCheck}>✓</span> Individual feedback to refine ideas, vocabulary, and style</li>
                        <li><span className={styles.orangeCheck}>✓</span> Progress tracking across key writing skills and assessment areas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COLUMN 3: SUMMARY, AGREEMENT & ACTIONS (Right Column) ── */}
              <div className={styles.reviewSummaryCol}>

                {/* 1. Total Summary Card */}
                <div className={styles.totalSummaryCard}>
                  <div className={styles.summaryCardHead}>
                    <span className={styles.summaryIcon}>📋</span>
                    <h4 className={styles.summaryCardTitle}>Total Summary</h4>
                  </div>

                  <div className={styles.summaryBlock}>
                    <div className={styles.summaryCategory}>MAIN COURSE</div>
                    <div className={styles.summaryRow}>
                      <span>Course Fee</span>
                      <strong className={styles.blueText}>£3050</strong>
                    </div>
                  </div>

                  <div className={styles.summaryBlock}>
                    <div className={styles.summaryCategory}>11+ CREATIVITY</div>
                    <div className={styles.summaryRowSmall}>
                      <span>Original Fee</span>
                      <span>£950</span>
                    </div>
                    <div className={`${styles.summaryRowSmall} ${styles.discountText}`}>
                      <span>Bundle Discount (20%)</span>
                      <span>-£190</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Revised Fee</span>
                      <strong className={styles.orangeText}>£760</strong>
                    </div>
                  </div>

                  <div className={styles.totalFeeHighlight}>
                    <div className={styles.totalFeeMain}>
                      <span>Total Fee</span>
                      <strong>£3810</strong>
                    </div>
                    <span className={styles.vatNote}>Includes VAT of £635</span>
                  </div>

                  <div className={styles.summaryBreakdown}>
                    <div className={styles.summaryBreakRow}>
                      <span>Course Registration</span>
                      <span>£250</span>
                    </div>
                    <div className={styles.summaryBreakRow}>
                      <span>Add-on Registration</span>
                      <span>£200</span>
                    </div>
                    <div className={`${styles.summaryBreakRow} ${styles.payableNowRow}`}>
                      <strong>Payable Now</strong>
                      <strong>£450</strong>
                    </div>
                    <div className={styles.summaryBreakRow}>
                      <span>Remaining (monthly installments)</span>
                      <span>£3360</span>
                    </div>
                  </div>

                  <div className={styles.nonRefundableAlert}>
                    <span className={styles.alertIcon}>ℹ</span>
                    <span>Registration fee is non-refundable and forms part of the course fee.</span>
                  </div>
                </div>

                {/* 2. Agreement Card */}
                <div className={styles.agreementCard}>
                  <div className={styles.agreementHead}>
                    <span className={styles.shieldIcon}>🛡️</span>
                    <h4 className={styles.agreementTitle}>Agreement</h4>
                  </div>

                  <div className={styles.agreementNoticeBox}>
                    <span className={styles.noticeIcon}>ℹ</span>
                    <p>
                      The final step is the registration fee payment to secure your place on the course. Please confirm the above details and go through the Terms &amp; Conditions.
                    </p>
                  </div>

                  <div className={styles.agreementCheckboxes}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={confirmCorrect} 
                        onChange={(e) => setConfirmCorrect(e.target.checked)} 
                      />
                      <span>I hereby confirm that the details above are correct</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={agreeTerms} 
                        onChange={(e) => setAgreeTerms(e.target.checked)} 
                      />
                      <span>
                        I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setInfoPackTitle("Terms & Conditions"); setIsInfoPackOpen(true); }}>Terms and Conditions</a> and acknowledge that I have read the course information pack.
                      </span>
                    </label>
                    <span className={styles.checkboxHint}>Please open and review the Terms and Conditions to enable this checkbox.</span>
                  </div>
                </div>

                {/* 3. Next Steps Card */}
                <div className={styles.nextStepsCard}>
                  <div className={styles.nextStepsHead}>
                    <span className={styles.nextStepsIcon}>📋</span>
                    <h4 className={styles.nextStepsTitle}>Next Steps</h4>
                  </div>

                  <div className={styles.nextStepsNotice}>
                    <span className={styles.noticeDot}>ℹ</span>
                    <span>Please confirm that your details are correct.</span>
                  </div>

                  <button 
                    className={styles.proceedPaymentBtn} 
                    onClick={() => setStep(3)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span>Proceed to Payment</span>
                  </button>

                  <button 
                    className={styles.editDetailsBtnBottom} 
                    onClick={() => setStep(1)}
                  >
                    <span>← Edit Details</span>
                  </button>
                </div>

              </div>

            </div>

            {/* ── 4. BOTTOM FULL-WIDTH CARD: FSCE PREPARATION (Special Discount Card) ── */}
            <div className={styles.fsceCard}>
              <div className={styles.fsceHead}>
                <div className={styles.fsceTitleWrap}>
                  <span className={styles.greenStarIcon}>⭐</span>
                  <h4 className={styles.fsceTitle}>FSCE Preparation</h4>
                  <span className={styles.specialDiscountBadge}>SPECIAL DISCOUNT</span>
                </div>
                <button 
                  type="button" 
                  className={styles.infoPackBtn} 
                  onClick={() => { setInfoPackTitle("FSCE Preparation Information Pack"); setIsInfoPackOpen(true); }}
                >
                  <span>ℹ Info Pack</span>
                </button>
              </div>

              <div className={styles.fsceInnerCard}>
                <div className={styles.fsceInnerTop}>
                  <h5 className={styles.fsceCourseName}>Year 5 - FSCE KS2 Mastery</h5>
                  <p className={styles.fsceSubtitle}>
                    Specialised online test framework for FSCE exam preparation, designed to help students prepare for FSCE entrance examinations.
                  </p>
                </div>

                <div className={styles.fscePricingBlock}>
                  <div className={styles.pricingHead}>
                    <span className={styles.cardSmallIcon}>💳</span>
                    <strong>Pricing Details</strong>
                  </div>
                  <div className={styles.discountAvailableRow}>
                    <span>Discount Available</span>
                    <strong className={styles.blueCouponText}>50% OFF Coupon</strong>
                  </div>
                  <div className={styles.redeemBox}>
                    <div className={styles.redeemTitle}>✨ How to Redeem:</div>
                    <p className={styles.redeemText}>
                      Coupon code will be sent via email after successful registration. Book this add-on separately from the parent portal using your coupon code, or <a href="#" onClick={(e) => { e.preventDefault(); setInfoPackTitle("FSCE 50% Coupon Details"); setIsInfoPackOpen(true); }}>click here</a> to view details.
                    </p>
                  </div>
                </div>

                <div className={styles.fsceIncludedBlock}>
                  <h6 className={styles.fsceIncludedTitle}>What's Included</h6>
                  <ul className={styles.fsceIncludedList}>
                    <li><span className={styles.greenCheck}>✓</span> Comprehensive KS2 test framework across <strong>all 11 subjects</strong></li>
                    <li><span className={styles.greenCheck}>✓</span> Weekly <strong>creativity</strong> tasks with individual feedback</li>
                    <li><span className={styles.greenCheck}>✓</span> Daily topic tests in the final preparation phase</li>
                    <li><span className={styles.greenCheck}>✓</span> <strong>Adaptive</strong> tests for targeted improvement</li>
                    <li><span className={styles.greenCheck}>✓</span> Detailed <strong>progress tracking</strong> and performance analysis</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── INFORMATION PACK MODAL POPUP ── */}
        {isInfoPackOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsInfoPackOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div className={styles.modalTitleWrap}>
                  <span className={styles.modalIcon}>📘</span>
                  <h3>{infoPackTitle}</h3>
                </div>
                <button className={styles.modalCloseBtn} onClick={() => setIsInfoPackOpen(false)}>✕</button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalSection}>
                  <h4>📅 Academic Calendar &amp; Term Dates (2026/27)</h4>
                  <p>Classes run on designated weekends and weekday evenings according to the timetable.</p>
                  <ul className={styles.modalList}>
                    <li><strong>Autumn Term:</strong> 13 September 2026 – 13 December 2026</li>
                    <li><strong>Spring Term:</strong> 10 January 2027 – 28 March 2027</li>
                    <li><strong>Summer Term:</strong> 18 April 2027 – 18 July 2027</li>
                    <li><strong>Mock Exam Intensive:</strong> August 2027 (Pre-11+ Exam Season)</li>
                  </ul>
                </div>

                <div className={styles.modalSection}>
                  <h4>🎯 Curriculum &amp; Assessment Methodology</h4>
                  <p>Comprehensive coverage designed to match CEM, GL Assessment, CSSE, and independent school entrance standards with weekly progress reporting.</p>
                </div>

                <div className={styles.modalSection}>
                  <h4>🔒 Terms, Conditions &amp; Cancellation Policy</h4>
                  <p>Registration fees secure your student's place and are non-refundable. Monthly tuition payments are processed on the 1st of each month via direct debit or card payment.</p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.modalDoneBtn} 
                  onClick={() => { setAgreeTerms(true); setIsInfoPackOpen(false); }}
                >
                  ✓ I Have Reviewed the Information Pack
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 3: PAYMENT (RAZORPAY) ══════════════ */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <div>
                <h2 className={styles.stepTitle}>Step 3: Secure Your Place</h2>
                <p className={styles.stepDesc}>Complete your registration payment via Razorpay Payment Gateway.</p>
              </div>
            </div>

            <div className={styles.razorpayPayBox}>
              <div className={styles.razorpayBadge}>
                <span>🛡️</span>
                <span>256-Bit SSL Encrypted Payment</span>
              </div>

              <h3 className={styles.payTitle}>Official Enrollment Fee</h3>
              <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0.35rem 0 1rem" }}>
                Enrolling <strong>{form.firstName} {form.surname}</strong> for <strong>{form.course}</strong>
              </p>

              <div className={styles.razorpayAmountCard}>
                <div className={styles.razorpayAmountRow}>
                  <span>Course Registration Fee</span>
                  <strong style={{ color: "#0f172a" }}>₹49.00</strong>
                </div>
                <div className={styles.razorpayAmountRow}>
                  <span>GST &amp; Gateway Processing</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE / Included</span>
                </div>
                <div className={styles.razorpayTotalRow}>
                  <span>Total Amount Payable</span>
                  <span style={{ color: "#0284c7" }}>₹49.00</span>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className={styles.razorpayMethodsGrid}>
                <span className={styles.methodPill}>⚡ UPI (GPay / PhonePe / Paytm)</span>
                <span className={styles.methodPill}>💳 Debit / Credit Cards</span>
                <span className={styles.methodPill}>🏦 NetBanking</span>
                <span className={styles.methodPill}>📱 QR Code</span>
              </div>

              <button 
                type="button"
                className={styles.razorpayPayBtn} 
                onClick={startRazorpayPayment}
                disabled={submittingReg}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>{submittingReg ? "Opening Razorpay..." : "Pay Securely ₹49.00 via Razorpay"}</span>
              </button>

              <p className={styles.payNote} style={{ marginTop: "1rem" }}>
                Powered by Razorpay. An official confirmation email with your login ID will be sent upon completion.
              </p>
            </div>

            <div className={styles.actionRow} style={{ marginTop: "1.5rem" }}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>← Back to Review</button>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 4: CONFIRMATION ══════════════ */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <div className={styles.confirmBox}>
              <div className={styles.confirmCheckCircle}>✓</div>
              <h2 className={styles.confirmTitle}>Registration Confirmed!</h2>
              <p className={styles.confirmSubtitle}>
                Welcome, <strong>{form.firstName} {form.surname}</strong>!<br/>
                Your registration for <strong>{form.course}</strong> has been successfully completed.
              </p>
              <div className={styles.confirmDetails}>
                <div className={styles.confirmRow}><span>Reference Number</span><strong>{submittedRef || refNum}</strong></div>
                <div className={styles.confirmRow}><span>Registered Email</span><strong>{form.primaryEmail}</strong></div>
                <div className={styles.confirmRow}><span>Amount Paid</span><strong>₹49.00</strong></div>
                <div className={styles.confirmRow}><span>Status</span><strong className={styles.confirmed}>Confirmed ✓</strong></div>
              </div>
              <p className={styles.confirmHint}>
                A confirmation email has been sent to <strong>{form.primaryEmail}</strong>.<br/>
                Our team will be in touch within 24 hours with your next steps.
              </p>
              <button className={styles.submitBtn} onClick={() => navigate("/")}>Go to My Dashboard</button>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════════
          PAYMENT SUCCESS MODAL POPUP (AFTER RAZORPAY SUCCESS)
          ══════════════════════════════════════════════════════════════════════════ */}
      {paymentModal === 'success' && paymentSuccessData && (
        <div className={styles.payModalOverlay}>
          <div className={styles.payModalCard}>
            <div className={styles.paySuccessIconCircle}>✓</div>
            <h2 className={styles.payModalTitle}>Payment &amp; Registration Successful!</h2>
            <p className={styles.payModalSub}>
              Welcome to XL Education, <strong>{paymentSuccessData.studentName}</strong>! Your seat has been secured.
            </p>

            <div className={styles.payModalDetails}>
              <div className={styles.payModalRow}>
                <span>Reference Number</span>
                <strong style={{ color: "#0284c7" }}>{paymentSuccessData.refNumber}</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Student ID / Roll No</span>
                <strong style={{ color: "#0f172a" }}>{paymentSuccessData.rollNo}</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Transaction ID</span>
                <strong style={{ fontSize: "0.78rem" }}>{paymentSuccessData.paymentId}</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Amount Paid</span>
                <strong style={{ color: "#16a34a" }}>₹{paymentSuccessData.amount} (Paid via Razorpay)</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Registered Email</span>
                <strong>{paymentSuccessData.email}</strong>
              </div>
            </div>

            <div className={styles.paySuccessNote}>
              📩 An official enrollment confirmation email with your portal credentials has been sent to <strong>{paymentSuccessData.email}</strong>.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1.25rem", width: "100%" }}>
              <button 
                type="button" 
                className={styles.payModalBtnPrimary}
                onClick={() => {
                  setPaymentModal('idle');
                  navigate('/login/student');
                }}
              >
                🚀 Move to Student Login Portal →
              </button>

              <button 
                type="button" 
                className={styles.payModalBtnSecondary}
                onClick={() => {
                  setPaymentModal('idle');
                  setStep(4);
                }}
              >
                ✕ Close &amp; View Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PAYMENT FAILED MODAL POPUP (ON RAZORPAY ERROR OR DECLINE)
          ══════════════════════════════════════════════════════════════════════════ */}
      {paymentModal === 'failed' && paymentErrorData && (
        <div className={styles.payModalOverlay}>
          <div className={styles.payModalCard}>
            <div className={styles.payFailedIconCircle}>✕</div>
            <h2 className={styles.payModalTitle} style={{ color: "#dc2626" }}>
              {paymentErrorData.title || "Payment Failed"}
            </h2>
            <p className={styles.payModalSub}>
              {paymentErrorData.reason || "Your payment could not be completed at this time."}
            </p>

            <div className={styles.payModalDetails}>
              <div className={styles.payModalRow}>
                <span>Status</span>
                <strong style={{ color: "#dc2626" }}>Payment Incomplete</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Error Code</span>
                <strong style={{ color: "#64748b", fontSize: "0.78rem" }}>{paymentErrorData.code || "DECLINED"}</strong>
              </div>
              <div className={styles.payModalRow}>
                <span>Amount</span>
                <strong>₹49.00</strong>
              </div>
            </div>

            <button 
              type="button" 
              className={styles.payModalBtnRetry}
              onClick={() => {
                setPaymentModal('idle');
                startRazorpayPayment();
              }}
            >
              🔄 Try Payment Again with Razorpay
            </button>

            <button 
              type="button" 
              className={styles.payModalBtnSecondary}
              onClick={() => setPaymentModal('idle')}
            >
              Close &amp; Review Details
            </button>
          </div>
        </div>
      )}

      {/* ── UNIFIED SITE FOOTER ── */}
      <SiteFooter />

    </div>
  );
}
