import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
    allowedTypes: string[];
    maxFileSize: number; // in MB
    maxFiles: number;
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
    existingFiles?: string[];
}

export function FileUpload({
    allowedTypes,
    maxFileSize,
    maxFiles,
    onFilesChange,
    disabled = false,
    existingFiles = [],
}: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
        }

        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedTypes.includes(fileExtension)) {
            return `File "${file.name}" has an unsupported format. Allowed types: ${allowedTypes.join(', ')}.`;
        }

        return null;
    };

    const handleFiles = (newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const validFiles: File[] = [];
        const newErrors: string[] = [];

        // Check total file count
        if (files.length + fileArray.length > maxFiles) {
            newErrors.push(`You can only upload up to ${maxFiles} file(s).`);
            setErrors(newErrors);
            return;
        }

        // Validate each file
        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                newErrors.push(error);
            } else {
                validFiles.push(file);
            }
        });

        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }

        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        setErrors([]);
        onFilesChange(updatedFiles);
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : disabled
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={maxFiles > 1}
                    accept={allowedTypes.map(type => `.${type}`).join(',')}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={disabled}
                />
                
                <div className="text-center">
                    <Upload className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="mt-4">
                        <p className={`text-lg font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                            {dragActive ? 'Drop files here' : 'Upload your files'}
                        </p>
                        <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            Drag and drop files here, or{' '}
                            <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                            >
                                browse
                            </Button>
                        </p>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500 space-y-1">
                        <p>Allowed types: {allowedTypes.map(type => type.toUpperCase()).join(', ')}</p>
                        <p>Maximum file size: {maxFileSize}MB</p>
                        <p>Maximum files: {maxFiles}</p>
                    </div>
                </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="space-y-2">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Previously Uploaded Files:</h4>
                    {existingFiles.map((fileName, index) => (
                        <Card key={index} className="bg-green-50 border-green-200">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <File className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">{fileName}</span>
                                    </div>
                                    <span className="text-xs text-green-600">Uploaded</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Selected Files */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                    {files.map((file, index) => (
                        <Card key={index} className="bg-blue-50 border-blue-200">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <File className="h-4 w-4 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">{file.name}</p>
                                            <p className="text-xs text-blue-600">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                                        disabled={disabled}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}