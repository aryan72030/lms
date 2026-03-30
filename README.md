# Learning Management System (LMS) - Project Documentation

## 1. Project Overview
**What is the system?**
The Learning Management System (LMS) is a complete online education platform. It acts like a virtual school where teachers can share their knowledge and students can learn new skills from their own homes.

**The Purpose in Simple Words**
The main goal is to make learning easy and organized. Instead of traditional classrooms, this system allows teachers to upload videos and notes, and students can study them at their own pace, take tests, and get certificates when they finish.

---

## 2. Technology Overview
The system is built using the following modern tools:
- **Backend**: Laravel
- **Frontend**: React
- **Database**: MySQL

---

## 3. User Roles
The system is divided into three main roles, each having different jobs:

- **Admin (The Manager)**: The person who controls the entire platform. They manage users, approve courses, and make sure everything is working correctly.
- **Instructor (The Teacher)**: The person who creates the educational content. They upload lessons, create quizzes, and help students with their learning.
- **Student (The Learner)**: The person who uses the platform to learn. They can buy courses, watch lessons, and earn certificates.

---

## 4. Modules / Features
- **Authentication & Security**: A secure way for users to sign up and log in. It includes **Two-Factor Authentication (2FA)** for extra safety.
- **Course Management**: Tools for teachers to organize their teaching material into sections and lessons.
- **Dashboard**: A personal homepage for every user to see their activities and progress.
- **Quiz & Assignment**: Interactive tests and homework to check if the student has understood the lesson.
- **Payment Gateway**: A safe system to buy courses using online payment methods like **PayPal**.
- **Wishlist**: A feature to save courses for later if you are not ready to buy them yet.
- **Reviews & Ratings**: A section where students can share their experience and give a rating to the course.
- **Email Notifications**: Automated emails sent to users for things like "Welcome," "Course Approved," or "Payment Successful."

---

## 5. Workflow (Step-by-Step)
1. **Registration**: A new user creates an account by filling in their details.
2. **Login**: The user enters their email and password to enter the system.
3. **Two-Factor Authentication (Optional)**: For extra security, users can enable 2FA to protect their account.
4. **Course Creation (Instructor)**: A teacher creates a new course, adds videos or text, and sends it to the Admin.
5. **Approval (Admin)**: The Admin reviews the course and makes it live for students to see.
6. **Enrollment (Student)**: A student finds a course they like and signs up for it.
7. **Payment**: If it's a paid course, the student pays via PayPal.
8. **Learning**: The student starts watching the lessons one by one.
9. **Assessment**: The student takes a quiz or submits an assignment at the end of a lesson.
10. **Grading (Instructor)**: The teacher reviews and grades the student's assignment.
11. **Completion**: Once all lessons are finished, the course is marked as complete.
12. **Certificate**: The student can download their certificate of completion.

---

## 6. Forms & Fields
The system uses simple forms to collect information:
- **Sign-Up Form**: Name, Email, Password, Phone Number, Date of Birth.
- **Course Form**: Course Title, Description, Price, Thumbnail Image, Language, Difficulty Level.
- **Lesson Form**: Lesson Title, Content Type (Video/Text/Quiz), Video URL, Text Content, Estimated Duration.
- **Quiz Form**: Quiz Title, Time Limit, Passing Score, Max Attempts.
- **Payment Settings Form**: PayPal Client ID, Secret, Mode (Sandbox/Live), Currency.
- **Profile Form**: Allows users to upload a profile picture and write a short bio.

---

## 7. Dashboard Overview
- **Admin Dashboard**: Shows total number of students, teachers, and total money earned. It also shows courses waiting for approval and system-wide statistics.
- **Instructor Dashboard**: Shows a list of their courses, how many students have joined, and student assignments that need grading.
- **Student Dashboard**: Shows the courses they are currently learning, their quiz results, and their certificates.

---

## 8. Additional Features
- **Progress Tracking**: A simple progress bar that shows how much of the course is finished (e.g., 50% complete).
- **Certificate Generation**: A professional PDF document that students can download after finishing a course.
- **Notifications (Email)**: Automatic emails sent for:
    - Welcome / User Created
    - Course Submission
    - Course Approval / Rejection
    - Course Enrollment
    - Payment Confirmation
    - Course Completion
- **System Settings**: Admin can manage:
    - General Settings (App Name, Logo, Timezone)
    - Payment Settings (PayPal Configuration)
    - Notification Settings
    - Course Settings

---

## 9. Conclusion
The Learning Management System is a modern and user-friendly platform that makes online education simple for everyone. It provides a structured way for teachers to teach and for students to learn, ensuring a smooth experience from registration to getting a certificate.
