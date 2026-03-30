<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Course Completion Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fbbf24; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .completion-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #fbbf24; margin: 20px 0; }
        .button { display: inline-block; background: #fbbf24; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Congratulations!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $enrollment->student->name }},</h2>
            
            <p>We're thrilled to congratulate you on successfully completing the course: <strong>{{ $enrollment->course->title }}</strong>!</p>
            
            <div class="completion-info">
                <h3>Course Completion Details:</h3>
                <p><strong>Course:</strong> {{ $enrollment->course->title }}</p>
                <p><strong>Completion Date:</strong> {{ $enrollment->completion_date->format('M d, Y') }}</p>
                <p><strong>Instructor:</strong> {{ $enrollment->course->instructor->name }}</p>
                <p><strong>Total Progress:</strong> 100%</p>
            </div>
            
            <p>Your hard work and dedication have paid off. You can now view and download your certificate of completion.</p>
            
            <a href="{{ config('app.url') }}/student/certificates" class="button">View Certificate</a>
            
            <h3>What's Next?</h3>
            <p>Ready for more? Explore our other courses to continue growing your skills and knowledge.</p>
            
            <p>Well done again on this achievement!<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $enrollment->student->email }}.</p>
        </div>
    </div>
</body>
</html>
