import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  ArrowRight, 
  Loader2, 
  Upload, 
  Check, 
  AlertCircle, 
  User as UserIcon, 
  Phone, 
  MapPin 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ParentSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingID, setUploadingID] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    id_document_url: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || "",
          phone: userData.phone || "",
          address: userData.address || "",
          id_document_url: userData.id_document_url || ""
        });
        
        // If user is not a parent or already completed setup, redirect
        if (userData.user_type !== "parent") {
          navigate(createPageUrl("Home"));
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingID(true);
    try {
      const result = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        id_document_url: result.file_url
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload ID document. Please try again.");
    } finally {
      setUploadingID(false);
    }
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return "Please enter your full name";
    if (!formData.phone.trim()) return "Please enter your phone number";
    if (!formData.address.trim()) return "Please enter your address";
    if (!formData.id_document_url) return "Please upload your ID document for verification";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSaving(true);
    try {
      await User.updateMyUserData({
        ...formData,
        completed_setup: true
      });
      navigate(createPageUrl("Home"));
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
    <div className="min-h-[calc(100vh-200px)] py-10 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Complete Your Parent Profile</CardTitle>
            <CardDescription className="text-center">
              Please provide some additional information to help us verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                  />
                </div>
 