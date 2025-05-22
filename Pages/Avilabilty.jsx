import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Availability } from "@/entities/Availability";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2,
  Clock,
  Calendar,
  AlertCircle,
  Save,
  Info
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

export default function BabysitterAvailability() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Availability state
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
        
        // If user is not a babysitter, redirect
        if (userData.user_type !== "babysitter") {
          navigate(createPageUrl("Home"));
          return;
        }
        
        // Load availability
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
          console.log("No availability data found, using defaults");
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

  const handleSaveAvailability = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
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
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving availability:", error);
      setError("Failed to save your availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-2 text-gray-600">Loading your availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Your Availability</h1>
        <p className="text-gray-600">
          Set your weekly availability to help parents find you when they need a babysitter
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
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Your availability has been saved successfully!
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Toggle days when you're available and set your preferred time slots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Be sure to keep your availability up to date! Parents will search based on when you're available.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day, index) => (
              <div 
                key={day.value} 
                className={`p-4 rounded-lg border ${
                  availability[index].available 
                    ? "border-purple-200 bg-purple-50" 
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`day-${day.value}`}
                      checked={availability[index].available}
                      onCheckedChange={(checked) => handleAvailabilityChange(index, "available", checked)}
                    />
                    <label htmlFor={`day-${day.value}`} className="font-medium cursor-pointer">
                      {day.label}
                    </label>
                  </div>
                  
                  {availability[index].available && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {availability[index].start_time} - {availability[index].end_time}
                    </div>
                  )}
                </div>
                
                {availability[index].available && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`start-${day.value}`} className="text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <select
                        id={`start-${day.value}`}
                        value={availability[index].start_time}
                        onChange={(e) => handleAvailabilityChange(index, "start_time", e.target.value)}
                        className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={`start-${day.value}-${time.value}`} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`end-${day.value}`} className="text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <select
                        id={`end-${day.value}`}
                        value={availability[index].end_time}
                        onChange={(e) => handleAvailabilityChange(index, "end_time", e.target.value)}
                        className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={`end-${day.value}-${time.value}`} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveAvailability}
            className="ml-auto bg-purple-600 hover:bg-purple-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Availability
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}