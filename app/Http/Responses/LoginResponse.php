<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        $redirectUrl = match ($user?->role) {
            User::ROLE_ADMIN => route('admin.dashboard'),
            User::ROLE_INSTRUCTOR => route('instructor.dashboard'),
            default => route('student.dashboard'),
        };

        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->intended($redirectUrl);
    }
}
