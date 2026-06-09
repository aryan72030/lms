<?php

namespace App\Console\Commands;

use App\Models\CourseAssignmentSubmission;
use Illuminate\Console\Command;

class CleanupCorruptedFiles extends Command
{
    protected $signature = 'assignments:cleanup-files';
    protected $description = 'Clean up corrupted file data in assignment submissions';

    public function handle()
    {
        $this->info('Checking for corrupted file data...');
        
        $submissions = CourseAssignmentSubmission::whereNotNull('files')
            ->orWhereNotNull('file_path')
            ->get();
        $fixed = 0;
        $errors = 0;
        
        foreach ($submissions as $submission) {
            try {
                // Check for corrupted file_path (contains JSON instead of string path)
                if (!empty($submission->file_path) && is_string($submission->file_path)) {
                    if (str_starts_with($submission->file_path, '[') || str_starts_with($submission->file_path, '{')) {
                        $this->warn("Submission {$submission->id}: file_path contains JSON data");
                        
                        try {
                            $fileData = json_decode($submission->file_path, true);
                            if (is_array($fileData) && !empty($fileData)) {
                                $submission->files = $fileData;
                                $submission->file_path = null;
                                $submission->file_original_name = null;
                                $submission->save();
                                $fixed++;
                                $this->info("Submission {$submission->id}: Moved JSON data from file_path to files field");
                            }
                        } catch (\Exception $e) {
                            $this->error("Submission {$submission->id}: Error parsing JSON in file_path - " . $e->getMessage());
                            $errors++;
                        }
                        continue;
                    }
                }
                
                // Check files field
                $files = $submission->files;
                
                if (!empty($files) && !is_array($files)) {
                    $this->warn("Submission {$submission->id}: files is not an array");
                    $submission->files = null;
                    $submission->save();
                    $fixed++;
                    continue;
                }
                
                if (is_array($files)) {
                    $validFiles = [];
                    foreach ($files as $file) {
                        if (is_array($file) && isset($file['path']) && is_string($file['path'])) {
                            $validFiles[] = $file;
                        } else {
                            $this->warn("Submission {$submission->id}: Invalid file entry: " . json_encode($file));
                        }
                    }
                    
                    if (count($validFiles) !== count($files)) {
                        $submission->files = $validFiles;
                        $submission->save();
                        $fixed++;
                        $this->info("Submission {$submission->id}: Fixed file data");
                    }
                }
                
            } catch (\Exception $e) {
                $this->error("Submission {$submission->id}: Error - " . $e->getMessage());
                $errors++;
            }
        }
        
        $this->info("Cleanup complete. Fixed: {$fixed}, Errors: {$errors}");
        
        return 0;
    }
}