import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Availability } from "@/entities/Availability";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Camera,
  Calendar,
  Save,
  AlertCircle,
  Info,
  Clock,
  Bell,
  CheckCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const ampm = i < 12 ? "AM" : "PM";
  return { 
    value: `${i.toString().padStart(2, "0")}:00`,
    label: `${hour}:00 ${ampm}`
  };
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    age: "",
    bio: "",
    profile_image_url: "",
    sms_notifications: true
  });
  
  // Availability state for babysitters
  const [availability, setAvailability] = useState(
    DAYS_OF_WEEK.map(day => ({
      day: day.value,
      available: false,
      start_time: "09:00",
      end_time: "17:00"
    }))
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || "",
          phone: userData.phone || "",
          address: userData.address || "",
          age: userData.age || "",
          bio: userData.bio || "",
          profile_image_url: userData.profile_image_url || "",
          sms_notifications: userData.sms_notifications !== false // Default to true
        });
        
        // Load availability if babysitter
        if (userData.user_type === "babysitter") {
          try {
            const availabilityData = await Availability.filter({ babysitter_id: userData.id });
            if (availabilityData.length > 0) {
              const availMap = new Map();
              availabilityData.forEach(avail => {
                availMap.set(avail.day_of_week, {
                  id: avail.id,
                  available: true,
                  start_time: avail.start_time,
                  end_time: avail.end_time
                });
              });
              
              setAvailability(
                DAYS_OF_WEEK.map(day => ({
                  day: day.value,
                  id: availMap.has(day.value) ? availMap.get(day.value).id : null,
                  available: availMap.has(day.value),
                  start_time: availMap.has(day.value) ? availMap.get(day.value).start_time : "09:00",
                  end_time: availMap.has(day.value) ? availMap.get(day.value).end_time : "17:00"
                }))
              );
            }
          } catch (error) {
            console.log("No availability data found");
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        navigate(createPageUrl("Login"));
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSwitchChange = (checked, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAvailabilityChange = (dayIndex, field, value) => {
    setAvailability(prev => {
      const newAvailability = [...prev];
      newAvailability[dayIndex] = {
        ...newAvailability[dayIndex],
        [field]: value
      };
      return newAvailability;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const result = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        profile_image_url: result.file_url
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload profile photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Save user profile data
      await User.updateMyUserData({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined
      });
      
      // For babysitters, save availability data
      if (user.user_type === "babysitter") {
        // Delete existing availability
        const existingAvailability = await Availability.filter({ babysitter_id: user.id });
        for (const avail of existingAvailability) {
          await Availability.delete(avail.id);
        }
        
        // Create new availability records
        for (const day of availability) {
          if (day.available) {
            await Availability.create({
              babysitter_id: user.id,
              day_of_week: day.day,
              start_time: day.start_time,
              end_time: day.end_time
            });
          }
        }
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-2 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-gray-600">
          {user.user_type === "parent" 
            ? "Update your parent profile information" 
            : "Update your babysitter profile"
          }
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Your profile has been saved successfully!
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {user.user_type === "parent" ? "Parent Information" : "Babysitter Information"}
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                    {formData.profile_image_url ? (
                      <img 
                        src={formData.profile_image_url} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-purple-100 flex items-center justify-center">
                        <UserIcon className="h-12 w-12 text-purple-300" />
                      </div>
                    )}
                  </div>
                  <Input
                    id="profile_image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Label
                    htmlFor="profile_image"
                    className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-1.5 cursor-pointer shadow-md hover:bg-purple-700"
                  >
                    {uploadingPhoto ? (
 