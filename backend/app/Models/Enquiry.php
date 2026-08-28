<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enquiry extends Model
{
    use HasFactory;

    public const STATUS_NEW         = 'new';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_REPLIED     = 'replied';
    public const STATUS_CLOSED      = 'closed';

    public const TYPE_GENERAL       = 'general';
    public const TYPE_BRANCH        = 'branch_enquiry';
    public const TYPE_FRANCHISE     = 'franchise_enquiry';
    public const TYPE_PARENT_MSG    = 'parent_message';

    protected $table = 'enquiries';

    protected $fillable = [
        'parent_name',
        'email',
        'phone',
        'child_year',
        'branch',
        'subject',
        'message',
        'type',
        'status',
        'admin_reply',
    ];

    /**
     * Scope for filtering by branch or type
     */
    public function scopeForBranch($query, ?string $branch)
    {
        if ($branch) {
            return $query->where('branch', $branch);
        }
        return $query;
    }

    /**
     * Model Method: Get all enquiries with optional status/branch filter
     */
    public static function getAllEnquiries(?string $status = null, ?string $branch = null)
    {
        $query = static::query()->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($branch && $branch !== 'all') {
            $query->where('branch', $branch);
        }

        return $query->get();
    }

    /**
     * Model Method: Submit a new enquiry/parent message
     */
    public static function createEnquiry(array $data): self
    {
        return static::create([
            'parent_name' => $data['parent_name'] ?? 'Parent',
            'email'       => $data['email'],
            'phone'       => $data['phone'] ?? null,
            'child_year'  => $data['child_year'] ?? null,
            'branch'      => $data['branch'] ?? 'General',
            'subject'     => $data['subject'] ?? 'General Enquiry',
            'message'     => $data['message'],
            'type'        => $data['type'] ?? 'general',
            'status'      => 'new',
        ]);
    }

    /**
     * Model Method: Reply to an enquiry
     */
    public function reply(string $replyMessage): bool
    {
        $this->admin_reply = $replyMessage;
        $this->status = 'replied';
        return $this->save();
    }
}
