<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Course Rejection</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .reason { border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; background-color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Action Required on Your Course</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $course->instructor->name }},</h2>
            
            <p>Thank you for submitting your course, <strong>{{ $course->title }}</strong>, for review. After careful consideration, we have determined that it requires some revisions before it can be published.</p>
            
            <div class="info">
                <h3>Rejection Reason:</h3>
                <div class="reason">
                    <p>{{ $course->rejection_reason }}</p>
                </div>
            </div>
            
            <p>Your course has been returned to "Draft" status so you can make the necessary changes. Please review the feedback above and update your course accordingly.</p>
            
            <a href="{{ config('app.url') }}/instructor/courses" class="button">Edit Your Course</a>
            
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $course->instructor->email }}.</p>
        </div>
    </div>
</body>
</html>
