<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;

/**
 * Class NotificationController
 * 
 * Yeh controller Student aur Admin ke real-time notifications manage karta hai:
 *   1. Recipient ke role aur roll number ke hisaab se unread aur recent notifications fetch karna.
 *   2. Single notification ko 'read' mark karna.
 *   3. Sabhi notifications ko ek sath 'read' mark karna.
 * 
 * Note: Fat Model & Skinny Controller principle follow kiya gaya hai (Query logic Notification Model me hai).
 */
class NotificationController extends Controller
{
    /**
     * Student ya Admin ke notifications aur unread count return karta hai.
     * GET /api/notifications?role=student&roll_no=101
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNotifications(Request $request)
    {
        $role = $request->query('role', 'student');
        $rollNo = $request->query('roll_no');

        // Eloquent Model helper method se recipient ke notifications fetch karna
        $notifications = Notification::getForRecipient($role, $rollNo);
        // Live unread notifications ki count nikalna
        $unreadCount = $notifications->where('is_read', false)->count();

        return response()->json([
            'success'       => true,
            'unread_count'  => $unreadCount,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Kisi single notification ko 'read' mark karta hai.
     * POST /api/notifications/{id}/read
     *
     * @param Request $request
     * @param int|string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    /**
     * User ke sabhi unread notifications ko ek sath 'read' mark karta hai.
     * POST /api/notifications/mark-all-read
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $role = $request->input('role', 'student');
        $rollNo = $request->input('roll_no');

        // Model helper function call karke bulk update karna
        Notification::markAllAsReadForRecipient($role, $rollNo);

        return response()->json(['success' => true]);
    }
}
