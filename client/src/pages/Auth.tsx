import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jwtDecode } from "jwt-decode";

type UserRole = 'Student' | 'College' | 'Recruiter';

interface College {
  _id: string;
  name: string;
}

interface DecodedToken {
  user: {
    id: string;
    role: UserRole;
  };
  iat: number;
  exp: number;
}

const Auth = () => {
  const [userType, setUserType] = useState<string>("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    collegeName: "",
    companyName: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch('/api/college/all');
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load college list.",
          variant: "destructive",
        });
      }
    };

    fetchColleges();
  }, []);

  const handleRedirect = (token: string) => {
    try {
      const decodedToken: DecodedToken = jwtDecode(token);
      const userRole = decodedToken.user.role;

      switch (userRole) {
        case "Student":
          navigate("/dashboard/student");
          break;
        case "College":
          navigate("/dashboard/college");
          break;
        case "Recruiter":
          navigate("/dashboard/recruiter");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
      toast({
        title: "Error",
        description: "Invalid session token. Please log in again.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.msg || "Login failed");
      }

      localStorage.setItem("token", data.token);
      
      toast({
        title: "Success!",
        description: "Login successful. Redirecting to dashboard...",
      });

      handleRedirect(data.token);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'student' && !selectedCollege) {
      toast({
        title: "Error",
        description: "Please select your college.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      const signupData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userType === "student" ? "Student" : userType === "college" ? "College" : "Recruiter",
      };

      if (userType === 'student') {
        signupData.college = selectedCollege;
      }
      if (userType === 'recruiter') {
        signupData.company = formData.companyName;
      }
      // For 'college' role, the name is taken from the main 'name' field

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      
      toast({
        title: "Success!",
        description: "Account created successfully. Redirecting to dashboard...",
      });

      handleRedirect(data.token);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to PlacementPro</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a</Label>
                    <Select value={userType} onValueChange={setUserType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="college">College/Placement Officer</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter your password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a</Label>
                    <Select value={userType} onValueChange={setUserType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="college">College/Placement Officer</SelectItem>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        value={formData.name}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>
                  
                  {userType === "college" && (
                    <div className="space-y-2">
                      <Label htmlFor="collegeName">College Name</Label>
                      <Input 
                        id="collegeName" 
                        placeholder="Enter college name" 
                        value={formData.collegeName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  )}
                  
                  {userType === "recruiter" && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input 
                        id="companyName" 
                        placeholder="Enter company name" 
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  )}
                  
                  {userType === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="college">College</Label>
                      <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your college" />
                        </SelectTrigger>
                        <SelectContent>
                          {colleges.map((college) => (
                            <SelectItem key={college._id} value={college._id}>
                              {college.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Create a password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Forgot your password?{" "}
                <Link to="#" className="text-blue-600 hover:underline">
                  Reset it here
                </Link>
              </p>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full">
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full">
                Continue with LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
