<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment Refunded</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .refund-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Refunded</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $enrollment->student->name }},</h2>
            
            <p>This is to inform you that your payment for the course <strong>{{ $enrollment->course->title }}</strong> has been refunded.</p>
            
            <div class="refund-info">
                <h3>Refund Details:</h3>
                <p><strong>Course:</strong> {{ $enrollment->course->title }}</p>
                <p><strong>Amount Refunded:</strong> {{ number_format($enrollment->amount_paid, 2) }}</p>
                <p><strong>Refund Date:</strong> {{ now()->format('M d, Y H:i') }}</p>
                <p><strong>Reason:</strong> {{ $reason }}</p>
            </div>
            
            <p>Your enrollment for this course has been deactivated. The refund should appear in your account within 5-10 business days, depending on your bank's processing time.</p>
            
            <p>If you have any questions or did not request this refund, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $enrollment->student->email }}.</p>
        </div>
    </div>
</body>
</html>
