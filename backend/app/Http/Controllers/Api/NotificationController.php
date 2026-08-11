<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\Student;
use App\Models\Homework;
use App\Models\Notice;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Fetch notifications for student or admin
     */
    public function getNotifications(Request $request)
    {
        $role = $request->query('role', 'student'); // 'student' or 'admin'
        $rollNo = $request->query('roll_no');

        if ($role === 'admin') {
            $notifications = Notification::whereIn('recipient_type', ['admin', 'all'])
                ->orderBy('created_at', 'desc')
                ->take(30)
                ->get();
        } else {
            $query = Notification::whereIn('recipient_type', ['student', 'all']);
            if ($rollNo) {
                $query->where(function ($q) use ($rollNo) {
                    $q->whereNull('roll_no')
                      ->orWhere('roll_no', $rollNo);
                });
            }
            $notifications = $query->orderBy('created_at', 'desc')
                ->take(30)
                ->get();
        }

        $unreadCount = $notifications->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a single notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->is_read = true;
            $notification->save();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $role = $request->input('role', 'student');
        $rollNo = $request->input('roll_no');

        $query = Notification::query();
        if ($role === 'admin') {
            $query->whereIn('recipient_type', ['admin', 'all']);
        } else {
            $query->whereIn('recipient_type', ['student', 'all']);
            if ($rollNo) {
                $query->where(function ($q) use ($rollNo) {
                    $q->whereNull('roll_no')->orWhere('roll_no', $rollNo);
                });
            }
        }

        $query->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}
