<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PayPalController extends Controller
{
    private PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Create PayPal payment order
     */
    public function createPayment(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'enrollment_id' => 'required|exists:enrollments,id'
        ]);

        $user = Auth::user();
        $course = Course::findOrFail($request->course_id);
        $enrollment = Enrollment::findOrFail($request->enrollment_id);

        // Verify enrollment belongs to user
        if ($enrollment->student_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized enrollment access'
            ], 403);
        }

        // Verify course is published and has price
        if ($course->status !== Course::STATUS_PUBLISHED || $course->price <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Course is not available for payment'
            ], 400);
        }

        // Create PayPal order
        $result = $this->paypalService->createOrder($user, $course, $enrollment);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'order_id' => $result['order_id'],
                'approval_url' => $result['approval_url'],
                'payment_id' => $result['payment_id']
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['error']
        ], 500);
    }

    /**
     * Handle PayPal payment success
     */
    public function paymentSuccess(Request $request)
    {
        $orderId = $request->query('token');
        $payerId = $request->query('PayerID');

        if (!$orderId) {
            return Inertia::render('PaymentResult', [
                'success' => false,
                'message' => 'Invalid payment parameters'
            ]);
        }

        // Capture the payment
        $result = $this->paypalService->captureOrder($orderId);

        if ($result['success']) {
            $payment = Payment::find($result['payment_id']);
            $enrollment = Enrollment::find($result['enrollment_id']);

            return Inertia::render('PaymentResult', [
                'success' => true,
                'message' => 'Payment completed successfully!',
                'course' => $enrollment->course->only(['id', 'title', 'slug']),
                'enrollment_id' => $enrollment->id,
                'payment_amount' => $payment->amount
            ]);
        }

        return Inertia::render('PaymentResult', [
            'success' => false,
            'message' => $result['error']
        ]);
    }

    /**
     * Handle PayPal payment cancellation
     */
    public function paymentCancel(Request $request)
    {
        $orderId = $request->query('token');

        if ($orderId) {
            // Mark payment as cancelled
            $payment = Payment::where('paypal_order_id', $orderId)->first();
            if ($payment) {
                $payment->update(['status' => Payment::STATUS_CANCELLED]);
            }
        }

        return Inertia::render('PaymentResult', [
            'success' => false,
            'message' => 'Payment was cancelled. You can try again anytime.',
            'cancelled' => true
        ]);
    }

    /**
     * Handle PayPal webhooks
     */
    public function webhook(Request $request)
    {
        try {
            $webhookData = $request->all();
            
            Log::info('PayPal webhook received', [
                'event_type' => $webhookData['event_type'] ?? 'unknown',
                'webhook_id' => $webhookData['id'] ?? 'unknown'
            ]);

            $result = $this->paypalService->processWebhook($webhookData);

            if ($result['success']) {
                return response()->json(['status' => 'success'], 200);
            }

            return response()->json(['status' => 'error', 'message' => $result['error']], 400);

        } catch (\Exception $e) {
            Log::error('PayPal webhook processing failed', [
                'error' => $e->getMessage(),
                'webhook_data' => $request->all()
            ]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * Get payment status
     */
    public function getPaymentStatus(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|exists:payments,id'
        ]);

        $payment = Payment::with(['course', 'enrollment'])->findOrFail($request->payment_id);

        // Verify payment belongs to authenticated user
        if ($payment->student_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'paid_at' => $payment->paid_at,
                'course' => $payment->course->only(['id', 'title']),
                'enrollment_id' => $payment->enrollment_id
            ]
        ]);
    }
}