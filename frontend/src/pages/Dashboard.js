import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Clock, CheckCircle, Lock, PlayCircle } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadData(userData.id);
  }, [navigate]);

  const loadData = async (userId) => {
    try {
      const [modulesRes, progressRes] = await Promise.all([
        axios.get(`${API}/modules`),
        axios.get(`${API}/progress/${userId}`)
      ]);
      
      setModules(modulesRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    return progress.find(p => p.module_id === moduleId);
  };

  const calculateOverallProgress = () => {
    if (modules.length === 0) return 0;
    const completed = progress.filter(p => p.completed).length;
    return (completed / modules.length) * 100;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" data-testid="dashboard-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Training Dashboard
              </h1>
            </div>
            <p className="text-gray-600">Welcome back, <span className="font-semibold" data-testid="user-name">{user?.name}</span></p>
            <Badge variant="outline" className="mt-1" data-testid="user-role">
              {user?.role === 'staff' ? 'Staff Member' : 'Student'}
            </Badge>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            Logout
          </Button>
        </div>

        {/* Overall Progress Card */}
        <Card className="mb-8 border-2 shadow-lg" data-testid="overall-progress-card">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Complete all modules to master social engineering defense</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall Completion</span>
                <span className="font-semibold" data-testid="progress-percentage">{Math.round(calculateOverallProgress())}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-3" />
              <p className="text-sm text-gray-500">
                {progress.filter(p => p.completed).length} of {modules.length} modules completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Training Modules</h2>
          <div className="grid gap-6">
            {modules.map((module) => {
              const moduleProgress = getModuleProgress(module.id);
              const isCompleted = moduleProgress?.completed;
              
              return (
                <Card 
                  key={module.id} 
                  className="border-2 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/module/${module.id}`)}
                  data-testid={`module-card-${module.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" data-testid={`module-order-${module.id}`}>Module {module.order}</Badge>
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100" data-testid={`completed-badge-${module.id}`}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-2" data-testid={`module-title-${module.id}`}>{module.title}</CardTitle>
                        <CardDescription data-testid={`module-description-${module.id}`}>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{module.duration}</span>
                        </div>
                        {moduleProgress && (
                          <div className="flex items-center gap-1">
                            <span>Score: </span>
                            <span className="font-semibold" data-testid={`module-score-${module.id}`}>
                              {moduleProgress.score}/{moduleProgress.total_questions}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid={`start-button-${module.id}`}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {isCompleted ? 'Review' : 'Start'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;