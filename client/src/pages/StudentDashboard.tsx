import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, User, Search, Calendar, FileText, Settings, Upload, Plus, Trash, Loader2, Save, FilePenIcon, TrashIcon, PlusCircleIcon, BriefcaseIcon, ThumbsUpIcon, ClockIcon, BuildingIcon, CheckCircle, ExternalLinkIcon, StarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  branch?: string;
  cgpa?: number;
  skills?: string[];
  resume?: string;
}

// Extend the window interface for jspdf-autotable
declare global {
  interface Window {
    jsPDF: any;
  }
}

const StudentDashboard = () => {
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', tech: '', link: '' });
  const [editProfile, setEditProfile] = useState<any>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set());
  const [withdrawingApplications, setWithdrawingApplications] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }
      const headers = { 'Authorization': `Bearer ${token}` };

      const endpoints = [
        '/api/student/me',
        '/api/student/jobs',
        '/api/student/applications',
        '/api/student/projects',
      ];

      const responses = await Promise.all(endpoints.map(url => fetch(url, { headers })));

      for (const res of responses) {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ msg: 'Invalid JSON response from server.' }));
          console.error(`Failed to fetch from ${res.url}: ${res.status} ${res.statusText}`, errorData);
          throw new Error(`Failed to fetch data from ${res.url}. Server says: ${errorData.msg || 'Unknown error'}`);
        }
      }

      const [profileData, jobsData, applicationsData, projectsData] = await Promise.all(responses.map(res => res.json()));

      setStudent(profileData);
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      setApplications(applicationsData);
      setProjects(projectsData);

      // Generate mock notifications based on application status
      const mockNotifications = applicationsData
        .filter((app: any) => app.status !== 'Applied')
        .map((app: any) => ({
          id: app._id,
          title: `Application Update`,
          message: `Your application for ${app.job?.title || 'a position'} has been ${app.status.toLowerCase()}`,
          type: app.status === 'Rejected' ? 'error' : 'success',
          date: app.updatedAt || app.createdAt,
          read: false
        }));
      setNotifications(mockNotifications);

    } catch (err: any) {
      console.error("Dashboard fetchData error:", err);
      const errorMessage = err.message || 'An unknown error occurred. Please try logging in again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter jobs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  const handleApply = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to apply');
      }
      toast({ title: "Success", description: "Application submitted successfully!" });
      fetchData(); // Refresh data to show new application
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/jobs/${jobId}/save`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to save job');
      toast({ title: "Success", description: "Job saved successfully!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save job.", variant: "destructive" });
    }
  };

  const calculateProfileCompletion = () => {
    if (!student) return 0;
    const fields = ['name', 'college', 'branch', 'cgpa', 'skills'];
    const filledFields = fields.filter(field => {
        const value = student[field];
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
    });
    // resume and projects are bonus
    let completion = (filledFields.length / fields.length) * 100;
    if (student.resume) completion = Math.min(100, completion + 10);
    if (projects && projects.length > 0) completion = Math.min(100, completion + 10);
    return Math.round(completion);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      setWithdrawingApplications(prev => new Set(prev).add(applicationId));
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to withdraw application');
      }
      
      toast({ title: "Success", description: "Application withdrawn successfully!" });
      fetchData(); // Refresh data
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setWithdrawingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
        setApplyingJobs(prev => new Set(prev).add(jobId));
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/student/jobs/${jobId}/apply`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.msg || "Failed to apply.");
        }
        toast({ title: "Success", description: "Applied to job successfully!" });
        fetchData(); // Refresh application list
    } catch(err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
        setApplyingJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
        });
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/student/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ ...newProject, tech: newProject.tech.split(',') })
        });
        if (!res.ok) throw new Error("Failed to add project.");
        toast({ description: "Project added." });
        setIsProjectModalOpen(false);
        fetchData();
    } catch (err) {
        toast({ description: "Failed to add project.", variant: "destructive" });
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      // First, upload resume if one is selected
      if (resumeFile) {
          const formData = new FormData();
          formData.append('resume', resumeFile);
          try {
              const token = localStorage.getItem('token');
              await fetch('/api/student/resume', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` },
                  body: formData,
              });
              setResumeFile(null); // Clear the file input
          } catch (err) {
              toast({ description: "Resume upload failed.", variant: "destructive"});
              return; // Stop profile update if resume upload fails
          }
      }

      // Then, update the rest of the profile info
      try {
          const token = localStorage.getItem('token');
          await fetch('/api/student/me', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(editProfile),
          });
          toast({ description: "Profile updated." });
          setIsProfileModalOpen(false);
          fetchData(); // Refresh all data
      } catch (err) {
          toast({ description: "Failed to update profile.", variant: "destructive" });
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleDownloadResume = () => {
    if (student?.resume) {
      const link = document.createElement('a');
      link.href = student.resume;
      link.download = `${student.name}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({ 
        title: "No Resume", 
        description: "You haven't uploaded a resume yet.", 
        variant: "destructive" 
      });
    }
  };

  const handleDownloadReport = () => {
    if (!student) return;
    const doc = new jsPDF();

    doc.text(`Profile Report - ${student.name}`, 14, 20);
    doc.text(`Email: ${student.email}`, 14, 30);
    doc.text(`College: ${student.college?.name || 'N/A'}`, 14, 40);
    doc.text(`Branch: ${student.branch || 'N/A'}`, 14, 50);
    doc.text(`CGPA: ${student.cgpa || 'N/A'}`, 14, 60);

    if (student.skills && student.skills.length > 0) {
      doc.text('Skills', 14, 80);
      (doc as any).autoTable({
          startY: 85,
          head: [['Skills']],
          body: student.skills.map((s: string) => [s]),
      });
    }

    if (projects && projects.length > 0) {
        doc.text('Projects', 14, (doc as any).autoTable.previous.finalY + 20);
        (doc as any).autoTable({
            startY: (doc as any).autoTable.previous.finalY + 25,
            head: [['Name', 'Description', 'Technologies']],
            body: projects.map(p => [p.name, p.description, p.tech.join(', ')]),
        });
    }

    doc.save(`${student.name}_report.pdf`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!student) return <div>No student data found.</div>

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">PlacementPro</Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                }}>
                  <Bell className="h-4 w-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                    <div className="p-2 font-semibold border-b">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 border-b last:border-b-0 ${n.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}> 
                          <div className="font-medium">{n.title}</div>
                          <div className="text-sm">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{n.date ? new Date(n.date).toLocaleString() : ''}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                  {student ? student.name : 'Student'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        ) : student ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {student.name}! Track your applications and discover new opportunities.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{profileCompletion}%</div>
                  <Progress value={profileCompletion} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{applications.length}</div>
                  <p className="text-xs text-gray-500">Total applications sent</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{applications.filter(a => a.status === 'Interview').length}</div>
                  <p className="text-xs text-gray-500">Scheduled interviews</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Job Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{jobs.length}</div>
                  <p className="text-xs text-gray-500">Based on your skills</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="job-board">Job Board</TabsTrigger>
                <TabsTrigger value="applications">My Applications</TabsTrigger>
                <TabsTrigger value="profile">My Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Applications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Applications</CardTitle>
                      <CardDescription>Track your latest job applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {applications.slice(0, 3).map((app) => (
                          <div key={app._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{app.job?.company || 'N/A'}</h4>
                              <p className="text-sm text-gray-600">{app.job?.title || 'N/A'}</p>
                            </div>
                            <Badge variant={app.status === "Interview Scheduled" ? "default" : "secondary"}>
                              {app.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommended Jobs */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommended for You</CardTitle>
                      <CardDescription>AI-matched job opportunities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {jobs.slice(0, 3).map((job) => (
                          <div key={job._id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{job.company}</h4>
                                <p className="text-sm text-gray-600">{job.position}</p>
                                <p className="text-xs text-gray-500">{job.location}</p>
                              </div>
                              {/* Match percentage can be added later if implemented in backend */}
                            </div>
                            <Button size="sm" className="w-full" onClick={() => handleApplyJob(job._id)}>Apply Now</Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Events</CardTitle>
                    <CardDescription>Don't miss these important dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applications.filter(app => ["Interview Scheduled", "Offered"].includes(app.status)).length === 0 ? (
                      <div className="text-center text-gray-500">No upcoming events.</div>
                    ) : (
                      <div className="space-y-3">
                        {applications.filter(app => ["Interview Scheduled", "Offered"].includes(app.status)).map(app => (
                          <div key={app._id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{app.job?.title || 'Job'} - {app.status}</p>
                              <p className="text-sm text-gray-600">{app.job?.company || ''}</p>
                              <p className="text-xs text-gray-500">{app.updatedAt ? `Updated: ${new Date(app.updatedAt).toLocaleString()}` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="job-board">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Board</CardTitle>
                    <CardDescription>Discover opportunities tailored to your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Search jobs, companies, or skills..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
                    </div>
                    
                    {filteredJobs.length === 0 ? (
                      <div className="text-center py-8">
                        <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm ? 'No jobs found' : 'No jobs available'}
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? `No jobs match your search for "${searchTerm}". Try different keywords.`
                            : 'There are currently no approved jobs for your college. Check back later!'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredJobs.map((job) => {
                          const hasApplied = applications.some(app => app.job && (app.job._id === job._id || app.job === job._id));
                          return (
                            <div key={job._id} className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-white">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                      <BuildingIcon className="h-4 w-4" />
                                      <span>{job.company}</span>
                                    </div>
                                    {job.location && (
                                      <div className="flex items-center gap-1">
                                        <span>📍 {job.location}</span>
                                      </div>
                                    )}
                                    {job.salary && (
                                      <div className="flex items-center gap-1">
                                        <span>💰 {job.salary}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                                  {job.deadline && (
                                    <div className="flex items-center gap-1 text-sm text-orange-600 mb-3">
                                      <ClockIcon className="h-4 w-4" />
                                      <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApplyJob(job._id)}
                                  className="flex-1"
                                  disabled={hasApplied}
                                >
                                  {hasApplied ? 'Applied' : 'Apply Now'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleSaveJob(job._id)}
                                >
                                  Save Job
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>Track all your job applications in one place</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                        <p className="text-gray-500">Start applying to jobs from the Job Board to see your applications here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map((app) => (
                          <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{app.job?.title || 'Job Title'}</h4>
                                <p className="text-sm text-gray-600">{app.job?.company || 'Company Name'}</p>
                                <p className="text-xs text-gray-500">
                                  Applied on {new Date(app.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge 
                                variant={
                                  app.status === "Rejected" ? "destructive" : 
                                  app.status === "Offered" ? "default" : 
                                  app.status === "Interview Scheduled" ? "default" :
                                  "secondary"
                                }
                              >
                                {app.status}
                              </Badge>
                              {app.status === "Applied" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleWithdrawApplication(app._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Withdraw
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>Update your personal information, skills, and resume</CardDescription>
                    </div>
                    {!isProfileModalOpen ? (
                      <Button onClick={() => { setEditProfile(student); setIsProfileModalOpen(true); }}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="ghost" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Personal Information</h4>
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={isProfileModalOpen ? editProfile.name || '' : student.name || ''} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} readOnly={!isProfileModalOpen} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={isProfileModalOpen ? editProfile.email || '' : student.email || ''} onChange={e => setEditProfile({ ...editProfile, email: e.target.value })} readOnly={!isProfileModalOpen} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch">Branch</Label>
                          <Input id="branch" value={isProfileModalOpen ? editProfile.branch || '' : student.branch || ''} onChange={e => setEditProfile({ ...editProfile, branch: e.target.value })} readOnly={!isProfileModalOpen} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cgpa">CGPA</Label>
                          <Input id="cgpa" type="number" value={isProfileModalOpen ? editProfile.cgpa || '' : student.cgpa || ''} onChange={e => setEditProfile({ ...editProfile, cgpa: e.target.value })} readOnly={!isProfileModalOpen} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium">Skills</h4>
                        <div className="space-y-2">
                          <Label htmlFor="skills">Skills (comma-separated)</Label>
                          <Input
                            id="skills"
                            value={isProfileModalOpen ? (Array.isArray(editProfile.skills) ? editProfile.skills.join(', ') : '') : (Array.isArray(student.skills) ? student.skills.join(', ') : '')}
                            onChange={e => setEditProfile({ ...editProfile, skills: e.target.value.split(',').map(s => s.trim()) })}
                            placeholder="e.g., React, Node.js, Python"
                            readOnly={!isProfileModalOpen}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student?.skills && student.skills.length > 0 ? (
                            student.skills.map((skill, index) => (
                              <Badge key={index}>{skill}</Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No skills added yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Resume</h4>
                      {student?.resume ? (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <p>{student.resume.split('/').pop() || 'resume.pdf'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadResume}>Download</Button>
                            {isProfileModalOpen && (
                              <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Update
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <p className="text-gray-500">No resume uploaded</p>
                          </div>
                          {isProfileModalOpen && (
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Resume
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">My Projects</h4>
                      <div className="space-y-4">
                        {projects.map((p) => (
                          <div key={p._id} className="flex items-center">
                            <div className="flex-grow">
                              <p className="font-bold">{p.name}</p>
                              <p className="text-sm text-gray-600">{p.description}</p>
                              <div className="flex gap-2 mt-1">
                                {p.tech.map((t: string) => (
                                  <span key={t} className="text-xs bg-gray-200 px-2 py-1 rounded">{t}</span>
                                ))}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                await fetch(`/api/student/projects/${p._id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
                                fetchData(); // Refresh data
                                toast({ description: "Project deleted." });
                              } catch (err) {
                                toast({ description: "Failed to delete project.", variant: "destructive" });
                              }
                            }}>
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button className="mt-4" onClick={() => setIsProjectModalOpen(true)}>
                        <PlusCircleIcon className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="resume" className="text-right">Resume</Label>
                        <Input id="resume" type="file" onChange={(e) => e.target.files && setResumeFile(e.target.files[0])} className="col-span-3"/>
                    </div>
                    {student?.resume && (
                        <div className="text-sm text-center col-span-4">
                            Current Resume: <a href={`/${student.resume}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center text-gray-500">
            Could not load profile data.
          </div>
        )}
      </div>

      {/* Project Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>Enter project details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea id="description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tech" className="text-right">
                Technologies
              </Label>
              <Input id="tech" value={newProject.tech} onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link" className="text-right">
                Link
              </Label>
              <Input id="link" value={newProject.link} onChange={(e) => setNewProject({ ...newProject, link: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddProject}>Add Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input id="name" value={editProfile.name} onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" value={editProfile.email} onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branch" className="text-right">
                Branch
              </Label>
              <Input id="branch" value={editProfile.branch} onChange={(e) => setEditProfile({ ...editProfile, branch: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cgpa" className="text-right">
                CGPA
              </Label>
              <Input id="cgpa" value={editProfile.cgpa} onChange={(e) => setEditProfile({ ...editProfile, cgpa: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateProfile}>Update Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
