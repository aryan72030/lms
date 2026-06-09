<?php

namespace App\Services;

use App\Mail\CourseEnrollment;
use App\Mail\PaymentConfirmation;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use App\Services\NotificationService;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PayPalService
{
    private string $baseUrl;
    private string $clientId;
    private string $clientSecret;

    public function __construct()
    {
        $paypalSettings = Setting::getPayPalSettings();
        
        $this->baseUrl = $paypalSettings['mode'] === 'live' 
            ? 'https://api.paypal.com' 
            : 'https://api.sandbox.paypal.com';
        
        $this->clientId = $paypalSettings['client_id'] ?? config('services.paypal.client_id');
        $this->clientSecret = $paypalSettings['client_secret'] ?? config('services.paypal.client_secret');
    }

    /**
     * Get PayPal access token
     */
    private function getAccessToken(): ?string
    {
        try {
            $response = Http::withBasicAuth($this->clientId, $this->clientSecret)
                ->asForm()
                ->post("{$this->baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error('Failed to get PayPal access token', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;
        } catch (Exception $e) {
            Log::error('PayPal access token request failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create PayPal order for course enrollment
     */
    public function createOrder(User $student, Course $course, Enrollment $enrollment): array
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return ['success' => false, 'error' => 'Failed to authenticate with PayPal'];
            }

            $orderData = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => "enrollment_{$enrollment->id}",
                        'description' => "Course: {$course->title}",
                        'amount' => [
                            'currency_code' => Setting::get('paypal_currency', 'USD'),
                            'value' => number_format($course->price, 2, '.', '')
                        ],
                        'custom_id' => (string) $enrollment->id
                    ]
                ],
                'application_context' => [
                    'brand_name' => config('app.name'),
                    'locale' => 'en-US',
                    'landing_page' => 'BILLING',
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'return_url' => route('paypal.success'),
                    'cancel_url' => route('paypal.cancel')
                ]
            ];

            $response = Http::withToken($accessToken)
                ->post("{$this->baseUrl}/v2/checkout/orders", $orderData);

            if ($response->successful()) {
                $orderResult = $response->json();

                // Create payment record
                $payment = Payment::create([
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                    'enrollment_id' => $enrollment->id,
                    'amount' => $course->price,
                    'currency' => Setting::get('paypal_currency', 'USD'),
                    'paypal_order_id' => $orderResult['id'],
                    'status' => Payment::STATUS_PENDING,
                    'payment_method' => Payment::METHOD_PAYPAL,
                    'paypal_response' => $orderResult
                ]);

                return [
                    'success' => true,
                    'order_id' => $orderResult['id'],
                    'approval_url' => $this->getApprovalUrl($orderResult['links']),
                    'payment_id' => $payment->id
                ];
            }

            Log::error('PayPal order creation failed', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create PayPal order'
            ];

        } catch (Exception $e) {
            Log::error('PayPal order creation failed', [
                'student_id' => $student->id,
                'course_id' => $course->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create PayPal order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Capture PayPal order payment
     */
    public function captureOrder(string $orderId): array
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                return ['success' => false, 'error' => 'Failed to authenticate with PayPal'];
            }

            // First, get the order details to check its status
            $orderResponse = Http::withToken($accessToken)
                ->get("{$this->baseUrl}/v2/checkout/orders/{$orderId}");

            if (!$orderResponse->successful()) {
                Log::error('Failed to get PayPal order details', [
                    'order_id' => $orderId,
                    'status' => $orderResponse->status(),
                    'response' => $orderResponse->body()
                ]);
                return ['success' => false, 'error' => 'Failed to get order details'];
            }

            $orderData = $orderResponse->json();
            Log::info('PayPal order details', [
                'order_id' => $orderId,
                'status' => $orderData['status'] ?? 'unknown',
                'intent' => $orderData['intent'] ?? 'unknown'
            ]);

            // Check if order is in the correct status for capture
            if (($orderData['status'] ?? '') !== 'APPROVED') {
                return [
                    'success' => false, 
                    'error' => 'Order is not approved for capture. Status: ' . ($orderData['status'] ?? 'unknown')
                ];
            }

            // Debug: Log the request details
            Log::info('PayPal capture request details', [
                'order_id' => $orderId,
                'url' => "{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture",
                'headers' => [
                    'Authorization' => 'Bearer [REDACTED]',
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ],
                'body' => '{}'
            ]);

            $response = Http::withToken($accessToken)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ])
                ->withBody('{}', 'application/json')
                ->post("{$this->baseUrl}/v2/checkout/orders/{$orderId}/capture");

            if ($response->successful()) {
                $captureResult = $response->json();
                
                // Eager load relationships to prevent missing data issues
                $payment = Payment::with(['enrollment.course', 'student', 'course'])
                    ->where('paypal_order_id', $orderId)
                    ->first();
                
                if (!$payment) {
                    throw new Exception('Payment record not found for order ID: ' . $orderId);
                }

                if ($captureResult['status'] === 'COMPLETED') {
                    // Update payment status
                    $payment->update([
                        'status' => Payment::STATUS_COMPLETED,
                        'paypal_payment_id' => $captureResult['purchase_units'][0]['payments']['captures'][0]['id'] ?? null,
                        'paypal_payer_id' => $captureResult['payer']['payer_id'] ?? null,
                        'paid_at' => now(),
                        'paypal_response' => $captureResult
                    ]);

                    // Update enrollment status using model method to ensure expiry_date is set
                    $enrollment = $payment->enrollment;
                    $enrollment->markAsPaid(
                        $captureResult['purchase_units'][0]['payments']['captures'][0]['id'] ?? 'N/A',
                        (float) $payment->amount
                    );

                    // Send payment confirmation and enrollment emails
                    $emailSettings = Setting::getEmailSettings();
                    if ($emailSettings['enabled']) {
                        try {
                            if ($emailSettings['types']['payment_confirmation']) {
                                Mail::to($payment->student->email)->send(new PaymentConfirmation($payment));
                            }
                            if ($emailSettings['types']['course_enrollment']) {
                                Mail::to($payment->student->email)->send(new CourseEnrollment($enrollment));
                            }
                        } catch (Exception $mailException) {
                            Log::error('Failed to send payment/enrollment emails: ' . $payment->student->email, [
                                'error' => $mailException->getMessage(),
                                'payment_id' => $payment->id
                            ]);
                        }
                    }

                    // Send Slack notification
                    try {
                        $notificationService = new NotificationService();
                        $notificationService->notifyPaymentConfirmation(
                            [
                                'name' => $payment->student->name,
                                'email' => $payment->student->email
                            ],
                            [
                                'title' => $payment->course->title
                            ],
                            [
                                'amount' => $payment->amount,
                                'currency' => $payment->currency,
                                'transaction_id' => $payment->paypal_payment_id
                            ]
                        );
                    } catch (Exception $slackException) {
                        Log::error('Failed to send Slack notification for payment', [
                            'error' => $slackException->getMessage(),
                            'payment_id' => $payment->id
                        ]);
                    }

                    return [
                        'success' => true,
                        'payment_id' => $payment->id,
                        'enrollment_id' => $enrollment->id
                    ];
                } else {
                    $payment->markAsFailed('PayPal capture failed: ' . $captureResult['status']);
                    
                    return [
                        'success' => false,
                        'error' => 'Payment capture failed'
                    ];
                }
            }

            Log::error('PayPal order capture failed', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to capture payment'
            ];

        } catch (Exception $e) {
            Log::error('PayPal order capture failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Failed to capture payment: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Extract approval URL from PayPal response links
     */
    private function getApprovalUrl(array $links): ?string
    {
        foreach ($links as $link) {
            if ($link['rel'] === 'approve') {
                return $link['href'];
            }
        }
        
        return null;
    }

    /**
     * Process PayPal webhook notifications
     */
    public function processWebhook(array $webhookData): array
    {
        try {
            $eventType = $webhookData['event_type'] ?? null;
            
            if (!$eventType) {
                return ['success' => false, 'error' => 'Missing event type'];
            }

            switch ($eventType) {
                case 'CHECKOUT.ORDER.APPROVED':
                    return $this->handleOrderApproved($webhookData);
                    
                case 'PAYMENT.CAPTURE.COMPLETED':
                    return $this->handlePaymentCaptured($webhookData);
                    
                case 'PAYMENT.CAPTURE.DENIED':
                case 'PAYMENT.CAPTURE.FAILED':
                    return $this->handlePaymentFailed($webhookData);
                    
                default:
                    Log::info('Unhandled PayPal webhook event', ['event_type' => $eventType]);
                    return ['success' => true, 'message' => 'Event acknowledged but not processed'];
            }
            
        } catch (Exception $e) {
            Log::error('PayPal webhook processing failed', [
                'error' => $e->getMessage(),
                'webhook_data' => $webhookData
            ]);
            
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Handle order approved webhook
     */
    private function handleOrderApproved(array $webhookData): array
    {
        // Log the approval for tracking
        Log::info('PayPal order approved', ['webhook_data' => $webhookData]);
        return ['success' => true, 'message' => 'Order approval logged'];
    }

    /**
     * Handle payment captured webhook
     */
    private function handlePaymentCaptured(array $webhookData): array
    {
        $resource = $webhookData['resource'] ?? [];
        $orderId = $resource['supplementary_data']['related_ids']['order_id'] ?? null;
        
        if (!$orderId) {
            return ['success' => false, 'error' => 'Missing order ID in webhook'];
        }

        $payment = Payment::where('paypal_order_id', $orderId)->first();
        
        if (!$payment) {
            return ['success' => false, 'error' => 'Payment record not found'];
        }

        // Update payment if not already completed
        if ($payment->status !== Payment::STATUS_COMPLETED) {
            $payment->update([
                'status' => Payment::STATUS_COMPLETED,
                'paypal_payment_id' => $resource['id'] ?? null,
                'paid_at' => now(),
                'paypal_response' => $webhookData
            ]);

            // Update enrollment
            $enrollment = $payment->enrollment;
            $enrollment->update([
                'payment_status' => Enrollment::PAYMENT_STATUS_COMPLETED,
                'status' => Enrollment::STATUS_ACTIVE
            ]);
        }

        return ['success' => true, 'message' => 'Payment captured and processed'];
    }

    /**
     * Handle payment failed webhook
     */
    private function handlePaymentFailed(array $webhookData): array
    {
        $resource = $webhookData['resource'] ?? [];
        $orderId = $resource['supplementary_data']['related_ids']['order_id'] ?? null;
        
        if (!$orderId) {
            return ['success' => false, 'error' => 'Missing order ID in webhook'];
        }

        $payment = Payment::where('paypal_order_id', $orderId)->first();
        
        if ($payment) {
            $payment->markAsFailed('PayPal webhook: Payment failed or denied');
        }

        return ['success' => true, 'message' => 'Payment failure processed'];
    }
}