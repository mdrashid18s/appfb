<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Location extends Model
{
    use HasFactory;

    protected $table = 'locations';

    protected $fillable = [
        'city_name',
        'region',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function centres()
    {
        return $this->hasMany(Centre::class, 'location_id', 'id');
    }

    /**
     * Scope: Only active locations
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Model Method: Get active locations with their active centres and real-time timing slots,
     * with optional filtering by Course/School Year.
     */
    /**
     * Helper: Detect School Year and Course Category from Course String
     */
    public static function detectSchoolYear(?string $course): array
    {
        $yearFilter = null;
        $isGcse = false;

        if ($course) {
            $isGcse = (bool) preg_match('/GCSE|Year\s*(7|8|9|10|11)/i', $course);

            $years = ['Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'GCSE', 'A-Level'];
            foreach ($years as $y) {
                if (stripos($course, $y) !== false) {
                    $yearFilter = $y;
                    break;
                }
            }
        }

        return [$yearFilter, $isGcse];
    }

    /**
     * Standard Addons (Single Source of Truth)
     */
    public static function getAddons(): array
    {
        return [
            ['id' => 498, 'group_name' => 'MON 1800', 'day' => 1, 'start_time' => 'Monday 18:00 to 19:00 (Online)'],
            ['id' => 500, 'group_name' => 'TUE 1800', 'day' => 2, 'start_time' => 'Tuesday 18:00 to 19:00 (Online)'],
            ['id' => 502, 'group_name' => 'WED 1800', 'day' => 3, 'start_time' => 'Wednesday 18:00 to 19:00 (Online)'],
            ['id' => 504, 'group_name' => 'THU 1800', 'day' => 4, 'start_time' => 'Thursday 18:00 to 19:00 (Online)'],
        ];
    }

    /**
     * Creativity Addons (Single Source of Truth)
     */
    public static function getCreativityAddons(): array
    {
        return [
            ['id' => 615, 'group_name' => 'MON 1700', 'day' => 1, 'start_time' => 'Monday 17:00 to 18:00 (Online)'],
            ['id' => 617, 'group_name' => 'WED 1700', 'day' => 3, 'start_time' => 'Wednesday 17:00 to 18:00 (Online)'],
        ];
    }

    /**
     * Model Method: Get complete Course & Location hierarchy structure
     */
    public static function getHierarchyForCourse(?string $course = null): array
    {
        [$yearFilter, $isGcse] = static::detectSchoolYear($course);
        $isYear3Or2 = in_array($yearFilter, ['Year 2', 'Year 3'], true);

        $locations = static::active()
            ->with(['centres' => function ($cq) use ($yearFilter) {
                $cq->where('is_active', true)->with(['timingSlots' => function ($tq) use ($yearFilter) {
                    if ($yearFilter) {
                        $tq->where(function ($sub) use ($yearFilter) {
                            $sub->whereNull('school_year')
                                ->orWhere('school_year', 'like', '%' . $yearFilter . '%');
                        });
                    }
                    $tq->orderBy('day_of_week')
                       ->orderBy('time_start');
                }]);
            }])
            ->orderBy('city_name')
            ->get();

        $locationsHierarchy = $locations->map(function ($loc) use ($isYear3Or2) {
            $daysMap = [];
            foreach ($loc->centres as $centre) {
                foreach ($centre->timingSlots as $slot) {
                    $dayNum = CentreTimingSlot::getDayNumber($slot->day_of_week);
                    $dayText = trim($slot->day_of_week ?: 'Saturday');

                    if (!isset($daysMap[$dayNum])) {
                        $daysMap[$dayNum] = [
                            'day'      => $dayNum,
                            'day_text' => $dayText,
                            'sessions' => [],
                        ];
                    }

                    $daysMap[$dayNum]['sessions'][] = $slot->toHierarchySessionArray();
                }
            }
            ksort($daysMap);

            $modes = [
                [
                    'id'   => 13,
                    'name' => 'Classroom',
                    'days' => array_values($daysMap),
                ]
            ];

            if (!$isYear3Or2) {
                $modes[] = [
                    'id'   => 14,
                    'name' => 'Online Live',
                    'days' => [
                        [
                            'day'      => 6,
                            'day_text' => 'Saturday',
                            'sessions' => [
                                ['id' => 401, 'timing' => '09:30 to 12:00', 'is_full' => 0, 'remaining_seats' => 50],
                                ['id' => 402, 'timing' => '14:00 to 16:30', 'is_full' => 0, 'remaining_seats' => 50],
                            ]
                        ],
                        [
                            'day'      => 7,
                            'day_text' => 'Sunday',
                            'sessions' => [
                                ['id' => 403, 'timing' => '09:30 to 12:00', 'is_full' => 0, 'remaining_seats' => 50],
                                ['id' => 404, 'timing' => '14:00 to 16:30', 'is_full' => 0, 'remaining_seats' => 50],
                            ]
                        ]
                    ]
                ];
            }

            $modes[] = [
                'id'          => 15,
                'name'        => 'DIY',
                'description' => 'Self-study digital access & weekly test portal'
            ];

            return [
                'id'    => $loc->id,
                'name'  => $loc->city_name,
                'modes' => $modes,
            ];
        })->values()->toArray();

        return [
            'status' => 1,
            'course' => [
                'name'        => $course ?: 'Year 5 – 11+ Preparation',
                'course_type' => $isGcse ? 'GCSE' : 'Primary',
                'locations'   => $locationsHierarchy,
            ],
            'addons'            => static::getAddons(),
            'creativity_addons' => static::getCreativityAddons(),
        ];
    }
}
