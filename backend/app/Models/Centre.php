<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Centre extends Model
{
    use HasFactory;

    protected $table = 'centres';

    protected $fillable = [
        'location_id',
        'centre_name',
        'address',
        'postcode',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id', 'id');
    }

    public function timingSlots()
    {
        return $this->hasMany(CentreTimingSlot::class, 'centre_id', 'id');
    }

    /**
     * Scope: Only active centres
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Model Method: Get all active centres with available timing slots
     */
    public static function getActiveCentresWithSlots(): array
    {
        return static::active()
            ->with(['timingSlots' => function ($q) {
                $q->where('is_available', true)->orderBy('day_of_week')->orderBy('time_start');
            }])
            ->orderBy('centre_name')
            ->get()
            ->toArray();
    }

    /**
     * Model Method: Match centre ID by centre name or location city name
     */
    public static function findMatchingCentre(?string $centreName): ?int
    {
        if (!$centreName) {
            return null;
        }

        return static::where('centre_name', $centreName)
            ->orWhere('centre_name', 'like', '%' . explode(' ', $centreName)[0] . '%')
            ->orWhereHas('location', function ($lq) use ($centreName) {
                $lq->where('city_name', 'like', '%' . $centreName . '%');
            })
            ->value('id');
    }
}
