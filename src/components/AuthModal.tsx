import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, UserPlus, LogIn } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [step, setStep] = useState(1); // For sign up flow
  const { toast } = useToast();

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setAuthError("");
    setStep(1);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password. Please check your password and try again.';
      case 'auth/invalid-email':
        return 'Invalid email address format. Please enter a valid email.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a moment before trying again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'auth/missing-password':
        return 'Please enter your password.';
      case 'auth/missing-email':
        return 'Please enter your email address.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const handleSignIn = async () => {
    setAuthError("");
    
    // Validation
    if (!email.trim()) {
      setAuthError("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setAuthError("Please enter a valid email address");
      return;
    }
    
    if (!password) {
      setAuthError("Please enter your password");
      return;
    }

    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to Integer-io.",
      });
      onOpenChange(false);
      clearForm();
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpStep1 = () => {
    setAuthError("");
    
    if (!username.trim()) {
      setAuthError("Please enter a username");
      return;
    }
    
    if (username.trim().length < 2) {
      setAuthError("Username must be at least 2 characters long");
      return;
    }
    
    setStep(2);
  };

  const handleSignUpStep2 = () => {
    setAuthError("");
    
    if (!email.trim()) {
      setAuthError("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setAuthError("Please enter a valid email address");
      return;
    }
    
    setStep(3);
  };

  const handleSignUpComplete = async () => {
    setAuthError("");
    
    if (!password) {
      setAuthError("Please enter a password");
      return;
    }
    
    if (!validatePassword(password)) {
      setAuthError("Password must be at least 6 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      toast({
        title: "Account created successfully!",
        description: `Welcome ${username}! You can now use all Integer-io AI tools.`,
      });
      onOpenChange(false);
      clearForm();
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      toast({
        title: "Account creation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setAuthError("");
    setStep(1);
  };

  const goBackStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    setAuthError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-gradient-card backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-primary bg-clip-text text-transparent text-xl">
            {activeTab === "signin" ? "Welcome Back to Integer-io!" : 
             step === 1 ? "Create Your Account" :
             step === 2 ? "Enter Your Email" : "Set Your Password"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-card backdrop-blur-lg border border-white/20">
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </TabsTrigger>
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-white/50 backdrop-blur border-white/30"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-white/50 backdrop-blur border-white/30 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {authError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {authError}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleSignIn} 
              disabled={loading || !email || !password}
              className="w-full"
              variant="studio"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Integer-io
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-6">
            {/* Step 1: Username */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Choose a Username
                  </Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-white/50 backdrop-blur border-white/30"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your display name on Integer-io
                  </p>
                </div>

                {authError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {authError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSignUpStep1} 
                  disabled={loading || !username.trim()}
                  className="w-full"
                  variant="studio"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Continue with Username
                </Button>
              </>
            )}

            {/* Step 2: Email */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="bg-white/50 backdrop-blur border-white/30"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll use this to secure your account and save your work
                  </p>
                </div>

                {authError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {authError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={goBackStep}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSignUpStep2} 
                    disabled={loading || !email.trim()}
                    className="flex-1"
                    variant="studio"
                    size="lg"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Create Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password (min 6 characters)"
                      className="bg-white/50 backdrop-blur border-white/30 pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="bg-white/50 backdrop-blur border-white/30 pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className={`h-3 w-3 ${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`} />
                      At least 6 characters
                    </div>
                    <div className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <CheckCircle className={`h-3 w-3 ${password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                      Passwords match
                    </div>
                  </div>
                </div>

                {authError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {authError}
                    </AlertDescription>
                  </Alert>
                )}

                {password && password.length >= 6 && password === confirmPassword && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Perfect! Your account is ready to be created.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={goBackStep}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSignUpComplete} 
                    disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
                    className="flex-1"
                    variant="studio"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground mt-4">
          {activeTab === "signin" ? (
            <p>
              New to Integer-io?{" "}
              <button
                onClick={() => {
                  setActiveTab("signup");
                  setAuthError("");
                  setStep(1);
                }}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                Create your free account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setActiveTab("signin");
                  setAuthError("");
                  setStep(1);
                }}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

        {/* Account Creation Summary */}
        {activeTab === "signup" && step > 1 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Username:</span> {username}
              </div>
              {step > 2 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Email:</span> {email}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};