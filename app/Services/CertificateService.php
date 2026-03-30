<?php

namespace App\Services;

use App\Models\Enrollment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class CertificateService
{
    public function generateCertificate(Enrollment $enrollment): string
    {
        if (!$enrollment->completion_date) {
            throw new \Exception('Course not completed yet.');
        }

        $certificateData = [
            'student_name' => $enrollment->student->name,
            'course_title' => $enrollment->course->title,
            'instructor_name' => $enrollment->course->instructor->name,
            'completion_date' => $enrollment->completion_date->format('F d, Y'),
            'certificate_id' => 'CERT-' . str_pad($enrollment->id, 6, '0', STR_PAD_LEFT),
            'course_duration' => $enrollment->course->duration_hours . ' hours',
            'issue_date' => now()->format('F d, Y'),
        ];

        $pdf = Pdf::loadView('certificates.template', $certificateData)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'dpi' => 96,
                'defaultFont' => 'serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
            ]);

        $fileName = 'certificates/' . $certificateData['certificate_id'] . '.pdf';
        $pdfContent = $pdf->output();
        
        Storage::disk('public')->put($fileName, $pdfContent);

        return $fileName;
    }

    public function getCertificateUrl(Enrollment $enrollment): ?string
    {
        $certificateId = 'CERT-' . str_pad($enrollment->id, 6, '0', STR_PAD_LEFT);
        $fileName = 'certificates/' . $certificateId . '.pdf';
        
        if (Storage::disk('public')->exists($fileName)) {
            return '/files/' . $fileName;
        }

        return null;
    }

    public function verifyCertificate(string $certificateId): ?array
    {
        // Extract enrollment ID from certificate ID
        $enrollmentId = (int) str_replace('CERT-', '', $certificateId);
        
        $enrollment = Enrollment::with(['student', 'course.instructor'])
            ->whereNotNull('completion_date')
            ->find($enrollmentId);

        if (!$enrollment) {
            return null;
        }

        return [
            'valid' => true,
            'student_name' => $enrollment->student->name,
            'course_title' => $enrollment->course->title,
            'instructor_name' => $enrollment->course->instructor->name,
            'completion_date' => $enrollment->completion_date->format('F d, Y'),
            'certificate_id' => $certificateId,
        ];
    }
}
