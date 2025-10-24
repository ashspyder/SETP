import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Shield, Lock, Users, CheckCircle } from "lucide-react";

const Landing = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/users`, {
        name: name.trim(),
        role: role
      });
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(response.data));
      toast.success("Welcome to the training program!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to start. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Social Engineering & Human Hacking
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive training program to protect yourself and your organization from social engineering attacks
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="feature-card-modules">
            <CardContent className="pt-6">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">4 Comprehensive Modules</h3>
              <p className="text-gray-600 text-sm">From psychology to protocols, covering all aspects of human hacking</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="feature-card-assessments">
            <CardContent className="pt-6">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Interactive Assessments</h3>
              <p className="text-gray-600 text-sm">Test your knowledge with quizzes after each module</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-shadow" data-testid="feature-card-tracking">
            <CardContent className="pt-6">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">Monitor your completion status and scores</p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Card */}
        <Card className="max-w-md mx-auto shadow-xl border-2" data-testid="registration-card">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Enter your details to begin the training program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                data-testid="name-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <RadioGroup value={role} onValueChange={setRole} data-testid="role-selector">
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="student" id="student" data-testid="role-student" />
                  <Label htmlFor="student" className="cursor-pointer flex-1">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="staff" id="staff" data-testid="role-staff" />
                  <Label htmlFor="staff" className="cursor-pointer flex-1">
                    Staff
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleStart}
              disabled={loading}
              data-testid="start-training-button"
            >
              {loading ? "Starting..." : "Start Training"}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>University of Technology and Applied Sciences - Oman</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;