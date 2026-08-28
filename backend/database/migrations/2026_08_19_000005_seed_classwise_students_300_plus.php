<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fetch all active courses
        $courses = DB::table('courses')->get();
        if ($courses->isEmpty()) return;

        // Clean out existing student records safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('student')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Realistic First and Last Names for UK Student Demographic
        $firstNames = [
            'Oliver', 'Sophia', 'Muhammad', 'Emma', 'George', 'Mia', 'Noah', 'Amelia',
            'Leo', 'Ava', 'Arthur', 'Isabella', 'Oscar', 'Aria', 'Harry', 'Lily',
            'Charlie', 'Ella', 'Jack', 'Emily', 'Aarav', 'Ananya', 'Zain', 'Fatima',
            'Vivaan', 'Diya', 'Rohan', 'Priya', 'Aditya', 'Sara', 'Kabir', 'Isha',
            'Aryan', 'Meera', 'Kian', 'Zara', 'Ibrahim', 'Maya', 'Lucas', 'Chloe',
            'Henry', 'Grace', 'Freddie', 'Freya', 'Alfie', 'Evie', 'Theo', 'Florence',
            'Archie', 'Alice', 'Alexander', 'Phoebe', 'Edward', 'Hannah', 'Thomas', 'Zoe',
            'Daniel', 'Ruby', 'Samuel', 'Jessica', 'Benjamin', 'Sophie', 'James', 'Lucy',
            'Adam', 'Layla', 'Hamza', 'Aaliyah', 'Ali', 'Mariam', 'Yusuf', 'Noor',
            'Rayyan', 'Hafsa', 'Tariq', 'Amina', 'Bilal', 'Zahra', 'Ayaan', 'Hiba'
        ];

        $lastNames = [
            'Smith', 'Patel', 'Jones', 'Khan', 'Taylor', 'Sharma', 'Williams', 'Singh',
            'Brown', 'Ali', 'Davies', 'Iyer', 'Evans', 'Hussain', 'Wilson', 'Gupta',
            'Thomas', 'Shah', 'Roberts', 'Mehta', 'Johnson', 'Verma', 'Lewis', 'Begum',
            'Walker', 'Desai', 'Robinson', 'Choudhury', 'Wood', 'Reddy', 'Thompson', 'Malik',
            'White', 'Nair', 'Watson', 'Rao', 'Jackson', 'Siddiqui', 'Wright', 'Menon',
            'Green', 'Joshi', 'Harris', 'Banerjee', 'Cooper', 'Kaur', 'King', 'Kapoor',
            'Lee', 'Mukherjee', 'Martin', 'Bhat', 'Clarke', 'Chatterjee', 'James', 'Agarwal'
        ];

        $ukStreets = [
            'High Street', 'Church Lane', 'Station Road', 'Victoria Road', 'Green Lane',
            'Manor Road', 'Park Avenue', 'Crescent Road', 'Kings Road', 'Queensway',
            'Windsor Close', 'Reading Road', 'Langley Drive', 'Basingstoke Way', 'Sutton Grove',
            'Cavendish Road', 'Oxford Road', 'Cambridge Close', 'Chesterfield Way', 'Richmond Hill'
        ];

        $cities = [
            1 => ['Reading', 'RG1 5RQ'],
            2 => ['Slough / Langley', 'SL3 7EF'],
            3 => ['Basingstoke', 'RG21 3HF'],
            4 => ['Sutton', 'SM1 4AS'],
            5 => ['Manchester', 'WA14 2NP'],
        ];

        $dobsByYear = [
            'Year 3' => ['2018-09-02', '2019-08-28'],
            'Year 4' => ['2017-09-03', '2018-08-25'],
            'Year 5' => ['2016-09-05', '2017-08-29'],
            'Year 6' => ['2015-09-02', '2016-08-27'],
            'Year 7' => ['2014-09-04', '2015-08-26'],
            'Year 8' => ['2013-09-02', '2014-08-28'],
            'Year 9' => ['2012-09-03', '2013-08-29'],
            'Year 10' => ['2011-09-05', '2012-08-24'],
            'Year 11' => ['2010-09-02', '2011-08-27'],
            'Year 12' => ['2009-09-04', '2010-08-28'],
            'Year 13' => ['2008-09-03', '2009-08-29'],
            'GCSE' => ['2010-09-05', '2012-08-25'],
            'A-Level' => ['2008-09-02', '2010-08-28'],
        ];

        $allStudents = [];
        $globalRoll = 1001;

        foreach ($courses as $course) {
            // Target count between 315 and 335 students per class
            $studentCount = rand(315, 335);

            // Determine DOB bounds for this course
            $yearKey = 'Year 5';
            foreach (array_keys($dobsByYear) as $yk) {
                if (str_contains($course->code, $yk) || str_contains($course->name, $yk)) {
                    $yearKey = $yk;
                    break;
                }
            }
            $dobRange = $dobsByYear[$yearKey] ?? ['2016-09-05', '2017-08-29'];
            $startDate = Carbon::parse($dobRange[0]);
            $endDate = Carbon::parse($dobRange[1]);
            $diffDays = $startDate->diffInDays($endDate);

            // Prefix for roll no (e.g. Y3, Y4, Y5, Y6, Y10, GCSE, AL)
            $codeClean = strtoupper(str_replace([' ', '-', '(', ')', '+'], '', $course->code));

            for ($i = 1; $i <= $studentCount; $i++) {
                $fName = $firstNames[array_rand($firstNames)];
                $lName = $lastNames[array_rand($lastNames)];
                $fullName = $fName . ' ' . $lName;

                $centreId = rand(1, 5);
                $cityInfo = $cities[$centreId];
                $street = (rand(1, 199)) . ', ' . $ukStreets[array_rand($ukStreets)] . ', ' . $cityInfo[0];

                // Random DOB inside valid school year range
                $randomDob = $startDate->copy()->addDays(rand(0, $diffDays))->format('Y-m-d');

                $rollNumber = 100000 + ($course->id * 1000) + $i;
                $cleanEmail = strtolower($fName . '.' . $lName . rand(10, 99) . '@xleducation.co.uk');
                $phoneNo = 7700900000 + ($course->id * 1000) + $i;

                $allStudents[] = [
                    'name' => $fullName,
                    'roll no' => $rollNumber,
                    'dob' => $randomDob,
                    'course_id' => $course->id,
                    'centre_id' => $centreId,
                    'phone no' => $phoneNo,
                    'email adress' => $cleanEmail,
                    'adress' => $street . ', ' . $cityInfo[1],
                    'dp' => null,
                    'deleted_at' => null,
                ];

                $globalRoll++;

                // Bulk insert every 250 records for peak database performance
                if (count($allStudents) >= 250) {
                    DB::table('student')->insert($allStudents);
                    $allStudents = [];
                }
            }
        }

        // Insert any remaining batch
        if (!empty($allStudents)) {
            DB::table('student')->insert($allStudents);
        }
    }

    public function down(): void
    {
        DB::table('student')->truncate();
    }
};
