import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created!",
        description: "You have successfully created an account.",
      });
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-card backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-primary bg-clip-text text-transparent">
            Authentication Required
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-card backdrop-blur-lg border border-white/20">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <Button 
              onClick={handleSignIn} 
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
              />
            </div>
            <Button 
              onClick={handleSignUp} 
              disabled={loading || !email || password.length < 6}
              className="w-full"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};