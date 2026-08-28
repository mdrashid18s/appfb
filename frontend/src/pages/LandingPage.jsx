/**
 * @file LandingPage.jsx
 * @description XL Education Official Landing Page with interactive Auto-Sliding Course Carousel,
 * Complete Assessment Framework Hero, 4-Stage Learning Methodology, Parent Reviews, and Mega Menu.
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import SiteFooter from "../components/SiteFooter";
import styles from "./LandingPage.module.css";

const COURSES_DATA = [
  {
    id: "y3-intro",
    name: "Year 3 – 11+ Introduction",
    tag: "11+ Starter",
    category: "11plus",
    badgeColor: "#ea580c",
    age: "Age 7–8 (Year 3)",
    desc: "Build fundamental vocabulary, mental arithmetic, and early reasoning skills to prepare for the 11+ journey with confidence.",
    features: [
      "Weekly 2-Hour Live Interactive Classes",
      "Essential Vocabulary & Spelling Lists",
      "Core Mental Maths & Times Tables",
      "Gentle Introduction to VR & NVR",
      "Weekly Marked Homework & Parent Reports"
    ],
    price: "From £28/wk",
    popular: false
  },
  {
    id: "y4-found",
    name: "Year 4 – 11+ Foundation",
    tag: "Most Popular",
    category: "11plus",
    badgeColor: "#ea580c",
    age: "Age 8–9 (Year 4)",
    desc: "Deepen reasoning concepts, advance mathematical problem solving, and develop strong reading comprehension strategies.",
    features: [
      "2.5 Hours Live Comprehensive Teaching",
      "GL & CEM Foundation Syllabus",
      "Verbal Reasoning & Non-Verbal Drills",
      "Comprehension & Creative Writing Basics",
      "Termly Progress Assessment & Feedback"
    ],
    price: "From £32/wk",
    popular: true
  },
  {
    id: "y5-prep",
    name: "Year 5 – 11+ Preparation",
    tag: "Flagship Course",
    category: "11plus",
    badgeColor: "#ea580c",
    age: "Age 9–10 (Year 5)",
    desc: "The definitive intensive 11+ preparation course targeting Reading, Kendrick, Slough, Buckinghamshire, and London Grammars.",
    features: [
      "3 Hours Weekly Intensive Live Sessions",
      "Full Exam Technique & Speed Training",
      "Standard & Multiple Choice Mastery",
      "Bi-Weekly Full-Length Mock Exams",
      "Detailed Performance Analytics & Rank"
    ],
    price: "From £36/wk",
    popular: true
  },
  {
    id: "y5-eng-maths",
    name: "Year 5 – 11+ English & Maths",
    tag: "Core Focus",
    category: "11plus",
    badgeColor: "#ea580c",
    age: "Age 9–10 (Year 5)",
    desc: "Focused deep-dive into advanced numerical reasoning, challenging vocabulary, grammar, and high-scoring creative writing.",
    features: [
      "Specialist English & Maths Modules",
      "Advanced 11+ Comprehension Skills",
      "Multi-Step Word Problem Solving",
      "Creative & Persuasive Writing Feedback",
      "Timed Weekly Topic Tests"
    ],
    price: "From £30/wk",
    popular: false
  },
  {
    id: "y7-found",
    name: "Year 7 – Foundation",
    tag: "KS3 Mastery",
    category: "pre-gcse",
    badgeColor: "#0284c7",
    age: "Age 11–12 (Year 7)",
    desc: "Seamless transition into secondary school curriculum with focus on algebra mastery, scientific enquiry, and literary analysis.",
    features: [
      "Secondary Transition Curriculum",
      "Algebra, Geometry & Statistics",
      "Analytical Writing & Literature",
      "Weekly Graded Homework Tasks",
      "Regular Progress Tracking"
    ],
    price: "From £30/wk",
    popular: false
  },
  {
    id: "y8-inter",
    name: "Year 8 – Intermediate",
    tag: "KS3 Advanced",
    category: "pre-gcse",
    badgeColor: "#0284c7",
    age: "Age 12–13 (Year 8)",
    desc: "Strengthen analytical problem-solving and critical thinking skills in preparation for higher-tier GCSE specifications.",
    features: [
      "Advanced Mathematical Reasoning",
      "Structured Essay Writing & Grammar",
      "Science Foundations (Bio/Chem/Phys)",
      "Termly Subject Benchmark Tests",
      "Small Group Live Tutorial"
    ],
    price: "From £32/wk",
    popular: false
  },
  {
    id: "y9-stepup",
    name: "Year 9 – StepUp",
    tag: "GCSE Readiness",
    category: "pre-gcse",
    badgeColor: "#0369a1",
    age: "Age 13–14 (Year 9)",
    desc: "Bridge program building strong foundations for GCSE 9-1 grades in Maths, English Language, and Combined Science.",
    features: [
      "GCSE Grade 9-1 Curriculum Preview",
      "Past Paper Technique & Application",
      "Exam Board Specific Alignment",
      "Weekly Live Problem Clinics",
      "Targeted Booster Worksheets"
    ],
    price: "From £34/wk",
    popular: true
  },
  {
    id: "y10-fast",
    name: "Year 10 – FastForward",
    tag: "GCSE Excellence",
    category: "gcse",
    badgeColor: "#1e293b",
    age: "Age 14–15 (Year 10)",
    desc: "Fast-track GCSE preparation targeting grades 8 & 9 with high-level question practice, model answers, and examiner insights.",
    features: [
      "Target Grades 8 & 9 Strategy",
      "Comprehensive Syllabus Coverage",
      "Official Past Paper Dissections",
      "Timed Exam Condition Drills",
      "Personalized Academic Mentoring"
    ],
    price: "From £38/wk",
    popular: false
  },
  {
    id: "gcse-maths",
    name: "GCSE Mathematics",
    tag: "Higher Tier",
    category: "gcse",
    badgeColor: "#1e293b",
    age: "Year 10 & 11",
    desc: "Targeted higher tier GCSE maths program designed to turn grade 6/7 students into consistent grade 8/9 achievers.",
    features: [
      "Edexcel, AQA & OCR Alignment",
      "Challenging Grade 8/9 Problem Sets",
      "Calculator & Non-Calculator Tricks",
      "Full Mock Papers with Marking",
      "Weekly Topic Masterclasses"
    ],
    price: "From £35/wk",
    popular: false
  },
  {
    id: "alevel-maths",
    name: "A-Level Mathematics",
    tag: "Sixth Form",
    category: "gcse",
    badgeColor: "#0f172a",
    age: "Year 12 & 13",
    desc: "Pure Mathematics, Mechanics, and Statistics mastery tailored for top university STEM admissions.",
    features: [
      "Rigorous Pure Maths & Calculus",
      "Mechanics & Statistics Modules",
      "STEP & MAT Preparation Support",
      "Step-by-Step Proof Techniques",
      "One-to-One Feedback on Mocks"
    ],
    price: "From £42/wk",
    popular: false
  }
];

const TESTIMONIALS = [
  {
    quote: "My son secured an offer from Reading School (Boys) with rank in the top 20! The structured weekly mocks and individual teacher feedback made all the difference.",
    author: "Priya Sharma",
    child: "Aarav (Reading School Admission)",
    stars: 5,
    location: "Reading"
  },
  {
    quote: "XL Education's 11+ preparation course took away all the stress. The online platform with instant homework marking and mock analytics gave my daughter total confidence for Kendrick.",
    author: "David & Sarah Jenkins",
    child: "Emily (Kendrick School Admission)",
    stars: 5,
    location: "Berkshire"
  },
  {
    quote: "The teachers are exceptional. They don't just teach the syllabus, they teach exam timing and mental resilience. Both my twins got into their first choice grammar schools!",
    author: "Farhan Malik",
    child: "Zain & Hamza (Slough Consortium)",
    stars: 5,
    location: "Langley"
  },
  {
    quote: "From Year 4 foundation to Year 5 mocks, XL Education has been wonderful. The portal is easy to use and the faculty genuinely care about every student's progress.",
    author: "Anita Patel",
    child: "Diya (Queen Elizabeth's Girls)",
    stars: 5,
    location: "London"
  }
];

const FEATURES_LIST = [
  {
    icon: "🎓",
    title: "Expert Specialist Tutors",
    desc: "Qualified, passionate teachers with unmatched experience in 11+ grammar entrance and GCSE syllabuses."
  },
  {
    icon: "📚",
    title: "Complete Curriculum",
    desc: "Up-to-date modular learning materials perfectly aligned with GL Assessment, CEM, CSSE, and Independent exams."
  },
  {
    icon: "💻",
    title: "Smart Practice Portal",
    desc: "24/7 access to mock exams, homework review, detailed performance graphs, and personalized weak-area tests."
  },
  {
    icon: "👥",
    title: "Focused Small Batches",
    desc: "Interactive live classes with low teacher-student ratios ensuring every child receives direct attention."
  },
  {
    icon: "🏆",
    title: "92%+ Success Rate",
    desc: "Over 12 years of consistent top grammar school placements in Berkshire, London, Birmingham, and Bucks."
  }
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Assess",
    tag: "Diagnostic Baseline",
    desc: "We evaluate your child's baseline strengths and areas for improvement with our standardized 11+ assessment.",
    icon: "🔍"
  },
  {
    step: "02",
    title: "Learn",
    tag: "Concept Mastery",
    desc: "Engaging live interactive lessons build deep subject knowledge in Maths, English, Verbal & Non-Verbal Reasoning.",
    icon: "💡"
  },
  {
    step: "03",
    title: "Practice",
    tag: "Weekly Timed Mocks",
    desc: "Rigorous weekly homework, exam technique drills, and full-length realistic mock exams under timed conditions.",
    icon: "📝"
  },
  {
    step: "04",
    title: "Excel",
    tag: "Grammar School Success",
    desc: "Targeted exam strategy, speed mastery, and confidence that ensures your child excels on the final exam day.",
    icon: "📈"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Active navigation dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navRef = useRef(null);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState("all");

  // Carousel Slider State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const sliderRef = useRef(null);

  // Testimonial Slider State
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Filtered courses
  const filteredCourses = COURSES_DATA.filter(
    (c) => activeCategory === "all" || c.category === activeCategory
  );

  // Auto-slide course carousel
  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % filteredCourses.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isAutoPlay, filteredCourses.length]);

  // Testimonial auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (topEnrolRef.current && !topEnrolRef.current.contains(event.target)) {
        setTopEnrolOpen(false);
        setTopEnrolHover(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Hash-based smooth scroll on direct link / navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.replace('#', '');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleDropdown = (menuName) => {
    setActiveDropdown((prev) => (prev === menuName ? null : menuName));
  };

  const toast = useToast();
  const [showWhatsAppTooltip, setShowWhatsAppTooltip] = useState(true);
  const [isEnrolHovered, setIsEnrolHovered] = useState(false);
  const [topEnrolHover, setTopEnrolHover] = useState(false);
  const [topEnrolOpen, setTopEnrolOpen] = useState(false);
  const topEnrolRef = useRef(null);

  // Reading Message Modal State
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);

  const handleEnrolCourse = (courseName) => {
    navigate(`/register?course=${encodeURIComponent(courseName)}`);
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % filteredCourses.length);
  };

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + filteredCourses.length) % filteredCourses.length);
  };

  const [contactForm, setContactForm] = useState({
    parentName: '',
    email: '',
    mobile: '',
    yearGroup: '',
    subject: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactSubmit = async (e, branchName = 'Reading') => {
    if (e) e.preventDefault();
    if (!contactForm.parentName || !contactForm.email || !contactForm.mobile || !contactForm.message) {
      if (toast?.error) toast.error("Please fill in all required message fields.");
      else alert("Please fill in all required fields.");
      return;
    }

    setIsSendingContact(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          parent_name: contactForm.parentName,
          email: contactForm.email,
          phone: contactForm.mobile,
          child_year: contactForm.yearGroup,
          branch: branchName,
          subject: contactForm.subject || `Enquiry for ${branchName}`,
          message: contactForm.message,
          type: 'parent_message'
        })
      });

      const data = await res.json();
      if (data.success) {
        setContactSubmitted(true);
        if (toast?.success) toast.success("Message sent successfully to admissions!");
        setTimeout(() => {
          setContactSubmitted(false);
          setContactForm({
            parentName: '',
            email: '',
            mobile: '',
            yearGroup: '',
            subject: '',
            message: '',
          });
          setIsReadingModalOpen(false);
        }, 2200);
      } else {
        if (toast?.error) toast.error(data.message || 'Failed to submit enquiry');
      }
    } catch (err) {
      console.error(err);
      if (toast?.error) toast.error('Network error submitting enquiry');
    }
    setIsSendingContact(false);
  };

  return (
    <div className={styles.landingContainer}>
      {/* ── TOP UTILITY STRIP (UK Locations & LIVE Badge) ── */}
      <div className={styles.topStrip}>
        <div className={styles.topStripInner}>
          <div className={styles.topStripLeft}>
            <button type="button" className={styles.topStripBtn} onClick={() => setIsReadingModalOpen(true)} title="Send message to Reading Admissions">
              Reading ✉
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => scrollToSection('branch-locations-section')}>
              Basingstoke
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => scrollToSection('branch-locations-section')}>
              Langley
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => scrollToSection('branch-locations-section')}>
              Sutton
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => scrollToSection('online-services-section')}>
              Online
            </button>
            <span className={styles.dot}>|</span>
            <button type="button" className={styles.topStripBtn} onClick={() => scrollToSection('franchise-partners-section')}>
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
                      navigate("/register?course=" + encodeURIComponent("Year 5 – 11+ Preparation"));
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
                      navigate("/register?course=" + encodeURIComponent("GCSE Combined Science"));
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
              href="https://wa.me/919771648972?text=Hello%20Md%20Rashid,%20I%20would%20like%20to%20know%20more%20about%20XL%20Education%20courses!" 
              target="_blank" 
              rel="noreferrer" 
              className={styles.whatsappStripBtn}
              title="Chat with us on WhatsApp"
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
            <div className={styles.brandTextWrap}>
              <span className={styles.brandName}>XL Education</span>
              <span className={styles.brandTagline}>Excellence in 11+ & GCSE</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <button className={`${styles.navLink} ${styles.navLinkActive}`} onClick={() => navigate("/")}>
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

              {activeDropdown === "courses" && (
                <div className={styles.megaMenuPopup}>
                  <div className={styles.megaGrid}>
                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>11+ Courses</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li><button onClick={() => handleEnrolCourse("Year 3 – 11+ Introduction")}>Year 3 – 11+ Introduction</button></li>
                        <li><button onClick={() => handleEnrolCourse("Year 4 – 11+ Foundation")}>Year 4 – 11+ Foundation</button></li>
                        <li><button onClick={() => handleEnrolCourse("Year 5 – 11+ Preparation")}>Year 5 – 11+ Preparation</button></li>
                        <li><button onClick={() => handleEnrolCourse("Year 5 – 11+ English & Maths")}>Year 5 – 11+ English & Maths</button></li>
                      </ul>
                    </div>

                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>Pre-GCSE</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li><button onClick={() => handleEnrolCourse("Year 7 – Foundation")}>Year 7 – Foundation</button></li>
                        <li><button onClick={() => handleEnrolCourse("Year 8 – Intermediate")}>Year 8 – Intermediate</button></li>
                        <li><button onClick={() => handleEnrolCourse("Year 9 – StepUp")}>Year 9 – StepUp</button></li>
                      </ul>
                    </div>

                    <div className={styles.megaCol}>
                      <h4 className={styles.megaColTitle}>GCSE & A-Level</h4>
                      <div className={styles.megaDivider} />
                      <ul className={styles.megaList}>
                        <li><button onClick={() => handleEnrolCourse("Year 10 – FastForward")}>Year 10 – FastForward</button></li>
                        <li><button onClick={() => handleEnrolCourse("GCSE Mathematics")}>GCSE Mathematics</button></li>
                        <li><button onClick={() => handleEnrolCourse("A-Level Mathematics")}>A-Level Mathematics</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 11+ Dropdown */}
            <div className={styles.navItemWithDropdown}>
              <button
                className={`${styles.navDropdownTrigger} ${activeDropdown === "11plus" ? styles.navActive : ""}`}
                onClick={() => toggleDropdown("11plus")}
              >
                <span>11+ Programs</span>
                <span className={styles.chevron}>▾</span>
              </button>
              {activeDropdown === "11plus" && (
                <div className={styles.simpleDropdownPopup}>
                  <ul className={styles.simpleDropdownList}>
                    <li><button onClick={() => handleEnrolCourse("Year 3 – 11+ Introduction")}>Year 3 – 11+ Introduction (Age 7–8)</button></li>
                    <li><button onClick={() => handleEnrolCourse("Year 4 – 11+ Foundation")}>Year 4 – 11+ Foundation (Age 8–9)</button></li>
                    <li><button onClick={() => handleEnrolCourse("Year 5 – 11+ Preparation")}>Year 5 – 11+ Preparation (Age 9–10)</button></li>
                    <li><button onClick={() => handleEnrolCourse("Year 5 – 11+ English & Maths")}>Year 5 – 11+ English & Maths Intensive</button></li>
                  </ul>
                </div>
              )}
            </div>

            <button className={styles.navLink} onClick={() => {
              const el = document.getElementById("process-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}>
              Methodology
            </button>

            <button className={styles.navLink} onClick={() => {
              const el = document.getElementById("reviews-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}>
              Results & Reviews
            </button>
          </nav>

          <div className={styles.headerActions}>
            <button className={styles.loginBtn} onClick={() => navigate("/login")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Login</span>
            </button>

            <div 
              className={styles.enrolDropdownWrap}
              onMouseEnter={() => setIsEnrolHovered(true)}
              onMouseLeave={() => setIsEnrolHovered(false)}
            >
              <button className={styles.enrolBtn} onClick={() => navigate("/register")}>
                <span>Enrol Now</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              {/* ── ENROL NOW HOVER DROPDOWN MENU ── */}
              {isEnrolHovered && (
                <div className={styles.enrolHoverMenu}>
                  <div className={styles.enrolMenuHeader}>
                    <span className={styles.enrolMenuTitle}>Select Enrolment Programme</span>
                    <span className={styles.enrolSessionBadge}>2026/27 Intake</span>
                  </div>

                  <div className={styles.enrolMenuList}>
                    <button 
                      className={styles.enrolMenuItem}
                      onClick={() => navigate("/register?course=" + encodeURIComponent("Year 5 – 11+ Preparation"))}
                    >
                      <div className={styles.enrolItemIconWrap} style={{ background: "#e0f2fe", color: "#0284c7" }}>
                        🎓
                      </div>
                      <div className={styles.enrolItemText}>
                        <strong>11+ Preparation Courses</strong>
                        <p>Year 3 Intro, Year 4 Foundation, Year 5 Intensive, Mock Exams</p>
                      </div>
                      <span className={styles.enrolArrow}>→</span>
                    </button>

                    <button 
                      className={styles.enrolMenuItem}
                      onClick={() => navigate("/register?course=" + encodeURIComponent("Year 7 – Foundation"))}
                    >
                      <div className={styles.enrolItemIconWrap} style={{ background: "#fef3c7", color: "#d97706" }}>
                        📘
                      </div>
                      <div className={styles.enrolItemText}>
                        <strong>Pre-GCSE (Year 7 – Year 9)</strong>
                        <p>Key Stage 3 mastery in Maths, English &amp; Science foundation</p>
                      </div>
                      <span className={styles.enrolArrow}>→</span>
                    </button>

                    <button 
                      className={styles.enrolMenuItem}
                      onClick={() => navigate("/register?course=" + encodeURIComponent("Year 10 – FastForward"))}
                    >
                      <div className={styles.enrolItemIconWrap} style={{ background: "#f3e8ff", color: "#9333ea" }}>
                        🔬
                      </div>
                      <div className={styles.enrolItemText}>
                        <strong>GCSE &amp; A-Level Programs</strong>
                        <p>Targeted exam boards (AQA, Edexcel, OCR) for top Grades 8 &amp; 9</p>
                      </div>
                      <span className={styles.enrolArrow}>→</span>
                    </button>

                    <button 
                      className={`${styles.enrolMenuItem} ${styles.freeAssessmentItem}`}
                      onClick={() => navigate("/register?course=" + encodeURIComponent("Free 11+ Baseline Assessment"))}
                    >
                      <div className={styles.enrolItemIconWrap} style={{ background: "#dcfce7", color: "#16a34a" }}>
                        ⭐
                      </div>
                      <div className={styles.enrolItemText}>
                        <strong>Free Baseline Assessment</strong>
                        <p>No obligation comprehensive skill evaluation &amp; report</p>
                      </div>
                      <span className={styles.freePillBadge}>FREE</span>
                    </button>
                  </div>

                  <div className={styles.enrolMenuFooter}>
                    <button 
                      className={styles.enrolViewAllBtn}
                      onClick={() => navigate("/register")}
                    >
                      <span>Proceed to Full Registration Form →</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (Matching Image Top) ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.badgeSparkle}>✨</span>
              <span>Complete Assessment Framework</span>
            </div>

            <h1 className={styles.heroTitle}>
              Complete Assessment Framework
              <span className={styles.heroSubtitle}>for Year 3, 4, 5 and 6 students</span>
            </h1>

            <p className={styles.heroDesc}>
              Find out why others are our best ambassadors and how we can assist your child in securing top grammar school places with proven, modular learning methodologies.
            </p>

            <div className={styles.heroCtaGroup}>
              <button className={styles.heroPrimaryBtn} onClick={() => navigate("/register")}>
                <span>Enrol Now</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <button 
                className={styles.heroSecondaryBtn} 
                onClick={() => {
                  const el = document.getElementById("courses-carousel-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span>Find a Free Assessment</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className={styles.heroMetrics}>
              <div className={styles.metricItem}>
                <strong>92.4%</strong>
                <span>Grammar Pass Rate</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <strong>10,000+</strong>
                <span>Mock Questions</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <strong>12+ Yrs</strong>
                <span>Proven Excellence</span>
              </div>
            </div>
          </div>

          <div className={styles.heroArtSide}>
            <div className={styles.artCard}>
              <div className={styles.artHeaderTag}>
                <span>🎓 11+ Grammar & Independent School Specialists</span>
              </div>
              
              {/* Illustration / Graphic Visual */}
              <div className={styles.artVisual}>
                <div className={styles.artPencilSketch}>
                  <div className={styles.studyBoyGraphic}>
                    <svg viewBox="0 0 200 200" className={styles.sketchSvg}>
                      <circle cx="100" cy="70" r="35" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
                      <path d="M70 140 C 70 100, 130 100, 130 140 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
                      <rect x="50" y="140" width="100" height="40" rx="6" fill="#ea580c" opacity="0.1" stroke="#ea580c" strokeWidth="2" />
                      <line x1="60" y1="155" x2="140" y2="155" stroke="#ea580c" strokeWidth="2" strokeDasharray="4" />
                      <line x1="60" y1="168" x2="110" y2="168" stroke="#ea580c" strokeWidth="2" strokeDasharray="4" />
                      <path d="M125 125 L145 145 L135 155 L115 135 Z" fill="#0284c7" />
                    </svg>
                  </div>
                  <div className={styles.floatingTagTop}>
                    <span>⭐ 5.0 Rated by 1,200+ Parents</span>
                  </div>
                  <div className={styles.floatingTagBottom}>
                    <span>🏆 Reading & Kendrick Top Ranks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSE PACKAGES (AUTO-SLIDING INFINITE CAROUSEL) ── */}
      <section 
        id="courses-carousel-section" 
        className={styles.coursesSection}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>
            <span>🏷 Our Course Packages</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Why choose us for your child's educational journey?
          </h2>
          <p className={styles.sectionSubtitle}>
            Comprehensive modular courses designed for complete 11+ and academic success. Explore our structured programs below:
          </p>

          {/* Category Filter Tabs */}
          <div className={styles.filterTabs}>
            {[
              { id: "all", label: "All Courses" },
              { id: "11plus", label: "11+ Preparation" },
              { id: "pre-gcse", label: "Pre-GCSE (Y7–Y9)" },
              { id: "gcse", label: "GCSE & A-Level" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`${styles.filterBtn} ${activeCategory === tab.id ? styles.filterBtnActive : ""}`}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setCarouselIndex(0);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel Slider Container */}
        <div className={styles.carouselWrapper}>
          <button 
            className={`${styles.sliderNavBtn} ${styles.sliderPrev}`} 
            onClick={handlePrevSlide}
            aria-label="Previous Course"
          >
            ‹
          </button>

          <div className={styles.carouselTrack} ref={sliderRef}>
            <div 
              className={styles.carouselSlidesRow}
              style={{
                transform: `translateX(-${carouselIndex * (100 / Math.min(3, filteredCourses.length))}%)`
              }}
            >
              {filteredCourses.map((course) => (
                <div key={course.id} className={styles.courseCardCol}>
                  <div className={`${styles.courseCard} ${course.popular ? styles.courseCardHighlight : ""}`}>
                    {course.popular && (
                      <div className={styles.popularBadge}>
                        <span>⭐ Recommended</span>
                      </div>
                    )}

                    {/* Card Header with Color Accent */}
                    <div 
                      className={styles.cardHeaderAccent}
                      style={{ backgroundColor: course.badgeColor }}
                    >
                      <div className={styles.cardHeaderTop}>
                        <span className={styles.cardAge}>{course.age}</span>
                        <span className={styles.cardTag}>{course.tag}</span>
                      </div>
                      <h3 className={styles.cardCourseName}>{course.name}</h3>
                    </div>

                    {/* Card Body */}
                    <div className={styles.cardBody}>
                      <p className={styles.cardDesc}>{course.desc}</p>

                      <div className={styles.featuresHeading}>What's Included:</div>
                      <ul className={styles.featuresList}>
                        {course.features.map((f, i) => (
                          <li key={i}>
                            <span className={styles.checkIcon}>✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={styles.cardFooter}>
                        <div className={styles.priceWrap}>
                          <span className={styles.priceLabel}>Starting from</span>
                          <span className={styles.priceValue}>{course.price}</span>
                        </div>

                        <button 
                          className={styles.viewCourseBtn}
                          style={{ backgroundColor: course.badgeColor }}
                          onClick={() => handleEnrolCourse(course.name)}
                        >
                          <span>Enrol / View Details</span>
                          <span className={styles.btnArrow}>&gt;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            className={`${styles.sliderNavBtn} ${styles.sliderNext}`} 
            onClick={handleNextSlide}
            aria-label="Next Course"
          >
            ›
          </button>
        </div>

        {/* Carousel Indicators / Dots */}
        <div className={styles.carouselDots}>
          {filteredCourses.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dotBtn} ${carouselIndex === idx ? styles.dotBtnActive : ""}`}
              onClick={() => setCarouselIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US (5 CIRCULAR FEATURE CARDS) ── */}
      <section className={styles.whyChooseSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>
            <span>🎓 Why Choose XL Education</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Delivering Exceptional Educational Outcomes
          </h2>
          <p className={styles.sectionSubtitle}>
            Our proven track record and individualized teaching methodology ensure every student reaches their full academic potential.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES_LIST.map((feat, i) => (
            <div key={i} className={styles.featureItemCard}>
              <div className={styles.featureIconBubble}>
                <span>{feat.icon}</span>
              </div>
              <h3 className={styles.featureTitle}>{feat.title}</h3>
              <p className={styles.featureDesc}>{feat.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.centerActionWrap}>
          <button className={styles.outlineCtaBtn} onClick={() => navigate("/register")}>
            <span>View All Course Features & Add-ons</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── 4-STAGE LEARNING PATH (ROADMAP PROCESS) ── */}
      <section id="process-section" className={styles.processSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>
            <span>🚀 Our 4-Step Process</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Targeted 4-Stage Learning Path Tailored for High Performance
          </h2>
          <p className={styles.sectionSubtitle}>
            Structured step-by-step roadmap from initial baseline diagnostic to exam day victory.
          </p>
        </div>

        <div className={styles.processGrid}>
          {PROCESS_STEPS.map((ps, i) => (
            <div key={i} className={styles.processStepCard}>
              <div className={styles.stepNumCircle}>
                <span>{ps.step}</span>
              </div>
              <div className={styles.stepIconEmoji}>{ps.icon}</div>
              <h3 className={styles.stepTitle}>{ps.title}</h3>
              <span className={styles.stepTag}>{ps.tag}</span>
              <p className={styles.stepDesc}>{ps.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARENT TESTIMONIALS ── */}
      <section id="reviews-section" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>
            <span>⭐ Parent Testimonials</span>
          </div>
          <h2 className={styles.sectionTitle}>
            Trusted by Thousands of Families Across the UK
          </h2>
          <p className={styles.sectionSubtitle}>
            Read real feedback from parents whose children secured top scores and admissions into grammar schools.
          </p>
        </div>

        <div className={styles.testimonialSliderWrap}>
          <div className={styles.testimonialCardMain}>
            <div className={styles.quoteIconBadge}>“</div>
            <p className={styles.testimonialQuote}>
              "{TESTIMONIALS[activeTestimonial].quote}"
            </p>
            <div className={styles.starsRow}>
              {"★".repeat(TESTIMONIALS[activeTestimonial].stars)}
            </div>
            <div className={styles.authorWrap}>
              <strong>{TESTIMONIALS[activeTestimonial].author}</strong>
              <span>{TESTIMONIALS[activeTestimonial].child}</span>
              <span className={styles.locBadge}>📍 {TESTIMONIALS[activeTestimonial].location}</span>
            </div>
          </div>

          <div className={styles.testimonialDotsRow}>
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.tDot} ${activeTestimonial === idx ? styles.tDotActive : ""}`}
                onClick={() => setActiveTestimonial(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaIconPulse}>📅</div>
          <h2 className={styles.ctaTitle}>Book Your Child's Free 11+ Diagnostic Assessment</h2>
          <p className={styles.ctaDesc}>
            Identify strengths, uncover growth opportunities, and receive a bespoke preparation strategy tailored to your target grammar schools.
          </p>
          <div className={styles.ctaBtnsGroup}>
            <button className={styles.ctaPrimaryBtn} onClick={() => navigate("/register")}>
              <span>Register Now for 2026/27</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <a href="tel:9771648972" className={styles.ctaCallBtn}>
              <span>📞 Call 9771648972</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          GET IN TOUCH & ALL LOCATIONS / CENTRES SECTION
          ══════════════════════════════════════════════════════════════════════════ */}
      <section className={styles.contactSectionWrap}>
        {/* Section Title */}
        <div className={styles.contactHeroHeader}>
          <h2 className={styles.contactHeroTitle}>
            Get in <span>Touch</span>
          </h2>
          <p className={styles.contactHeroSubtitle}>
            Ready to start your child's educational journey? Contact us today.
          </p>
        </div>

        {/* 1. SEND US A MESSAGE & FLAGSHIP CENTRE (READING/EARLEY) */}
        <div id="reading-section" className={styles.contactMainGrid}>
          {/* Left: Send us a message form */}
          <div className={styles.contactFormCard}>
            <h3 className={styles.contactFormTitle}>Send us a Message</h3>
            
            {contactSubmitted && (
              <div className={styles.contactSuccessAlert}>
                ✓ Thank you! Your message has been sent successfully. Our admissions team will contact you shortly.
              </div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div className={styles.contactFormRow}>
                <div className={styles.contactField}>
                  <label>Parent/Guardian Name <span>*</span></label>
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    required 
                    value={contactForm.parentName}
                    onChange={(e) => setContactForm({ ...contactForm, parentName: e.target.value })}
                    className={styles.contactInput}
                  />
                </div>
                <div className={styles.contactField}>
                  <label>Email Address <span>*</span></label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className={styles.contactInput}
                  />
                </div>
              </div>

              <div className={styles.contactFormRow}>
                <div className={styles.contactField}>
                  <label>Mobile Number <span>*</span></label>
                  <input 
                    type="tel" 
                    placeholder="07xxxxxxxxx or +447xxxxxxxxx" 
                    required 
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    className={styles.contactInput}
                  />
                </div>
                <div className={styles.contactField}>
                  <label>Year Group <span>*</span></label>
                  <select 
                    value={contactForm.yearGroup}
                    onChange={(e) => setContactForm({ ...contactForm, yearGroup: e.target.value })}
                    className={styles.contactSelect}
                    required
                  >
                    <option value="">Select year group</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                    <option value="Year 6">Year 6</option>
                    <option value="Year 7">Year 7</option>
                    <option value="Year 8">Year 8</option>
                    <option value="Year 9">Year 9</option>
                    <option value="Year 10">Year 10</option>
                    <option value="GCSE">GCSE</option>
                  </select>
                </div>
              </div>

              <div className={styles.contactField}>
                <label>Subject of Interest <span>*</span></label>
                <select 
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className={styles.contactSelect}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="11+ Comprehensive Course">11+ Comprehensive Course</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English & Verbal Reasoning">English &amp; Verbal Reasoning</option>
                  <option value="Non-Verbal Reasoning">Non-Verbal Reasoning</option>
                  <option value="GCSE Science & Maths">GCSE Science &amp; Maths</option>
                  <option value="Mock Exam Practice Series">Mock Exam Practice Series</option>
                </select>
              </div>

              <div className={styles.contactField}>
                <label>Message <span>*</span></label>
                <textarea 
                  placeholder="Tell us about your child's needs and any specific requirements..." 
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className={styles.contactTextarea}
                />
              </div>

              <button type="submit" className={styles.contactSubmitBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                <span>Send Message</span>
              </button>
            </form>
          </div>

          {/* Right: Flagship Centre (Reading/Earley) */}
          <div className={styles.flagshipCardWrap}>
            <div className={styles.flagshipHeaderTitle}>
              <span>⭐</span>
              <span>Flagship Centre</span>
            </div>

            <div className={styles.flagshipCard}>
              <div className={styles.flagshipBadge}>🏢</div>
              <h4 className={styles.flagshipCity}>Reading/Earley</h4>
              <p className={styles.flagshipSub}>Our main headquarters and flagship centre</p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Maiden Erlegh School, Silverdale Road, Earley - RG6 7HS</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>01189079200</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@xl-education.co.uk</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>

              <div className={styles.whyFlagshipBox}>
                <div className={styles.whyFlagshipTitle}>Why Choose Our Flagship Centre?</div>
                <ul className={styles.whyFlagshipList}>
                  <li>State-of-the-art facilities</li>
                  <li>Expert qualified teachers</li>
                  <li>Small class sizes (max 15 students)</li>
                  <li>Convenient parking available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BRANCH LOCATIONS (BASINGSTOKE, SLOUGH/LANGLEY, SUTTON) */}
        <div id="branch-locations-section" className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>
            <span>🏢</span>
            <span>Branch Locations</span>
          </h3>

          <div className={styles.branchLocationsGrid}>
            {/* Basingstoke */}
            <div className={`${styles.branchCard} ${styles.branchCardGreen}`}>
              <div className={styles.branchBadgeGreen}>🏢</div>
              <h4 className={styles.branchCity}>Basingstoke</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Queen Mary's College, Cliddesden Road, Basingstoke - RG21 3HF</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>01189079200</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@xl-education.co.uk</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>
            </div>

            {/* Slough/Langley */}
            <div className={`${styles.branchCard} ${styles.branchCardGreen}`}>
              <div className={styles.branchBadgeGreen}>🏢</div>
              <h4 className={styles.branchCity}>Slough/Langley</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>East Berkshire College, Station Road, Langley - SL3 8BY</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>01189079200</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@xl-education.co.uk</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>
            </div>

            {/* Sutton */}
            <div className={`${styles.branchCard} ${styles.branchCardGreen}`}>
              <div className={styles.branchBadgeGreen}>🏢</div>
              <h4 className={styles.branchCity}>Sutton</h4>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Cheam Common Junior Academy, Kingsmead Avenue, Worcester Park, Sutton - KT4 8UT</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>01189079200</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@xl-education.co.uk</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ONLINE SERVICES */}
        <div id="online-services-section" className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>
            <span>🌐</span>
            <span>Online Services</span>
          </h3>

          <div className={styles.singleCenteredCardWrap}>
            <div className={styles.onlineCard}>
              <div className={styles.onlineBadgePurple}>🌐</div>
              <h4 className={styles.onlineTitle}>Online Tutoring</h4>
              <p className={styles.flagshipSub}>High-quality online tutoring from anywhere</p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <strong style={{ color: "#7e22ce" }}>Available Nationwide</strong>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>01189079200</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>contact@xl-education.co.uk</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. FRANCHISE PARTNERS (MANCHESTER) */}
        <div id="franchise-partners-section" className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>
            <span>🏢</span>
            <span>Franchise Partners</span>
          </h3>

          <div className={styles.singleCenteredCardWrap}>
            <div className={styles.franchiseCard}>
              <div className={styles.franchiseBadgeBlue}>🏢</div>
              <h4 className={styles.franchiseTitle}>Manchester</h4>
              <p className={styles.flagshipSub}>Independently operated Tutors24x7 franchise partner</p>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Tutors24x7, Midwest House, Timperley, WA14 1TF</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>Phone: 0161 687 4361</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <span>Mobile: 07350 506886</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>tuition@tutors24x7.com</span>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <a href="https://tuitionhub.tutors24x7.com" target="_blank" rel="noreferrer" style={{ color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>
                    tuitionhub.tutors24x7.com ↗
                  </a>
                </div>
                <div className={styles.infoItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Mon-Fri: 9am-6pm | Sat-Sun: 8:30am-4:30pm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── READING CENTRE SEND MESSAGE MODAL ── */}
      {isReadingModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setIsReadingModalOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'popIn 0.25s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
              padding: '24px 28px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  📍 Reading Flagship Centre
                </span>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Send Message to Admissions</h3>
                <p style={{ margin: '4px 0 0', color: '#dcfce7', fontSize: '13px' }}>
                  Our Reading team will get back to you within 24 hours.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsReadingModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <div style={{ padding: '24px 28px' }}>
              {contactSubmitted ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#166534'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>Message Sent Successfully!</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                    Thank you, our Reading Centre admissions advisor will call/email you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => handleContactSubmit(e, 'Reading')}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Parent Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Your full name"
                        value={contactForm.parentName}
                        onChange={(e) => setContactForm({ ...contactForm, parentName: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 14px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Primary Email <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="email" 
                        required
                        placeholder="parent@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 14px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="07xxxxxxxxx"
                        value={contactForm.mobile}
                        onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 14px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Child School Year
                      </label>
                      <select 
                        value={contactForm.yearGroup}
                        onChange={(e) => setContactForm({ ...contactForm, yearGroup: e.target.value })}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 14px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">Select Year</option>
                        <option value="Year 3">Year 3 (Age 7-8)</option>
                        <option value="Year 4">Year 4 (Age 8-9)</option>
                        <option value="Year 5">Year 5 (Age 9-10)</option>
                        <option value="Year 6">Year 6 (11+ Exam)</option>
                        <option value="Year 7-9">Pre-GCSE (Year 7-9)</option>
                        <option value="Year 10-11">GCSE (Year 10-11)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Your Message / Enquiry <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Ask about batch timings, availability, fees, or assessment test..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsReadingModalOpen(false)}
                      style={{
                        padding: '10px 20px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSendingContact}
                      style={{
                        padding: '10px 24px',
                        border: 'none',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: isSendingContact ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      {isSendingContact ? 'Sending Message...' : 'Send Message ✉'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── UNIFIED SITE FOOTER ── */}
      <SiteFooter />
    </div>
  );
}
