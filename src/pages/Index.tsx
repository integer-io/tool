import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaceGenerator } from "@/components/FaceGenerator";
import { ImageEditor } from "@/components/ImageEditorNew";
import { PDFConverter } from "@/components/PDFConverterNew";
import { TextGenerator } from "@/components/TextGenerator";
import { CodeEditorWithGenerator } from "@/components/CodeEditorWithGenerator";
import { DocumentEditor } from "@/components/DocumentEditor";
import { PDFEditor } from "@/components/PDFEditor";
import { AuthModal } from "@/components/AuthModal";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, FileText, Info, Type, Code, Palette, FileImage, User, Edit, Settings } from "lucide-react";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-background">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Sign In Button - Top Right Corner */}
          {!user && (
            <div className="fixed top-20 right-4 z-40">
              <Button
                onClick={() => setAuthModalOpen(true)}
                variant="default"
                size="sm"
                className="bg-gradient-primary hover:bg-gradient-secondary shadow-lg"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-4 md:space-y-6">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight px-4">
                Integer-io
              </h1>
            </div>
            
            <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
                <img 
                  src="/lovable-uploads/9cdee21b-a567-4d67-8676-460f60cda5b1.png" 
                  alt="Integer-io Logo" 
                  className="h-10 w-10 md:h-12 md:w-12 object-contain flex-shrink-0"
                />
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent text-center">
                  AI-Powered Tools Suite
                </h2>
              </div>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Generate AI images, convert documents, and access powerful AI tools all in one place
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm">AI Image Generation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <Edit className="h-4 w-4 text-primary" />
                <span className="text-sm">Document Editor</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-sm">Image Editor</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <FileImage className="h-4 w-4 text-primary" />
                <span className="text-sm">Background Remover</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <Type className="h-4 w-4 text-primary" />
                <span className="text-sm">Text Generation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-sm">Code Generation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card backdrop-blur-lg rounded-full border border-white/20">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm">PDF Conversion</span>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <Tabs defaultValue="images" className="w-full">
            {/* API Key Information Alert */}
            <Alert className="mb-6 bg-gradient-card backdrop-blur-lg border-white/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>🎯 Tool Requirements:</strong> PDF tools, Image Editor, and Document Editor work completely offline. AI generators need free API tokens (no credit card required).
                <br />
                <strong>🚀 Need help getting started?</strong>{" "}
                <a href="/help" className="text-primary hover:underline">
                  Visit our Help page
                </a>{" "}
                for step-by-step instructions to get your free API tokens in 2 minutes.
                <br />
                <strong>🔒 Privacy:</strong> All API tokens are stored locally on your device and never shared with anyone.
              </AlertDescription>
            </Alert>

            <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 max-w-7xl mx-auto bg-gradient-card backdrop-blur-lg border border-white/20 gap-1 p-1">
              <TabsTrigger value="images" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">AI Images</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Palette className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Image Edit</span>
                <span className="sm:hidden">Edit</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Code className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Code</span>
                <span className="sm:hidden">Code</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Document</span>
                <span className="sm:hidden">Doc</span>
              </TabsTrigger>
              <TabsTrigger value="pdf" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">PDF Tools</span>
                <span className="sm:hidden">PDF</span>
              </TabsTrigger>
              <TabsTrigger value="pdfeditor" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">PDF Edit</span>
                <span className="sm:hidden">Edit</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white text-xs md:text-sm">
                <Type className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">AI Text</span>
                <span className="sm:hidden">Text</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="images" className="space-y-6">
                <FaceGenerator user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>

              <TabsContent value="editor" className="space-y-6">
                <ImageEditor user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>

              <TabsContent value="code" className="space-y-6">
                <CodeEditorWithGenerator user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>

              <TabsContent value="document" className="space-y-6">
                <DocumentEditor user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>

              <TabsContent value="pdf" className="space-y-6">
                <PDFConverter />
              </TabsContent>

              <TabsContent value="pdfeditor" className="space-y-6">
                <PDFEditor user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>

              <TabsContent value="text" className="space-y-6">
                <TextGenerator user={user} onAuthRequired={() => setAuthModalOpen(true)} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-lg bg-white/5 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <img 
                src="/lovable-uploads/9cdee21b-a567-4d67-8676-460f60cda5b1.png" 
                alt="Integer-io Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent">
                Integer-io
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your complete AI-powered tools suite for content creation and document processing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;