<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .payment-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Successful!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $payment->student->name }},</h2>
            
            <p>Thank you for your payment! Your transaction has been successfully processed and your enrollment is now active.</p>
            
            <div class="payment-info">
                <h3>Payment Details:</h3>
                <p><strong>Course:</strong> {{ $payment->course->title }}</p>
                <p><strong>Transaction ID:</strong> {{ $payment->paypal_payment_id }}</p>
                <p><strong>Amount Paid:</strong> {{ number_format($payment->amount, 2) }} {{ $payment->currency }}</p>
                <p><strong>Payment Date:</strong> {{ $payment->paid_at->format('M d, Y H:i') }}</p>
                <p><strong>Payment Method:</strong> {{ $payment->payment_method }}</p>
            </div>
            
            <p>You can now access all course materials and start learning.</p>
            
            <a href="{{ config('app.url') }}/student/enrollments/{{ $payment->enrollment_id }}" class="button">Go to Course</a>
            
            <p>If you have any questions or concerns about your payment, please reply to this email or contact support.</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $payment->student->email }}.</p>
        </div>
    </div>
</body>
</html>
