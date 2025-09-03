import React, { useState } from 'react';
import { Calendar, User, Mail, Phone, MapPin, Heart, GraduationCap, FileText, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreateStudentData, BloodGroupType, useStudentData } from '@/hooks/useStudentData';

interface AddStudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const departments = [
  'Computer Science',
  'Electrical Engineering',
  'Business Administration',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Architecture',
  'Civil Engineering',
  'Mechanical Engineering',
];

const bloodGroups: BloodGroupType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSuccess }) => {
  const { createStudent } = useStudentData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateStudentData>({
    student_id: '',
    full_name: '',
    email: '',
    department: '',
    blood_group: undefined,
    phone_number: '',
    address: '',
    date_of_birth: '',
    admission_date: new Date().toISOString().split('T')[0], // Today's date
    validity_date: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    profile_image_url: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<CreateStudentData>>({});

  const handleInputChange = (field: keyof CreateStudentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateStudentData> = {};

    // Required field validation
    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required';
    } else if (!/^[A-Za-z0-9]+$/.test(formData.student_id)) {
      newErrors.student_id = 'Student ID should contain only letters and numbers';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    // Optional field validation
    if (formData.phone_number && !/^[0-9+\-\(\)\s]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    if (formData.guardian_phone && !/^[0-9+\-\(\)\s]+$/.test(formData.guardian_phone)) {
      newErrors.guardian_phone = 'Please enter a valid guardian phone number';
    }

    if (formData.emergency_contact && !/^[0-9+\-\(\)\s]+$/.test(formData.emergency_contact)) {
      newErrors.emergency_contact = 'Please enter a valid emergency contact number';
    }

    // Date validation
    if (formData.date_of_birth && formData.admission_date) {
      const birthDate = new Date(formData.date_of_birth);
      const admissionDate = new Date(formData.admission_date);
      const age = admissionDate.getFullYear() - birthDate.getFullYear();
      
      if (age < 16 || age > 100) {
        newErrors.date_of_birth = 'Please enter a valid birth date';
      }
    }

    if (formData.validity_date && formData.admission_date) {
      const validityDate = new Date(formData.validity_date);
      const admissionDate = new Date(formData.admission_date);
      
      if (validityDate <= admissionDate) {
        newErrors.validity_date = 'Validity date must be after admission date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Clean up empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        blood_group: formData.blood_group || undefined,
        phone_number: formData.phone_number?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        validity_date: formData.validity_date || undefined,
        guardian_name: formData.guardian_name?.trim() || undefined,
        guardian_phone: formData.guardian_phone?.trim() || undefined,
        emergency_contact: formData.emergency_contact?.trim() || undefined,
        profile_image_url: formData.profile_image_url?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      await createStudent(cleanedData);

      toast({
        title: "Success!",
        description: "Student data has been added successfully.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add student data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Add New Student
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="student_id">
                    Student ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="student_id"
                      placeholder="e.g., 22301001"
                      value={formData.student_id}
                      onChange={(e) => handleInputChange('student_id', e.target.value)}
                      className={`pl-10 ${errors.student_id ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.student_id && (
                    <p className="text-sm text-red-500">{errors.student_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="full_name"
                      placeholder="e.g., John Doe"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className={`pl-10 ${errors.full_name ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-sm text-red-500">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., john.doe@g.bracu.ac.bd"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-500">{errors.department}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={formData.blood_group} onValueChange={(value) => handleInputChange('blood_group', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone_number"
                      placeholder="e.g., +8801234567890"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className={`pl-10 ${errors.phone_number ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-sm text-red-500">{errors.phone_number}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className={`pl-10 ${errors.date_of_birth ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admission_date">Admission Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="admission_date"
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleInputChange('admission_date', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validity_date">Validity Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="validity_date"
                      type="date"
                      value={formData.validity_date}
                      onChange={(e) => handleInputChange('validity_date', e.target.value)}
                      className={`pl-10 ${errors.validity_date ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.validity_date && (
                    <p className="text-sm text-red-500">{errors.validity_date}</p>
                  )}
                </div>
              </div>

              {/* Guardian Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="guardian_name"
                      placeholder="e.g., Jane Doe"
                      value={formData.guardian_name}
                      onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="guardian_phone"
                      placeholder="e.g., +8801234567890"
                      value={formData.guardian_phone}
                      onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                      className={`pl-10 ${errors.guardian_phone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.guardian_phone && (
                    <p className="text-sm text-red-500">{errors.guardian_phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="emergency_contact"
                      placeholder="e.g., +8801234567890"
                      value={formData.emergency_contact}
                      onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                      className={`pl-10 ${errors.emergency_contact ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.emergency_contact && (
                    <p className="text-sm text-red-500">{errors.emergency_contact}</p>
                  )}
                </div>
              </div>

              {/* Address and Notes */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                    <Textarea
                      id="address"
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="pl-10"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                    <Textarea
                      id="notes"
                      placeholder="Additional notes or comments"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="pl-10"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Adding Student...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Student
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddStudentForm;
