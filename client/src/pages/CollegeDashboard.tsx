import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Loader2, PlusCircle, User as UserIcon, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CollegeDashboard = () => {
  const [data, setData] = useState({ jobs: [] as any[], students: [] as any[], recruiters: [] as any[], pendingJobs: [] as any[] });
  const [stats, setStats] = useState({ totalStudents: 0, placedStudents: 0, pendingApprovals: 0, activeJobs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', location: ''});
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if(!token) {
        navigate('/auth');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      const [jobsRes, statsRes, studentsRes, recruitersRes, pendingJobsRes] = await Promise.all([
        fetch('/api/college/jobs/all', { headers }),
        fetch('/api/college/stats', { headers }),
        fetch('/api/college/students', { headers }),
        fetch('/api/college/recruiters', { headers }),
        fetch('/api/college/jobs/pending', { headers }),
      ]);
      if (!jobsRes.ok || !statsRes.ok || !studentsRes.ok || !recruitersRes.ok || !pendingJobsRes.ok) throw new Error('Failed to fetch all dashboard data.');
      
      const jobsData = await jobsRes.json();
      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();
      const recruitersData = await recruitersRes.json();
      const pendingJobsData = await pendingJobsRes.json();

      setData({ jobs: jobsData, students: studentsData, recruiters: recruitersData, pendingJobs: pendingJobsData });
      setStats(statsData);
    } catch (err: any) { setError(err.message); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  
  const handleJobStatusUpdate = async (jobId: string, status: 'Approved' | 'Rejected') => {
    try {
      await fetch(`/api/college/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify({ status }),
      });
      toast({ description: `Job has been ${status.toLowerCase()}.` });
      fetchData(); // Refresh all data
    } catch(e:any) { toast({ description: e.message, variant: 'destructive' }); }
  };
  
  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await fetch('/api/college/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
            body: JSON.stringify(newJob)
        });
        toast({ description: "Job posted successfully." });
        setIsModalOpen(false);
        setNewJob({ title: '', description: '', location: ''});
        fetchData(); // Refresh all data
    } catch(err:any) {
        toast({ description: err.message, variant: 'destructive' });
    }
  }
  
  const handleLogout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/auth');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (error) return <div className="text-red-500 text-center p-8 text-lg">{error}</div>;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">College Dashboard</h2>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-8 w-8 rounded-full"><UserIcon /></Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle>Total Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalStudents}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle>Pending Approvals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingApprovals}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle>Active Jobs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeJobs}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle>Recruiters</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.recruiters.length}</div></CardContent></Card>
        </div>
        <Tabs defaultValue="approvals" className="space-y-4">
            <TabsList>
                <TabsTrigger value="approvals">Job Approvals ({data.pendingJobs.length})</TabsTrigger>
                <TabsTrigger value="jobs">All Jobs ({data.jobs.length})</TabsTrigger>
                <TabsTrigger value="students">Students ({data.students.length})</TabsTrigger>
                <TabsTrigger value="recruiters">Recruiters ({data.recruiters.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="approvals">
                <Card><CardHeader><CardTitle>Job Approval Queue</CardTitle><CardDescription>Review job postings from recruiters</CardDescription></CardHeader>
                <CardContent>
                    {data.pendingJobs.length > 0 ? (
                        <div className="space-y-4">{data.pendingJobs.map((job) => (
                            <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div><h4 className="font-semibold">{job.title}</h4><p className="text-sm text-gray-600">From: {job.recruiter?.company || 'N/A'}</p></div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleJobStatusUpdate(job._id, 'Approved')}><CheckCircle className="h-4 w-4 mr-2" />Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleJobStatusUpdate(job._id, 'Rejected')}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                                </div>
                            </div>))}
                        </div>
                    ) : (<p className="text-center p-8 text-gray-500">No jobs are currently pending approval.</p>)}
                </CardContent></Card>
            </TabsContent>

            <TabsContent value="jobs">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle>All Job Postings</CardTitle>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4"/> Add Job Posting</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Post a New Job</DialogTitle></DialogHeader>
                                <form onSubmit={handleAddJob} className="space-y-4 py-4">
                                    <Input placeholder="Job Title" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} required/>
                                    <Textarea placeholder="Job Description" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} required/>
                                    <Input placeholder="Location (e.g. Remote)" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
                                    <DialogFooter><Button type="submit">Post Job</Button></DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>{data.jobs.map(job => (<TableRow key={job._id}><TableCell>{job.title}</TableCell><TableCell>{job.recruiter?.company}</TableCell><TableCell><Badge variant={job.status === 'Approved' ? 'default' : 'secondary'}>{job.status}</Badge></TableCell></TableRow>))}</TableBody>
                    </Table></CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="students">
                <Card><CardHeader><CardTitle>Student Directory</CardTitle></CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Branch</TableHead><TableHead>CGPA</TableHead></TableRow></TableHeader>
                        <TableBody>{data.students.map(s => (<TableRow key={s._id}><TableCell>{s.name}</TableCell><TableCell>{s.email}</TableCell><TableCell>{s.branch}</TableCell><TableCell>{s.cgpa}</TableCell></TableRow>))}</TableBody>
                    </Table></CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="recruiters">
                <Card><CardHeader><CardTitle>Recruiter Directory</CardTitle></CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Contact Name</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                        <TableBody>{data.recruiters.map(r => (<TableRow key={r._id}><TableCell>{r.company}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.email}</TableCell></TableRow>))}</TableBody>
                    </Table></CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
};

export default CollegeDashboard;
