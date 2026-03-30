<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Inertia\Inertia;

class CertificateController extends Controller
{
    private CertificateService $certificateService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    public function generate(Request $request, Enrollment $enrollment): JsonResponse
    {
        // Ensure student can only generate their own certificates
        if ($enrollment->student_id !== $request->user()->id) {
            abort(403, 'Unauthorized access to certificate.');
        }

        if (!$enrollment->completion_date) {
            abort(400, 'Course not completed yet.');
        }

        try {
            $filePath = $this->certificateService->generateCertificate($enrollment);
            $url = '/files/' . $filePath . '?t=' . time();

            return response()->json([
                'success' => true,
                'certificate_url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate certificate: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function download(Request $request, Enrollment $enrollment)
    {
        // Ensure student can only download their own certificates
        if ($enrollment->student_id !== $request->user()->id) {
            abort(403, 'Unauthorized access to certificate.');
        }

        if (!$enrollment->completion_date) {
            abort(400, 'Course not completed yet.');
        }

        try {
            $filePath = $this->certificateService->generateCertificate($enrollment);
            $fullPath = storage_path('app/public/' . $filePath);

            if (!file_exists($fullPath)) {
                abort(404, 'Certificate not found.');
            }

            $certificateId = 'CERT-' . str_pad($enrollment->id, 6, '0', STR_PAD_LEFT);
            $fileName = $certificateId . '.pdf';

            $response = response()->download($fullPath, $fileName);
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            return $response;
        } catch (\Exception $e) {
            abort(500, 'Failed to generate certificate: ' . $e->getMessage());
        }
    }

    public function view(Request $request, Enrollment $enrollment)
    {
        // Ensure student can only view their own certificates
        if ($enrollment->student_id !== $request->user()->id) {
            abort(403, 'Unauthorized access to certificate.');
        }

        if (!$enrollment->completion_date) {
            abort(400, 'Course not completed yet.');
        }

        try {
            $filePath = $this->certificateService->generateCertificate($enrollment);
            $fullPath = storage_path('app/public/' . $filePath);

            if (!file_exists($fullPath)) {
                abort(404, 'Certificate not found.');
            }

            $response = response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline',
            ]);
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            return $response;
        } catch (\Exception $e) {
            abort(500, 'Failed to generate certificate: ' . $e->getMessage());
        }
    }

    public function verify(string $certificateId)
    {
        $verification = $this->certificateService->verifyCertificate($certificateId);

        return Inertia::render('certificates/verify', [
            'certificate_id' => $certificateId,
            'verification' => $verification,
        ]);
    }
}
