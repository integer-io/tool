import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Key, Image, HelpCircle, CheckCircle, Music, Code, Palette } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Help = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Help & Getting Started
            </h1>
            <p className="text-xl text-muted-foreground">
              Learn how to use Integer-io's AI-powered generators
            </p>
          </div>

          {/* API Keys Section */}
          <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Getting Your API Keys
              </CardTitle>
              <CardDescription>
                You need free API keys to use our generators. Here's how to get them:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Image Generator API */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Image Generator</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Get your free Runware API key:
                    </p>
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                      <li>Visit <a href="https://runware.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">runware.ai</a></li>
                      <li>Create a free account</li>
                      <li>Go to your dashboard</li>
                      <li>Generate your API key</li>
                    </ol>
                    <Button asChild variant="glass" size="sm">
                      <a href="https://runware.ai" target="_blank" rel="noopener noreferrer">
                        Get API Key <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Music & Code Generator API */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Music & Code</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Get your free Hugging Face token:
                    </p>
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                      <li>Visit <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">huggingface.co</a></li>
                      <li>Sign up for free</li>
                      <li>Go to Settings → Access Tokens</li>
                      <li>Create new token (Read role)</li>
                    </ol>
                    <Button asChild variant="glass" size="sm">
                      <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">
                        Get HF Token <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Image Editor API */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Image Editor</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Get your Remove.bg API key:
                    </p>
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                      <li>Visit <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">remove.bg/api</a></li>
                      <li>Sign up for free</li>
                      <li>Go to API dashboard</li>
                      <li>Copy your API key</li>
                    </ol>
                    <Button asChild variant="glass" size="sm">
                      <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer">
                        Get API Key <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>All APIs offer free tiers!</strong> No credit card required. Your API keys are stored locally and never shared.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* How to Use Section */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Image Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li>Enter your Runware API key</li>
                  <li>Write a detailed image description</li>
                  <li>Choose dimensions and style</li>
                  <li>Click "Generate Image"</li>
                  <li>Download your image</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Be specific for better results!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  Music & Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li>Enter your Hugging Face token</li>
                  <li>Select genre/language</li>
                  <li>Describe what you want</li>
                  <li>Click generate</li>
                  <li>Download or copy results</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Clear descriptions work best!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Image Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm list-decimal list-inside">
                  <li>Upload your image</li>
                  <li>Choose edit type</li>
                  <li>Enter API key (if needed)</li>
                  <li>Click process</li>
                  <li>Download edited image</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Crop works without API key!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Why do I need to sign in?</h4>
                  <p className="text-sm text-muted-foreground">
                    Signing in allows us to save your generation history and preferences. Your data is secure and private.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Are the API keys really free?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes! All services offer generous free tiers perfect for personal use and experimentation.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">How do I get better results?</h4>
                  <p className="text-sm text-muted-foreground">
                    Be specific and detailed in your descriptions. For images: include style, lighting, mood. For code: specify language, framework, and requirements.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Can I use the generated content commercially?</h4>
                  <p className="text-sm text-muted-foreground">
                    Please check each service's terms of service regarding commercial usage of generated content.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">My generation failed. What should I do?</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your API key, internet connection, and try a simpler prompt. Some models may be temporarily unavailable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>
                Still have questions? We're here to help!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Integer-io is powered by cutting-edge AI technology to bring you the best content generation experience.
                Keep experimenting and creating amazing content!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;