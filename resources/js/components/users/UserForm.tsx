import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserFormData {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role: string;
    phone: string;
    date_of_birth: string;
    status: string;
}

interface UserFormProps {
    formData: UserFormData;
    setFormData: (data: UserFormData | ((prev: UserFormData) => UserFormData)) => void;
    errors: Record<string, string | string[] | undefined>;
    mode: 'create' | 'edit';
    roles: string[];
}

export function UserForm({
    formData,
    setFormData,
    errors,
    mode,
    roles,
}: UserFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const handleChange = (field: keyof UserFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const renderError = (error: string | string[] | undefined) => {
        if (!error) return null;
        return <p className="mt-1 text-sm text-red-600">{Array.isArray(error) ? error[0] : error}</p>;
    };

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="name">
                        Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter full name"
                        className={errors.name ? 'border-red-500' : ''}
                        required
                    />
                    {renderError(errors.name)}
                </div>

                <div>
                    <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="Enter email address"
                        className={errors.email ? 'border-red-500' : ''}
                        required
                    />
                    {renderError(errors.email)}
                </div>
            </div>

            {/* Password - Only for Create mode */}
            {mode === 'create' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password || ''}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder="Enter password"
                                className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {renderError(errors.password)}
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation">
                            Confirm Password{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                value={formData.password_confirmation || ''}
                                onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                placeholder="Confirm password"
                                className={`pr-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {renderError(errors.password_confirmation)}
                    </div>
                </div>
            )}

            {/* Role and Status */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="role">
                        Role <span className="text-red-500">*</span>
                    </Label>
                    <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                        required
                    >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                    {renderError(errors.role)}
                </div>

                <div>
                    <Label htmlFor="status">
                        Status <span className="text-red-500">*</span>
                    </Label>
                    <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                        required
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    {renderError(errors.status)}
                </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className={errors.phone ? 'border-red-500' : ''}
                    />
                    {renderError(errors.phone)}
                </div>

                <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        className={errors.date_of_birth ? 'border-red-500' : ''}
                    />
                    {renderError(errors.date_of_birth)}
                </div>
            </div>
        </div>
    );
}
