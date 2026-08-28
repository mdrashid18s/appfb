<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        $now = Carbon::now();

        // Clean out old FAANG/GATE products
        DB::table('products')->delete();

        $products = [
            [
                'title' => 'Year 5 – 11+ Full-Length Mock Exam Series (GL & CEM Pattern)',
                'slug' => 'year-5-11plus-full-mock-series',
                'category' => '11plus_mock',
                'short_description' => '12 Full-Length Timed 11+ Mock Papers with Standardised Scores & Target School Benchmarking.',
                'description' => 'Comprehensive 11+ preparation pack for Year 5 pupils targeting top Grammar and Independent schools. Features 12 full-length simulated mock exams covering Mathematics, English Reading & SPAG, Verbal Reasoning, and Non-Verbal / Spatial Reasoning.',
                'price' => 149.00,
                'original_price' => 299.00,
                'badge' => 'Bestseller',
                'rating' => 4.96,
                'reviews_count' => 420,
                'validity_days' => 365,
                'features' => json_encode([
                    '12 Timed Realistic 11+ Mock Papers (Maths, English, VR, NVR)',
                    'Detailed Step-by-Step Video Explanations for All Questions',
                    'Standardised Score & Percentile Rank Analytics',
                    'Target Grammar School Score Benchmarking'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 4 – 11+ Foundation Test Series & Mental Arithmetic Drills',
                'slug' => 'year-4-11plus-foundation-test-series',
                'category' => '11plus_mock',
                'short_description' => '25+ Topic-Wise Mastery Tests for 11+ Foundation & SPAG Excellence.',
                'description' => 'Build strong core fundamentals in Year 4 with weekly timed topic tests, mental arithmetic challenges, and vocabulary booster drills designed to give your child an early head-start.',
                'price' => 99.00,
                'original_price' => 199.00,
                'badge' => 'Popular',
                'rating' => 4.89,
                'reviews_count' => 280,
                'validity_days' => 365,
                'features' => json_encode([
                    '25+ Foundation Topic-Wise Tests',
                    'Mental Arithmetic & 11+ Vocabulary Builder',
                    'Automated Marking & Instant Diagnostic Feedback',
                    'Parent Progress Report & Weak Area Tracking'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 3 – 11+ Introduction & Logic Reasoning Skills Course',
                'slug' => 'year-3-11plus-intro-course',
                'category' => 'course',
                'short_description' => 'Gentle introduction to 11+ problem solving, puzzles, arithmetic speed, and comprehension.',
                'description' => 'Develop love for learning, critical reasoning, and mathematical agility early in Year 3. Includes interactive video lessons, fun logic puzzles, and weekly printable worksheets.',
                'price' => 79.00,
                'original_price' => 150.00,
                'badge' => 'Recommended',
                'rating' => 4.85,
                'reviews_count' => 190,
                'validity_days' => 365,
                'features' => json_encode([
                    '30+ Engaging Video Lessons',
                    'Fun Reasoning Puzzles & Logic Games',
                    'Weekly Practice Sheets & Quizzes',
                    'Foundation Certificate of Achievement'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 6 – 11+ Final Sprint & Independent School Entrance Masterclass',
                'slug' => 'year-6-11plus-final-sprint-masterclass',
                'category' => 'course',
                'short_description' => 'Intensive exam technique, past papers breakdown, interview prep, and high-difficulty problem solving.',
                'description' => 'Designed for Year 6 students sitting upcoming grammar and independent school exams. Master time management, tackle deceptive questions, and master creative writing under timed exam conditions.',
                'price' => 199.00,
                'original_price' => 399.00,
                'badge' => 'Top Rated',
                'rating' => 4.98,
                'reviews_count' => 510,
                'validity_days' => 180,
                'features' => json_encode([
                    '15+ Advanced Past Paper Walkthroughs',
                    'Independent School 1-on-1 Interview Techniques',
                    'Speed Management & Accuracy Speed Drills',
                    'Targeted 11+ Creative Writing Marking & Feedback'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 10 & 11 GCSE Mathematics (Higher Tier) Complete Exam Prep & 20+ Mocks',
                'slug' => 'gcse-maths-higher-prep-pack',
                'category' => 'test_series',
                'short_description' => '20 Full GCSE Higher Math Mock Papers (Edexcel & AQA) with Step-by-Step Video Solutions.',
                'description' => 'Guaranteed path to Grade 8/9 in GCSE Mathematics. Includes 20 full-length practice examination papers strictly following latest Edexcel and AQA specifications.',
                'price' => 129.00,
                'original_price' => 249.00,
                'badge' => 'Bestseller',
                'rating' => 4.93,
                'reviews_count' => 640,
                'validity_days' => 365,
                'features' => json_encode([
                    '20 Full Edexcel & AQA GCSE Mock Papers',
                    'Grade 8/9 Targeted Higher Question Bank',
                    'Full Step-by-Step Worked Video Solutions',
                    'Formula Sheets & Revision Mindmaps'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'GCSE Triple Science Mastery Bundle (Physics, Chemistry, Biology)',
                'slug' => 'gcse-triple-science-mastery-bundle',
                'category' => 'course',
                'short_description' => 'Complete theory coverage, 21 required practicals review, and 30+ past paper practice sets.',
                'description' => 'Comprehensive video course for Year 10 and 11 covering GCSE Physics, Chemistry, and Biology. Clear conceptual animations, required practical summaries, and exam question techniques.',
                'price' => 189.00,
                'original_price' => 349.00,
                'badge' => 'Trending',
                'rating' => 4.91,
                'reviews_count' => 380,
                'validity_days' => 365,
                'features' => json_encode([
                    '50+ Hours Comprehensive Science Videos',
                    'All 21 Required Practicals Explained with Live Lab Demos',
                    'Over 1,200 Topic-wise Practice Questions',
                    'Downloadable High-Yield Revision Notes'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 7, 8 & 9 Pre-GCSE Foundation Booster Pack',
                'slug' => 'pre-gcse-foundation-booster',
                'category' => 'test_series',
                'short_description' => 'Key Stage 3 Mathematics, English, and Science checkpoint mock tests.',
                'description' => 'Smooth transition from primary to secondary school. Bridge learning gaps and master Key Stage 3 concepts before entering formal GCSE study.',
                'price' => 89.00,
                'original_price' => 179.00,
                'badge' => 'Essential',
                'rating' => 4.86,
                'reviews_count' => 210,
                'validity_days' => 365,
                'features' => json_encode([
                    'KS3 Maths, English & Science Checkpoint Tests',
                    'Algebra & Geometry Step-by-Step Problem Solving',
                    'Analytical Reading & SPAG Masterclasses',
                    'Detailed Weak-Area Progress Diagnostics'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Year 12 & 13 A-Level Pure Mathematics & Mechanics Masterclass',
                'slug' => 'a-level-pure-maths-masterclass',
                'category' => 'course',
                'short_description' => 'Master Calculus, Vectors, Mechanics, and Statistical Distributions for A* grade.',
                'description' => 'Taught by senior A-Level examiners. Extensive coverage of pure mathematics (Calculus, Trigonometry, Proofs) along with Mechanics and Statistics.',
                'price' => 249.00,
                'original_price' => 499.00,
                'badge' => 'A* Focused',
                'rating' => 4.97,
                'reviews_count' => 310,
                'validity_days' => 365,
                'features' => json_encode([
                    'Full Year 12 & 13 Syllabus Coverage',
                    '600+ Step-by-Step Worked Exam Examples',
                    '10 Full A-Level Mock Examination Papers',
                    'Dedicated Doubt Clearing Forum'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'GCSE & 11+ English Model Essays & Vocabulary Revision Playbook',
                'slug' => 'english-model-essays-playbook-ebook',
                'category' => 'ebook',
                'short_description' => 'Grade 9 model essays, Shakespeare analyses, 500+ high-frequency 11+ words & writing guides.',
                'description' => 'Instant downloadable revision handbook packed with high-scoring creative writing samples, essay structure templates, linguistic devices, and vocabulary flashcards.',
                'price' => 29.00,
                'original_price' => 69.00,
                'badge' => 'Instant Download',
                'rating' => 4.88,
                'reviews_count' => 540,
                'validity_days' => 3650,
                'features' => json_encode([
                    '50+ Grade 9 Model Essay Samples',
                    '11+ Creative Writing Planning Frameworks',
                    '500+ Advanced Vocabulary Flashcards',
                    'Printable PDF & Tablet Compatible'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => '1-on-1 Academic Mentorship & Grammar School Interview Simulation',
                'slug' => '1on1-academic-mentorship-interview',
                'category' => 'mock_interview',
                'short_description' => '45 mins live video session with Head of Academics for 11+ & GCSE target setting.',
                'description' => 'Personalized 1-on-1 consultation and mock interview session. Evaluates pupil\'s current strengths, identifies gaps, simulates independent school interview questions, and provides an actionable study roadmap.',
                'price' => 79.00,
                'original_price' => 150.00,
                'badge' => 'Exclusive',
                'rating' => 4.99,
                'reviews_count' => 230,
                'validity_days' => 90,
                'features' => json_encode([
                    '45 Mins Live 1-on-1 Video Session',
                    'Independent & Grammar School Interview Simulation',
                    'Personalised Strengths & Diagnostic Report',
                    'Tailored 6-Month Study Action Plan'
                ]),
                'thumbnail' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($products as $p) {
            DB::table('products')->insert($p);
        }
    }

    public function down(): void
    {
        DB::table('products')->truncate();
    }
};
