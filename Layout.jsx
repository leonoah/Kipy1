import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        if (userData.user_type) {
          // Already has a user type, redirect
          if (!userData.completed_setup) {
            navigate(createPageUrl(userData.user_type === "parent" ? "ParentSetup" : "BabysitterSetup"));
          } else {
            navigate(createPageUrl("Home"));
          }
        }
      } catch (error) {
        // Not logged in, stay on page
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If already logged in
      if (user) {
        // Just update user type
        await User.updateMyUserData({
          user_type: userType,
          completed_setup: false
        });
      } else {
        // Login first, then update user type
        await User.login();
        const currentUser = await User.me();
        
        // Save user type
        await User.updateMyUserData({
          user_type: userType,
          completed_setup: false
        });
      }
      
      // Redirect to profile completion page
      if (userType === "parent") {
        navigate(createPageUrl("ParentSetup"));
      } else {
        navigate(createPageUrl("BabysitterSetup"));
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to KIPY</CardTitle>
          <CardDescription className="text-center">
            {user ? "Choose your account type to get started" : "Sign in to create your KIPY account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>I am a:</Label>
            <RadioGroup 
              defaultValue="parent" 
              value={userType}
              onValueChange={setUserType}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="parent"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-gray-50 ${
                  userType === "parent" ? "border-purple-600" : ""
                }`}
              >
                <RadioGroupItem 
                  value="parent" 
                  id="parent" 
                  className="sr-only" 
                />
                <img 
                  src="https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80" 
                  alt="Parent" 
                  className="h-16 w-16 rounded-full object-cover mb-3"
                />
                <div className="text-center">Parent</div>
              </Label>
              <Label
                htmlFor="babysitter"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-gray-50 ${
                  userType === "babysitter" ? "border-purple-600" : ""
                }`}
              >
                <RadioGroupItem 
                  value="babysitter" 
                  id="babysitter" 
                  className="sr-only" 
                />
                <img 
                  src="https://images.unsplash.com/photo-1516627145497-ae6968895b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80" 
                  alt="Babysitter" 
                  className="h-16 w-16 rounded-full object-cover mb-3"
                />
                <div className="text-center">Babysitter</div>
              </Label>
            </RadioGroup>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium">{user ? "Continue setting up your account" : "Getting started is easy!"}</p>
                <p className="mt-1">{user ? "Select your role above and continue" : "We use Google for safe and secure sign-in. No password to remember!"}</p>
              </div>
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            onClick={handleRegister} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {user ? "Continue" : "Continue with Google"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center text-sm">
            By signing up, you agree to our{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-purple-600 hover:underline">
              Privacy Policy
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}