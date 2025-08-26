@@ .. @@
                 {/* Image Editor API */}
                 <div className="space-y-4">
                   <div className="flex items-center gap-2">
                     <Palette className="h-5 w-5 text-primary" />
                     <h3 className="text-lg font-semibold">Image Editor</h3>
                   </div>
                   <div className="space-y-3">
                     <p className="text-sm text-muted-foreground">
-                      Get your Remove.bg API key:
+                      Get your free Remove.bg API key:
                     </p>
                     <ol className="text-sm space-y-2 list-decimal list-inside">
                       <li>Visit <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">remove.bg/api</a></li>
                       <li>Sign up for free</li>
-                      <li>Go to API dashboard</li>
+                      <li>Go to your API dashboard</li>
                       <li>Copy your API key</li>
                     </ol>
                     <Button asChild variant="glass" size="sm">
                       <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer">
                         Get API Key <ExternalLink className="h-3 w-3 ml-1" />
                       </a>
                     </Button>
                   </div>
                 </div>
+
+                {/* Code Generator API */}
+                <div className="space-y-4">
+                  <div className="flex items-center gap-2">
+                    <Code className="h-5 w-5 text-primary" />
+                    <h3 className="text-lg font-semibold">Code Generator</h3>
+                  </div>
+                  <div className="space-y-3">
+                    <p className="text-sm text-muted-foreground">
+                      Get your free Runware API key:
+                    </p>
+                    <ol className="text-sm space-y-2 list-decimal list-inside">
+                      <li>Visit <a href="https://runware.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">runware.ai</a></li>
+                      <li>Create a free account</li>
+                      <li>Go to your dashboard</li>
+                      <li>Generate your API key</li>
+                    </ol>
+                    <Button asChild variant="glass" size="sm">
+                      <a href="https://runware.ai" target="_blank" rel="noopener noreferrer">
+                        Get API Key <ExternalLink className="h-3 w-3 ml-1" />
+                      </a>
+                    </Button>
+                  </div>
+                </div>
               </div>
@@ .. @@
           {/* How to Use Section */}
-          <div className="grid md:grid-cols-3 gap-6">
+          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
-                  <Music className="h-5 w-5 text-primary" />
-                  Music & Code
+                  <Code className="h-5 w-5 text-primary" />
+                  Code Generator
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <ol className="space-y-3 text-sm list-decimal list-inside">
-                  <li>Enter your Hugging Face token</li>
-                  <li>Select genre/language</li>
-                  <li>Describe what you want</li>
+                  <li>Enter your Runware API key</li>
+                  <li>Select programming language</li>
+                  <li>Describe the code you need</li>
                   <li>Click generate</li>
-                  <li>Download or copy results</li>
+                  <li>Run or compile your code</li>
                 </ol>
                 <p className="text-xs text-muted-foreground">
-                  <strong>Tip:</strong> Clear descriptions work best!
+                  <strong>Tip:</strong> Be specific about requirements!
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
-                  <li>Choose edit type</li>
-                  <li>Enter API key (if needed)</li>
-                  <li>Click process</li>
+                  <li>Apply filters and effects</li>
+                  <li>Use AI background removal</li>
+                  <li>Transform and crop</li>
                   <li>Download edited image</li>
                 </ol>
                 <p className="text-xs text-muted-foreground">
-                  <strong>Note:</strong> Crop works without API key!
+                  <strong>Note:</strong> Most features work offline!
+                </p>
+              </CardContent>
+            </Card>
+
+            <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
+              <CardHeader>
+                <CardTitle className="flex items-center gap-2">
+                  <Music className="h-5 w-5 text-primary" />
+                  Text Generator
+                </CardTitle>
+              </CardHeader>
+              <CardContent className="space-y-4">
+                <ol className="space-y-3 text-sm list-decimal list-inside">
+                  <li>Enter your Hugging Face token</li>
+                  <li>Select content type and tone</li>
+                  <li>Describe what you want</li>
+                  <li>Click generate</li>
+                  <li>Copy your content</li>
+                </ol>
+                <p className="text-xs text-muted-foreground">
+                  <strong>Tip:</strong> Clear prompts work best!
                 </p>
               </CardContent>
             </Card>
           </div>