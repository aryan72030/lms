<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to {{ config('app.name') }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{ config('app.name') }}!</h1>
        </div>
        
        <div class="content">
            <h2>Hello {{ $user->name }},</h2>
            
            <p>Your account has been successfully created! We're excited to have you join our learning management system.</p>
            
            <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> {{ $user->email }}</p>
                <p><strong>Password:</strong> {{ $password }}</p>
                <p><strong>Role:</strong> {{ ucfirst($user->role) }}</p>
            </div>
            
            <p><strong>Important:</strong> For security reasons, please log in and change your password as soon as possible.</p>
            
            <a href="{{ config('app.url') }}/login" class="button">Login to Your Account</a>
            
            <h3>What's Next?</h3>
            <ul>
                @if($user->role === 'student')
                    <li>Browse available courses</li>
                    <li>Enroll in courses that interest you</li>
                    <li>Track your learning progress</li>
                @elseif($user->role === 'instructor')
                    <li>Create and manage your courses</li>
                    <li>Upload lessons and materials</li>
                    <li>Track student progress</li>
                @else
                    <li>Manage users and courses</li>
                    <li>Monitor system activity</li>
                    <li>Configure system settings</li>
                @endif
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The {{ config('app.name') }} Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent to {{ $user->email }}. If you didn't expect this email, please contact support.</p>
        </div>
    </div>
</body>
</html>