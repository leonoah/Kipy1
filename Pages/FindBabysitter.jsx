import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Availability } from "@/entities/Availability";
import { Message } from "@/entities/Message";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Slider 
} from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  Clock, 
  Calendar, 
  MapPin, 
  User as UserIcon, 
  MessageCircle,
  ArrowRight,
  SendHorizonal,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mock data for initial view
const timeOptions = [
  { value: "morning", label: "Morning (6AM-12PM)" },
  { value: "afternoon", label: "Afternoon (12PM-5PM)" },
  { value: "evening", label: "Evening (5PM-10PM)" },
  { value: "night", label: "Night (10PM-6AM)" },
  { value: "anytime", label: "Any time" }
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FindBabysitter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [babysitters, setBabysitters] = useState([]);
  const [filteredBabysitters, setFilteredBabysitters] = useState([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedBabysitter, setSelectedBabysitter] = useState(null);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [timeOfDay, setTimeOfDay] = useState("anytime");
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const userData = await User.me();
        if (userData.user_type !== "parent") {
          navigate(createPageUrl("Home"));
          return;
        }
        setUser(userData);
        
        // Load all babysitters
        const allUsers = await User.list();
        const allBabysitters = allUsers.filter(u => 
          u.user_type === "babysitter" && 
          u.completed_setup === true
        );
        
        // Load their availability
        for (const babysitter of allBabysitters) {
          try {
            const availability = await Availability.filter({ babysitter_id: babysitter.id });
            babysitter.availability = availability;
          } catch (error) {
            babysitter.availability = [];
          }
        }
        
        setBabysitters(allBabysitters);
        setFilteredBabysitters(allBabysitters);
      } catch (error) {
        console.error("Error loading data:", error);
        navigate(createPageUrl("Login"));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);
  
  useEffect(() => {
    applyFilters();
  }, [ageRange, timeOfDay, dayOfWeek, babysitters]);

  const handleDayChange = (e) => {
    setDayOfWeek(parseInt(e.target.value));
  };

  const handleTimeChange = (value) => {
    setTimeOfDay(value);
  };

  const applyFilters = () => {
    if (!babysitters.length) return;
    
    setSearching(true);
    
    setTimeout(() => {
      let filtered = [...babysitters];
      
      // Filter by age
      filtered = filtered.filter(
        babysitter => babysitter.age >= ageRange[0] && babysitter.age <= ageRange[1]
      );
      
      // Filter by day and time if not "anytime"
      if (timeOfDay !== "anytime") {
        filtered = filtered.filter(babysitter => {
          // Find availability entry for selected day
          const dayAvailability = babysitter.availability?.find(
            a => a.day_of_week === dayOfWeek
          );
          
          if (!dayAvailability) return false;
          
          // Check if time range overlaps with selected time of day
          const startHour = parseInt(dayAvailability.start_time.split(":")[0]);
          const endHour = parseInt(dayAvailability.end_time.split(":")[0]);
          
          // Define time ranges (in 24h format)
          const timeRanges = {
            morning: { start: 6, end: 12 },
            afternoon: { start: 12, end: 17 },
            evening: { start: 17, end: 22 },
            night: { start: 22, end: 6 }
          };
          
          const selectedRange = timeRanges[timeOfDay];
          
          // Handle special case for night which crosses midnight
          if (timeOfDay === "night") {
            if (startHour >= selectedRange.start || startHour < selectedRange.end) {
              return true;
            }
          } else {
            // For other time periods, check for overlap
            if (startHour <= selectedRange.end && endHour >= selectedRange.start) {
              return true;
            }
          }
          
          return false;
        });
      }
      
      setFilteredBabysitters(filtered);
      setSearching(false);
    }, 600); // Simulate search time
  };

  const handleContactBabysitter = (babysitter) => {
    setSelectedBabysitter(babysitter);
    setShowContactDialog(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSendingMessage(true);
    try {
      // Generate a thread ID based on the users involved
      const threadId = [user.id, selectedBabysitter.id].sort().join('_');
      
      // Create message
      await Message.create({
        sender_id: user.id,
        receiver_id: selectedBabysitter.id,
        content: message,
        thread_id: threadId
      });
      
      // Reset and close dialog
      setMessage("");
      setShowContactDialog(false);
      
      // Show success alert
      setError({
        type: "success",
        message: `Message sent to ${selectedBabysitter.full_name}! They will be notified.`
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError({
        type: "error",
        message: "Failed to send message. Please try again."
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-2 text-gray-600">Loading babysitters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find a Babysitter</h1>
        <p className="text-gray-600">Browse babysitters based on your preferences</p>
      </div>
      
      {error && (
        <Alert variant={error.type === "error" ? "destructive" : "default"} className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      
      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Filter Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Babysitter Age Range</Label>
              <span className="text-sm text-gray-500">{ageRange[0]} - {ageRange[1]} years</span>
            </div>
            <Slider
              defaultValue={ageRange}
              min={18}
              max={70}
              step={1}
              value={ageRange}
              onValueChange={setAgeRange}
              className="py-4"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Day of Week</Label>
              <select
                className="w-full mt-2 p-2 border rounded-md"
                value={dayOfWeek}
                onChange={handleDayChange}
              >
                {daysOfWeek.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label>Time of Day</Label>
              <select
                className="w-full mt-2 p-2 border rounded-md"
                value={timeOfDay}
                onChange={(e) => handleTimeChange(e.target.value)}
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            className="w-full md:w-auto md:ml-auto flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            onClick={applyFilters}
            disabled={searching}
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Apply Filters
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Babysitters ({filteredBabysitters.length})</h2>
        <span className="text-sm text-gray-500">
          {filteredBabysitters.length === 0 && !searching 
            ? "No babysitters match your criteria" 
            : `Showing ${filteredBabysitters.length} babysitters`
          }
        </span>
      </div>
      
      {searching ? (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-2 text-gray-600">Searching for babysitters...</p>
        </div>
      ) : filteredBabysitters.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No babysitters found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters to see more results
          </p>
          <Button 
            variant="outline"
            onClick={() => {
              setAgeRange([18, 60]);
              setTimeOfDay("anytime");
              setDayOfWeek(new Date().getDay());
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBabysitters.map(babysitter => (
            <Card key={babysitter.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[3/1] bg-gradient-to-r from-purple-100 to-indigo-100" />
              <div className="relative px-6">
                <div className="absolute -top-8 left-6">
                  <div className="h-16 w-16 rounded-full border-4 border-white overflow-hidden bg-purple-200">
                    {babysitter.profile_image_url ? (
                      <img 
                        src={babysitter.profile_image_url} 
                        alt={babysitter.full_name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-purple-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <CardHeader className="pt-10">
                <CardTitle>{babysitter.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-gray-100">
                    {babysitter.age} years old
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 line-clamp-3">{babysitter.bio}</p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-600">{babysitter.address}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-600">
                      Available on: {" "}
                      {babysitter.availability?.length > 0 
                        ? babysitter.availability.map(a => daysOfWeek[a.day_of_week]).join(", ")
                        : "No availability set"
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleContactBabysitter(babysitter)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {selectedBabysitter?.full_name}</DialogTitle>
            <DialogDescription>
              Send a message to introduce yourself and explain your babysitting needs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-purple-100 flex-shrink-0">
                {selectedBabysitter?.profile_image_url ? (
                  <img 
                    src={selectedBabysitter.profile_image_url} 
                    alt={selectedBabysitter.full_name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-purple-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{selectedBabysitter?.full_name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedBabysitter?.age} years old • {selectedBabysitter?.address}
                </p>
              </div>
            </div>
            
            <Textarea
              placeholder="Write your message here. Let them know when you need babysitting, for how long, how many children, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
              <p>
                <strong>Tip:</strong> Be specific about your needs to get a faster response.
                Include dates, times, ages of children, and any special requirements.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowContactDialog(false)}
              disabled={sendingMessage}
            >
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Label className="text-sm text-gray-500 mb-0">
        This is equivalent to the component used to display the content.
      </Label>
    </div>
  );
}

const Label = ({ children, className, ...props }) => {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className || ""}`} {...props}>
      {children}
    </label>
  );
};