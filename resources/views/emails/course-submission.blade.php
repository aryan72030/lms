<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Course Submission for Review</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .submission-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 20px 0; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Course Submitted!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $course->instructor->name }},</h2>
            
            <p>Your course, <strong>{{ $course->title }}</strong>, has been successfully submitted for review!</p>
            
            <div class="submission-info">
                <h3>Submission Details:</h3>
                <p><strong>Course Title:</strong> {{ $course->title }}</p>
                <p><strong>Submitted Date:</strong> {{ $course->submitted_at->format('M d, Y H:i') }}</p>
                <p><strong>Status:</strong> Under Review</p>
            </div>
            
            <p>Our administrators will review your course content and ensure it meets our quality standards. You will be notified via email once the review is complete.</p>
            
            <p>During the review process, the course will be in "Under Review" status and cannot be edited. If any changes are required, we will let you know.</p>
            
            <a href="{{ config('app.url') }}/instructor/courses" class="button">Go to Dashboard</a>
            
            <p>Thank you for contributing to our platform!</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $course->instructor->email }}.</p>
        </div>
    </div>
</body>
</html>
