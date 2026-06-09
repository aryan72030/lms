<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function view(User $user, Enrollment $enrollment): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->isInstructor()) return $enrollment->course->instructor_id === $user->id;
        return $enrollment->student_id === $user->id;
    }

    public function update(User $user, Enrollment $enrollment): bool
    {
        if ($user->isAdmin()) return true;
        return $enrollment->student_id === $user->id;
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->isAdmin();
    }
}
