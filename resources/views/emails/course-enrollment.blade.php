<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Course Enrollment Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .course-info { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Enrollment Successful!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $enrollment->student->name }},</h2>
            
            <p>Congratulations! You have successfully enrolled in the course: <strong>{{ $enrollment->course->title }}</strong>.</p>
            
            <div class="course-info">
                <h3>Course Details:</h3>
                <p><strong>Course:</strong> {{ $enrollment->course->title }}</p>
                <p><strong>Instructor:</strong> {{ $enrollment->course->instructor->name }}</p>
                <p><strong>Enrollment Date:</strong> {{ $enrollment->created_at->format('M d, Y') }}</p>
                <p><strong>Price:</strong> {{ $enrollment->course->price > 0 ? '$' . number_format($enrollment->course->price, 2) : 'Free' }}</p>
            </div>
            
            <p>You can now start your learning journey. Click the button below to access the course materials.</p>
            
            <a href="{{ config('app.url') }}/student/enrollments/{{ $enrollment->id }}" class="button">Start Learning Now</a>
            
            <h3>What you'll learn:</h3>
            <p>{{ Str::limit($enrollment->course->description, 150) }}</p>
            
            <p>If you have any questions, feel free to reach out to your instructor or our support team.</p>
            
            <p>Happy learning!<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $enrollment->student->email }}.</p>
        </div>
    </div>
</body>
</html>
