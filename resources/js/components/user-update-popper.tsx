import { X, Save, Eye, EyeOff } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserUpdatePopperProps {
    user: any;
    roles: string[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (userData: any) => void;
    loading: boolean;
    errors: any;
}

export function UserUpdatePopper({ 
    user, 
    roles, 
    isOpen, 
    onClose, 
    onUpdate, 
    loading, 
    errors 
}: UserUpdatePopperProps) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
        phone: user?.phone || '',
        date_of_birth: (user?.date_of_birth && user.date_of_birth.includes('T')) 
            ? user.date_of_birth.split('T')[0] 
            : (user?.date_of_birth || ''),
        status: user?.status || 'Active',
        password: '',
        password_confirmation: '',
    });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const popperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            // Ensure date_of_birth is in YYYY-MM-DD format for the date input
            let formattedDate = user.date_of_birth || '';
            if (formattedDate && formattedDate.includes('T')) {
                formattedDate = formattedDate.split('T')[0];
            }

            setFormData({
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                phone: user.phone || '',
                date_of_birth: formattedDate,
                status: user.status || 'Active',
                password: '',
                password_confirmation: '',
            });
            setShowChangePassword(false);
            setShowPassword(false);
            setShowPasswordConfirmation(false);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popperRef.current && !popperRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    if (!isOpen || !user) {
return null;
}

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                ref={popperRef}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto"
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Update User</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="update_name">Name *</Label>
                                <Input
                                    id="update_name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter full name"
                                    className={errors.name ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
                            </div>

                            <div>
                                <Label htmlFor="update_email">Email *</Label>
                                <Input
                                    id="update_email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="Enter email address"
                                    className={errors.email ? 'border-red-500' : ''}
                                    required
                                />
                                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
                            </div>
                        </div>

                        {/* Role and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="update_role">Role *</Label>
                                <select
                                    id="update_role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select role</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role[0]}</p>}
                            </div>

                            <div>
                                <Label htmlFor="update_status">Status *</Label>
                                <select
                                    id="update_status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status[0]}</p>}
                            </div>
                        </div>

                        {/* Password Change Section */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-base font-medium">Password</Label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChangePassword(!showChangePassword);

                                        if (!showChangePassword) {
                                            setFormData({...formData, password: '', password_confirmation: ''});
                                        }
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
                                </button>
                            </div>
                            
                            {showChangePassword && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="update_password">New Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="update_password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                placeholder="Enter new password"
                                                className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                                required={showChangePassword}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="update_password_confirmation">Confirm New Password *</Label>
                                        <div className="relative">
                                            <Input
                                                id="update_password_confirmation"
                                                type={showPasswordConfirmation ? "text" : "password"}
                                                value={formData.password_confirmation}
                                                onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})}
                                                placeholder="Confirm new password"
                                                className={`pr-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                                required={showChangePassword}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswordConfirmation ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && <p className="text-red-600 text-sm mt-1">{errors.password_confirmation[0]}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="update_phone">Phone</Label>
                                <Input
                                    id="update_phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="Enter phone number"
                                    className={errors.phone ? 'border-red-500' : ''}
                                />
                                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone[0]}</p>}
                            </div>

                            <div>
                                <Label htmlFor="update_date_of_birth">Date of Birth</Label>
                                <Input
                                    id="update_date_of_birth"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                    className={errors.date_of_birth ? 'border-red-500' : ''}
                                />
                                {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth[0]}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 p-6 border-t bg-gray-50">
                        <Button
                            type="submit"
                            variant="create"
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Updating...' : 'Update User'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}