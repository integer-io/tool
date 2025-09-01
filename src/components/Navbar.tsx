import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpCircle, Home, LogOut, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-card backdrop-blur-lg border-b border-white/20 shadow-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Company Logo and Name - Left Side with proper z-index */}
          <Link to="/" className="navbar-brand flex items-center gap-3 text-2xl md:text-3xl font-bold text-primary">
            <img 
              src="/lovable-uploads/9cdee21b-a567-4d67-8676-460f60cda5b1.png" 
              alt="Integer-io Logo" 
              className="h-12 w-12 md:h-16 md:w-16 object-contain flex-shrink-0"
            />
            <span className="company-name text-xl md:text-3xl bg-gradient-primary bg-clip-text text-transparent">
              Integer-io
            </span>
          </Link>

          {/* Navigation Links - Right Side */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="hidden md:flex space-x-4">
              <Link to="/">
                <Button 
                  variant={isActive("/") ? "default" : "ghost"} 
                  size="lg"
                  className="flex items-center gap-2 text-base font-medium"
                >
                  <Home className="h-5 w-5" />
                  Home
                </Button>
              </Link>
              
              <Link to="/help">
                <Button 
                  variant={isActive("/help") ? "default" : "ghost"} 
                  size="lg"
                  className="flex items-center gap-2 text-base font-medium"
                >
                  <HelpCircle className="h-5 w-5" />
                  Help
                </Button>
              </Link>
            </div>

            {/* User Info */}
            {user ? (
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="hidden sm:flex items-center gap-2 text-sm md:text-base bg-white/10 px-3 py-2 rounded-full">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="max-w-[120px] md:max-w-none truncate font-medium">{user.email}</span>
                </div>
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="lg"
                  className="flex items-center gap-2 text-base font-medium"
                >
                  <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="text-sm md:text-base text-muted-foreground font-medium">
                Sign in required for all tools
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="lg"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/") ? "default" : "ghost"} 
                  size="lg"
                  className="w-full justify-start flex items-center gap-3"
                >
                  <Home className="h-5 w-5" />
                  Home
                </Button>
              </Link>
              
              <Link to="/help" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive("/help") ? "default" : "ghost"} 
                  size="lg"
                  className="w-full justify-start flex items-center gap-3"
                >
                  <HelpCircle className="h-5 w-5" />
                  Help
                </Button>
              </Link>

              {user && (
                <div className="pt-3 border-t border-white/20">
                  <div className="flex items-center gap-3 text-base text-muted-foreground px-3 py-2 bg-white/5 rounded-lg mb-2">
                    <User className="h-5 w-5" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                  <Button 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }} 
                    variant="outline" 
                    size="lg"
                    className="w-full justify-start flex items-center gap-3"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};