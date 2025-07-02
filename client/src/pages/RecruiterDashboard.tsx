import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, User, Search, Calendar, FileText, Settings, Plus, Loader2, PlusCircleIcon, EyeIcon, EditIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CopyIcon } from "lucide-react";

// Define comprehensive interfaces for our data structures
interface College {
  _id: string;
  name: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  college: College;
  status: 'Pending' | 'Approved' | 'Rejected';
  applicants: number;
  posted: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
    cgpa: number;
    skills: string[];
    college: College;
}

interface Application {
    _id: string;
    job: Job;
    student: Student;
    status: 'Applied' | 'Viewed' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
    date: string;
}

const RecruiterDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState({ jobs: [] as Job[], applications: [] as Application[], colleges: [] as College[], candidates: [] as Student[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for forms
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [isViewAppsOpen, setIsViewAppsOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [appsForCurrentJob, setAppsForCurrentJob] = useState<Application[]>([]);
  
  // Form state for posting jobs
  const [postJobForm, setPostJobForm] = useState({
    title: '',
    description: '',
    college: ''
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const [jobsRes, collegesRes, candidatesRes] = await Promise.all([
        fetch('/api/recruiter/jobs', { headers }),
        fetch('/api/college/all', { headers }),
        fetch('/api/recruiter/candidates', { headers }),
      ]);

      if (!jobsRes.ok || !collegesRes.ok || !candidatesRes.ok) throw new Error('Failed to fetch initial data.');

      const jobsData = await jobsRes.json();
      const collegesData = await collegesRes.json();
      const candidatesData = await candidatesRes.json();
      setData({ jobs: jobsData, applications: [], colleges: collegesData, candidates: candidatesData });
      console.log('Full data after setData:', { jobs: jobsData, applications: [], colleges: collegesData, candidates: candidatesData });

      // Fetch all applications for all jobs posted by the recruiter
      const appPromises = jobsData.map((job: any) => 
        fetch(`/api/recruiter/jobs/${job._id}/applications`, { headers }).then(res => res.ok ? res.json() : [])
      );
      const appsByJob = await Promise.all(appPromises);
      setData(prev => ({ ...prev, applications: appsByJob.flat() }));

      // After fetching colleges
      console.log('Fetched colleges:', collegesData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate required fields
    if (!postJobForm.title || !postJobForm.description || !postJobForm.college) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/recruiter/jobs', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(postJobForm),
        });
        if (!res.ok) throw new Error('Failed to post job.');
        toast({ title: "Success", description: "Job posted successfully!" });
        setIsPostJobOpen(false);
        // Reset form
        setPostJobForm({ title: '', description: '', college: '' });
        fetchData(); // Refresh data
    } catch(err) {
        toast({ title: "Error", description: "Failed to post job.", variant: "destructive" });
    }
  };
  
  const handleEditJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/recruiter/jobs/${currentJob?._id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update job.');
        toast({ title: "Success", description: "Job updated successfully!" });
        setIsEditJobOpen(false);
        fetchData(); // Refresh data
    } catch(err) {
        toast({ title: "Error", description: "Failed to update job.", variant: "destructive" });
    }
  };
  
  const handleViewApplications = async (jobId: string) => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/recruiter/jobs/${jobId}/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch applications.');
        const data = await res.json();
        setAppsForCurrentJob(data);
        const jobToView = data.map((app: any) => app.job);
        if(jobToView) setCurrentJob(jobToView[0]);
        setIsViewAppsOpen(true);
    } catch (err) {
        toast({ title: "Error", description: "Failed to fetch applications.", variant: "destructive" });
    }
  };

  const handleShareJob = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`; // Assuming a public job view page exists
    navigator.clipboard.writeText(url);
    toast({ description: "Job link copied to clipboard!" });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/auth');
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  const jobPostings = [
    { title: "Software Engineer", applicants: 45, status: "Pending Approval", posted: "2024-01-10" },
    { title: "Data Analyst", applicants: 32, status: "Approved", posted: "2024-01-08" },
    { title: "Product Manager", applicants: 28, status: "Rejected", posted: "2024-01-05" },
  ];

  const candidatesByYear = {
    "4th Year": [
      { name: "John Doe", college: "ABC University", branch: "CSE", cgpa: "8.5", skills: ["React", "Node.js"], status: "Shortlisted" },
      { name: "Jane Smith", college: "XYZ College", branch: "ECE", cgpa: "9.1", skills: ["Python", "ML"], status: "Interview Scheduled" },
    ],
    "3rd Year": [
      { name: "Mike Johnson", college: "DEF Institute", branch: "ME", cgpa: "7.8", skills: ["AutoCAD", "SolidWorks"], status: "Applied" },
      { name: "Sarah Wilson", college: "ABC University", branch: "CSE", cgpa: "8.2", skills: ["Java", "Spring"], status: "Applied" },
    ],
    "2nd Year": [
      { name: "Alex Chen", college: "XYZ College", branch: "IT", cgpa: "8.7", skills: ["JavaScript", "React"], status: "Applied" },
    ]
  };

  const candidates = [
    { name: "John Doe", college: "ABC University", branch: "CSE", cgpa: "8.5", skills: ["React", "Node.js"], status: "Shortlisted" },
    { name: "Jane Smith", college: "XYZ College", branch: "ECE", cgpa: "9.1", skills: ["Python", "ML"], status: "Interview Scheduled" },
    { name: "Mike Johnson", college: "DEF Institute", branch: "ME", cgpa: "7.8", skills: ["AutoCAD", "SolidWorks"], status: "Applied" },
  ];

  const interviews = [
    { candidate: "Jane Smith", position: "Data Analyst", date: "2024-01-16", time: "2:00 PM", type: "Video Call" },
    { candidate: "Alex Johnson", position: "Software Engineer", date: "2024-01-17", time: "10:00 AM", type: "In-person" },
    { candidate: "Sarah Wilson", position: "Product Manager", date: "2024-01-18", time: "3:30 PM", type: "Phone" },
  ];

  let renderError = null;
  let mainContent = null;
  try {
    mainContent = (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">PlacementPro</Link>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
            <p className="text-gray-600">Manage job postings, find candidates, and streamline your hiring process.</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{data.jobs.length}</div>
                <p className="text-xs text-gray-500">3 pending approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.applications.length}</div>
                <p className="text-xs text-gray-500">35 new this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Interviews Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{data.applications.filter(a => a.status === 'Interview').length}</div>
                <p className="text-xs text-gray-500">8 this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Offers Extended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{data.applications.filter(a => a.status === 'Hired').length}</div>
                <p className="text-xs text-gray-500">15 accepted</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Job Postings</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="interviews">Interviews</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Latest candidate applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(candidatesByYear).slice(0, 1).map(([year, candidates]) => (
                        <div key={year}>
                          <h4 className="font-medium text-sm text-gray-500 mb-2">{year} Students</h4>
                          {candidates.slice(0, 2).map((candidate, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{typeof candidate.name === 'string' ? candidate.name : 'N/A'}</h4>
                                  <p className="text-sm text-gray-600">{typeof candidate.college === 'object' && candidate.college !== null && 'name' in candidate.college ? candidate.college.name : 'N/A'} • {candidate.branch}</p>
                                  <p className="text-xs text-gray-500">CGPA: {candidate.cgpa}</p>
                                </div>
                              </div>
                              <Badge variant={candidate.status === "Shortlisted" ? "default" : "secondary"}>
                                {candidate.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Interviews */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Interviews</CardTitle>
                    <CardDescription>Scheduled interviews this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interviews.map((interview, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{typeof interview.candidate === 'string' ? interview.candidate : 'N/A'}</h4>
                              <p className="text-sm text-gray-600">{interview.position}</p>
                            </div>
                            <Badge variant="outline">{interview.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{interview.date} at {interview.time}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button className="h-20 flex flex-col items-center justify-center">
                      <PlusCircleIcon className="h-6 w-6 mb-2" />
                      Post New Job
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Search className="h-6 w-6 mb-2" />
                      Search Candidates
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <Calendar className="h-6 w-6 mb-2" />
                      Schedule Interview
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                      <FileText className="h-6 w-6 mb-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Job Postings</CardTitle>
                  <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
                    <DialogTrigger asChild><Button><PlusCircleIcon className="mr-2 h-4 w-4" /> Post New Job</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create a New Job Posting</DialogTitle></DialogHeader>
                      <form onSubmit={handlePostJob}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input 
                              id="title" 
                              value={postJobForm.title}
                              onChange={(e) => setPostJobForm({...postJobForm, title: e.target.value})}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea 
                              id="description" 
                              value={postJobForm.description}
                              onChange={(e) => setPostJobForm({...postJobForm, description: e.target.value})}
                              required 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="college">Target College</Label>
                            <Select 
                              value={postJobForm.college || undefined}
                              onValueChange={(value) => setPostJobForm({...postJobForm, college: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a college" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.colleges.length === 0 ? (
                                  <div className="px-4 py-2 text-gray-500">No colleges found. Please add colleges first.</div>
                                ) : (
                                  data.colleges.map((college) => (
                                    <SelectItem key={college._id} value={college._id}>
                                      {typeof college.name === 'string' ? college.name : 'N/A'}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter><Button type="submit">Post Job</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.jobs.map((job) => (
                      <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{typeof job.title === 'string' ? job.title : 'N/A'}</h4>
                          <p className="text-sm text-gray-500">{typeof job.college === 'object' && job.college !== null && 'name' in job.college ? job.college.name : 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={job.status === 'Approved' ? 'default' : (job.status === 'Pending' ? 'secondary' : 'destructive')}>
                              {job.status}
                            </Badge>
                            <span className="text-xs text-gray-500">Posted on {new Date(job.posted).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{job.applicants} Applicants</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" disabled={job.status !== "Approved"} onClick={() => handleViewApplications(job._id)}>
                              View Applications
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setCurrentJob(job); setIsEditJobOpen(true); }}>Edit</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates">
              <Card>
                <CardHeader><CardTitle>Candidate Pool</CardTitle><CardDescription>Unique students who have applied to your jobs.</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Skills</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.candidates.map(c => <TableRow key={c._id}><TableCell>{typeof c.name === 'string' ? c.name : 'N/A'}</TableCell><TableCell>{c.email}</TableCell><TableCell>{c.skills.join(', ')}</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Interview Management</CardTitle>
                    <CardDescription>Manage all your interviews in one place</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interviews.concat([
                      { candidate: "David Lee", position: "Software Engineer", date: "2024-01-19", time: "11:00 AM", type: "Video Call" },
                      { candidate: "Emma Wilson", position: "Data Analyst", date: "2024-01-20", time: "4:00 PM", type: "In-person" }
                    ]).map((interview, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{typeof interview.candidate === 'string' ? interview.candidate : 'N/A'}</h4>
                            <p className="text-sm text-gray-600">{interview.position}</p>
                            <p className="text-xs text-gray-500">{interview.date} at {interview.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{interview.type}</Badge>
                          <div className="mt-2 space-x-2">
                            <Button variant="outline" size="sm">Reschedule</Button>
                            <Button variant="outline" size="sm">Cancel</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hiring Funnel</CardTitle>
                    <CardDescription>Current recruitment pipeline</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Applications Received</span>
                        <span className="font-semibold">{data.applications.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Candidates Screened</span>
                        <span className="font-semibold">{data.applications.filter(a => a.status === 'Interview').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Interviews Conducted</span>
                        <span className="font-semibold">{data.applications.filter(a => a.status === 'Interview').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Offers Extended</span>
                        <span className="font-semibold">{data.applications.filter(a => a.status === 'Hired').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Offers Accepted</span>
                        <span className="font-semibold">{data.applications.filter(a => a.status === 'Hired').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Colleges</CardTitle>
                    <CardDescription>Best performing colleges by applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.colleges.map((college) => (
                        <div key={college._id} className="flex justify-between items-center">
                          <span>{typeof college.name === 'string' ? college.name : 'N/A'}</span>
                          <span className="font-semibold">{data.applications.filter(a => (typeof a.student.college === 'object' && a.student.college && 'name' in a.student.college && typeof college.name === 'string' && a.student.college.name === college.name)).length} candidates</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Job Dialog */}
        <Dialog open={isEditJobOpen} onOpenChange={setIsEditJobOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Job Posting</DialogTitle></DialogHeader>
            {currentJob && (
              <form onSubmit={handleEditJob}>
                <div className="grid gap-4 py-4">
                  <Input name="title" defaultValue={currentJob.title} required />
                  <Textarea name="description" defaultValue={currentJob.description} required />
                  <Input name="location" defaultValue={currentJob.location} />
                  {/* College not editable for now to maintain integrity */}
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        
        {/* View Applications Dialog */}
        <Dialog open={isViewAppsOpen} onOpenChange={setIsViewAppsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Applications for {currentJob?.title}</DialogTitle></DialogHeader>
              <div>
                {appsForCurrentJob.length > 0 ? appsForCurrentJob.map(app => (
                  <div key={app._id} className="p-2 border-b">
                    <p><strong>{typeof app.student.name === 'string' ? app.student.name : 'N/A'}</strong> - {app.student.email}</p>
                    <p>Applied on: {new Date(app.date).toLocaleDateString()}</p>
                    <p>Status: {app.status}</p>
                    <p>CGPA: {app.student.cgpa}</p>
                    <p>Skills: {app.student.skills.join(', ')}</p>
                  </div>
                )) : <p>No applications found for this job.</p>}
              </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } catch (err) {
    renderError = err;
  }
  if (renderError) {
    return <div className="text-red-500 p-8 text-center">An error occurred while loading the recruiter dashboard.<br/>{String(renderError)}</div>;
  }
  return mainContent;
};

export default RecruiterDashboard;
