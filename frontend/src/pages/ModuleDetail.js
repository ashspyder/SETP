import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Award, MessageSquare, CheckCircle, XCircle, Star } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const ModuleDetail = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [module, setModule] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('content'); // 'content', 'assessment', 'results', 'feedback'
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadModule();
  }, [moduleId, navigate]);

  const loadModule = async () => {
    try {
      const [moduleRes, assessmentRes] = await Promise.all([
        axios.get(`${API}/modules/${moduleId}`),
        axios.get(`${API}/assessments/${moduleId}`)
      ]);
      
      setModule(moduleRes.data);
      setAssessment(assessmentRes.data);
    } catch (error) {
      console.error("Error loading module:", error);
      toast.error("Failed to load module");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = () => {
    setCurrentSection('assessment');
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAssessment = async () => {
    // Check if all questions are answered
    const unanswered = assessment.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/assessments/${moduleId}/submit`, {
        user_id: user.id,
        answers: answers
      });
      
      setResults(response.data);
      setCurrentSection('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (response.data.passed) {
        toast.success(`Congratulations! You passed with ${response.data.percentage}%`);
      } else {
        toast.error(`You scored ${response.data.percentage}%. You need 70% to pass.`);
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!comments.trim()) {
      toast.error("Please provide your comments");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/feedback`, {
        user_id: user.id,
        module_id: moduleId,
        rating: rating,
        comments: comments.trim()
      });
      
      toast.success("Thank you for your feedback!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" data-testid="module-detail-page">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mb-4"
            data-testid="back-to-dashboard-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" data-testid="module-order-badge">Module {module?.order}</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="module-title">
            {module?.title}
          </h1>
          <p className="text-gray-600" data-testid="module-description">{module?.description}</p>
        </div>

        {/* Content Section */}
        {currentSection === 'content' && (
          <div className="space-y-6">
            {/* Video */}
            <Card className="border-2 shadow-lg" data-testid="video-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Training Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                  <iframe
                    data-testid="module-video"
                    width="100%"
                    height="100%"
                    src={module?.video_url}
                    title="Training Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="border-2 shadow-lg" data-testid="content-card">
              <CardHeader>
                <CardTitle>Module Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none" data-testid="module-content">
                  <ReactMarkdown>{module?.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Start Assessment Button */}
            <Card className="border-2 border-blue-200 bg-blue-50" data-testid="assessment-prompt-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Test Your Knowledge?</h3>
                  <p className="text-gray-600 mb-4">Complete the assessment to earn your certificate</p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleStartAssessment}
                    data-testid="start-assessment-button"
                  >
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assessment Section */}
        {currentSection === 'assessment' && (
          <Card className="border-2 shadow-lg" data-testid="assessment-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Module Assessment
              </CardTitle>
              <CardDescription>
                Answer all questions to complete this module. Passing score: 70%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessment?.questions.map((question, index) => (
                <div key={question.id} className="space-y-3" data-testid={`question-${question.id}`}>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium mb-3" data-testid={`question-text-${question.id}`}>{question.question}</p>
                      <RadioGroup 
                        value={answers[question.id]} 
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                        data-testid={`answer-group-${question.id}`}
                      >
                        {question.options?.map((option) => (
                          <div 
                            key={option} 
                            className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} data-testid={`answer-option-${question.id}-${option}`} />
                            <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer flex-1">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                  {index < assessment.questions.length - 1 && <Separator />}
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSection('content')}
                  data-testid="back-to-content-button"
                >
                  Back to Content
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  data-testid="submit-assessment-button"
                >
                  {submitting ? "Submitting..." : "Submit Assessment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {currentSection === 'results' && results && (
          <div className="space-y-6">
            <Card className={`border-2 shadow-lg ${results.passed ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`} data-testid="results-card">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {results.passed ? (
                    <CheckCircle className="w-16 h-16 text-green-600" data-testid="pass-icon" />
                  ) : (
                    <XCircle className="w-16 h-16 text-orange-600" data-testid="fail-icon" />
                  )}
                </div>
                <CardTitle className="text-center text-2xl">
                  {results.passed ? 'Congratulations!' : 'Keep Trying!'}
                </CardTitle>
                <CardDescription className="text-center">
                  {results.passed 
                    ? 'You have successfully completed this module' 
                    : 'You need 70% to pass. Review the content and try again.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2" data-testid="score-percentage">{results.percentage}%</div>
                    <p className="text-gray-600" data-testid="score-details">
                      You scored {results.score} out of {results.total} questions correctly
                    </p>
                  </div>
                  
                  <Progress value={results.percentage} className="h-3" />
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentSection('content')}
                      className="flex-1"
                      data-testid="review-content-button"
                    >
                      Review Content
                    </Button>
                    {!results.passed && (
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleStartAssessment}
                        data-testid="retake-assessment-button"
                      >
                        Retake Assessment
                      </Button>
                    )}
                    {results.passed && (
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setCurrentSection('feedback')}
                        data-testid="continue-to-feedback-button"
                      >
                        Continue to Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Section */}
        {currentSection === 'feedback' && (
          <Card className="border-2 shadow-lg" data-testid="feedback-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Module Feedback
              </CardTitle>
              <CardDescription>
                Help us improve this training module with your feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Rate this module</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                      data-testid={`rating-star-${star}`}
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments">Your Comments</Label>
                <Textarea
                  id="comments"
                  data-testid="feedback-comments"
                  placeholder="Share your thoughts about this module..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={5}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                  data-testid="skip-feedback-button"
                >
                  Skip for Now
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmitFeedback}
                  disabled={submitting}
                  data-testid="submit-feedback-button"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModuleDetail;