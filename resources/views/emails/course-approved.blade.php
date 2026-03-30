<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Course Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0; }
        .button { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Congratulations! Your Course is Approved!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $course->instructor->name }},</h2>
            
            <p>Great news! Your course, <strong>{{ $course->title }}</strong>, has been approved and is now published on our platform.</p>
            
            <div class="info">
                <h3>Course Details:</h3>
                <p><strong>Course Title:</strong> {{ $course->title }}</p>
                <p><strong>Status:</strong> Published</p>
                <p><strong>Published Date:</strong> {{ $course->published_at->format('M d, Y H:i') }}</p>
            </div>
            
            <p>Students can now enroll in your course. We are excited to see the impact your course will have on our learning community.</p>
            
            <a href="{{ config('app.url') }}/instructor/courses" class="button">View Your Course</a>
            
            <p>Thank you for your contribution!</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $course->instructor->email }}.</p>
        </div>
    </div>
</body>
</html>
