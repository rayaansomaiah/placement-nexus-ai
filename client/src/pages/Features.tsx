
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, Search, Bell, FileText, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Features = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">PlacementPro</Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="mr-2">Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for Modern
            <span className="text-blue-600"> Placement Management</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how PlacementPro transforms the recruitment process with AI-driven matching, 
            real-time tracking, and seamless collaboration tools.
          </p>
        </div>

        {/* Student Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Students</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Job Matching</CardTitle>
                <CardDescription>
                  Our intelligent algorithm matches you with opportunities based on your skills, 
                  GPA, and career preferences for personalized job recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Real-Time Application Tracking</CardTitle>
                <CardDescription>
                  Track your application status from submission to offer with visual updates 
                  and instant notifications for important milestones.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Profile & Resume Builder</CardTitle>
                <CardDescription>
                  Create compelling profiles with our guided builder, featuring resume templates, 
                  skill assessments, and portfolio showcases.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Interview Preparation Tools</CardTitle>
                <CardDescription>
                  Access mock interviews, common questions, and feedback tools to ace your 
                  interviews with confidence.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Skill Development Hub</CardTitle>
                <CardDescription>
                  Identify skill gaps and access resources for improvement with personalized 
                  learning paths and certification tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Peer Networking</CardTitle>
                <CardDescription>
                  Connect with fellow students, share experiences, and learn from successful 
                  placement stories in your field.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* College Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Colleges</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Student Management System</CardTitle>
                <CardDescription>
                  Centralized platform to manage student profiles, verify credentials, 
                  and track placement progress across all departments.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Advanced Analytics & Reports</CardTitle>
                <CardDescription>
                  Generate comprehensive placement reports with trends, statistics, 
                  and insights to improve your placement strategy.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Event & Drive Management</CardTitle>
                <CardDescription>
                  Organize placement drives, coordinate with recruiters, and manage 
                  campus events with integrated scheduling tools.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Recruiter Collaboration Hub</CardTitle>
                <CardDescription>
                  Streamlined communication with recruiters, job posting management, 
                  and collaborative hiring pipeline tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Placement Process Automation</CardTitle>
                <CardDescription>
                  Automate routine tasks like eligibility checking, application routing, 
                  and status updates to save time and reduce errors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Data-Driven Insights</CardTitle>
                <CardDescription>
                  Make informed decisions with placement analytics, success metrics, 
                  and predictive insights for better outcomes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recruiter Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Recruiters</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Advanced Candidate Search</CardTitle>
                <CardDescription>
                  Filter and search candidates by skills, GPA, college, branch, and experience 
                  with powerful search algorithms and saved filters.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Hiring Pipeline Management</CardTitle>
                <CardDescription>
                  Visualize and manage your entire hiring process from application to offer 
                  with customizable stages and automated workflows.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Interview Scheduling System</CardTitle>
                <CardDescription>
                  Coordinate interviews with integrated calendar management, automated 
                  reminders, and video conferencing integration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Multi-College Recruitment</CardTitle>
                <CardDescription>
                  Access verified candidates from multiple colleges through a single platform 
                  with standardized profiles and credentials.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Recruitment Analytics</CardTitle>
                <CardDescription>
                  Track recruitment metrics, analyze hiring patterns, and optimize 
                  your talent acquisition strategy with detailed reports.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Automated Job Matching</CardTitle>
                <CardDescription>
                  Our AI automatically matches your job requirements with suitable candidates 
                  and sends targeted job recommendations to qualified students.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students, colleges, and recruiters who are already using PlacementPro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
