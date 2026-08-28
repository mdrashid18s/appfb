<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CentreTimingSlot extends Model
{
    use HasFactory;

    protected $table = 'centre_timing_slots';

    protected $fillable = [
        'centre_id',
        'school_year',
        'day_of_week',
        'session_timing',
        'time_start',
        'time_end',
        'max_seats',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'max_seats'    => 'integer',
    ];

    public const DAYS_MAP = [
        'monday'    => 1,
        'tuesday'   => 2,
        'wednesday' => 3,
        'thursday'  => 4,
        'friday'    => 5,
        'saturday'  => 6,
        'sunday'    => 7,
    ];

    public static function getDayNumber(?string $dayText): int
    {
        $key = strtolower(trim((string)$dayText));
        return self::DAYS_MAP[$key] ?? 6; // Default Saturday
    }

    public function getFormattedTiming(): string
    {
        if (!empty($this->session_timing)) {
            return $this->session_timing;
        }
        if (!empty($this->time_start) && !empty($this->time_end)) {
            return substr($this->time_start, 0, 5) . ' to ' . substr($this->time_end, 0, 5);
        }
        return '10:00 to 13:00';
    }

    public function toHierarchySessionArray(): array
    {
        return [
            'id'              => $this->id,
            'timing'          => $this->getFormattedTiming(),
            'is_full'         => $this->isFull() ? 1 : 0,
            'remaining_seats' => $this->getRemainingSeats(),
        ];
    }

    public function centre()
    {
        return $this->belongsTo(Centre::class, 'centre_id', 'id');
    }

    /**
     * Calculate total booked seats (Active students + Confirmed/Pending registrations)
     */
    public function getBookedSeatsCount(): int
    {
        $studentCount = Student::where('centre_id', $this->centre_id)
            ->where('preferred_day', $this->day_of_week)
            ->where('preferred_session', $this->session_timing)
            ->count();

        $regCount = StudentRegistration::where('centre_id', $this->centre_id)
            ->where('preferred_day', $this->day_of_week)
            ->where('preferred_session', $this->session_timing)
            ->whereIn('status', ['pending', 'confirmed', 'enrolled'])
            ->count();

        return $studentCount + $regCount;
    }

    /**
     * Calculate remaining seats
     */
    public function getRemainingSeats(): int
    {
        $max = $this->max_seats ?? 30;
        return max(0, $max - $this->getBookedSeatsCount());
    }

    /**
     * Check if slot is fully booked
     */
    public function isFull(): bool
    {
        return $this->getRemainingSeats() <= 0;
    }

    /**
     * Convert slot into a normalized API array representation
     */
    public function toSlotArray(): array
    {
        $maxSeats = $this->max_seats ?? 30;
        $bookedSeats = $this->getBookedSeatsCount();
        $remainingSeats = max(0, $maxSeats - $bookedSeats);
        $isFull = ($remainingSeats <= 0);

        return [
            'id'              => $this->id,
            'centre_id'       => $this->centre_id,
            'school_year'     => $this->school_year,
            'day_of_week'     => $this->day_of_week,
            'session_timing'  => $this->session_timing,
            'time_start'      => $this->time_start,
            'time_end'        => $this->time_end,
            'max_seats'       => $maxSeats,
            'booked_seats'    => $bookedSeats,
            'remaining_seats' => $remainingSeats,
            'is_full'         => $isFull,
            'is_available'    => (bool)$this->is_available,
        ];
    }

    /**
     * Model Method: Create a new timing slot for a centre
     */
    public static function createSlot(array $data): self
    {
        return static::create([
            'centre_id'      => $data['centre_id'],
            'school_year'    => $data['school_year'] ?? 'Year 5',
            'day_of_week'    => $data['day_of_week'] ?? 'Saturday',
            'session_timing' => $data['session_timing'] ?? '09:00 to 12:30',
            'time_start'     => $data['time_start'] ?? '09:00:00',
            'time_end'       => $data['time_end'] ?? '12:30:00',
            'max_seats'      => $data['max_seats'] ?? 150,
            'is_available'   => $data['is_available'] ?? true,
        ]);
    }

    /**
     * Model Method: Update slot capacity and availability
     */
    public function updateSlot(array $data): bool
    {
        return $this->update([
            'school_year'    => $data['school_year'] ?? $this->school_year,
            'day_of_week'    => $data['day_of_week'] ?? $this->day_of_week,
            'session_timing' => $data['session_timing'] ?? $this->session_timing,
            'max_seats'      => $data['max_seats'] ?? $this->max_seats,
            'is_available'   => isset($data['is_available']) ? (bool)$data['is_available'] : $this->is_available,
        ]);
    }
}
