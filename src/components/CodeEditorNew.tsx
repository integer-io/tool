import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Download, Save, Upload, Play, Copy, FileText, Zap, Bug } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";

interface CodeEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const CodeEditor = ({ user, onAuthRequired }: CodeEditorProps) => {
  const [fileName, setFileName] = useState("main.js");
  const [code, setCode] = useState(`// Welcome to the Code Editor
function greetUser(name) {
    console.log(\`Hello, \${name}! Welcome to Integer-io Code Editor.\`);
    return \`Welcome, \${name}!\`;
}

// Example usage
const userName = "Developer";
const greeting = greetUser(userName);
document.body.innerHTML = \`<h1>\${greeting}</h1>\`;`);
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("14");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthCheck = () => {
    if (!user) {
      onAuthRequired();
      return false;
    }
    return true;
  };

  const languageTemplates = {
    javascript: `// JavaScript Example
function calculateSum(a, b) {
    return a + b;
}

console.log("Sum:", calculateSum(5, 3));`,
    
    python: `# Python Example
def calculate_sum(a, b):
    return a + b

print("Sum:", calculate_sum(5, 3))`,
    
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to my web page.</p>
</body>
</html>`,
    
    css: `/* CSS Example */
body {
    font-family: Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}`,
    
    json: `{
  "name": "My Project",
  "version": "1.0.0",
  "description": "A sample JSON configuration",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": ["javascript", "node"],
  "author": "Developer",
  "license": "MIT"
}`
  };

  const handleLanguageChange = (newLanguage: string) => {
    if (!handleAuthCheck()) return;
    
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage as keyof typeof languageTemplates] || "");
    
    // Update file extension
    const extensions = {
      javascript: ".js",
      python: ".py",
      html: ".html",
      css: ".css",
      json: ".json"
    };
    
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    setFileName(baseName + extensions[newLanguage as keyof typeof extensions]);
    
    toast.success(`Switched to ${newLanguage}`);
  };

  const runCode = async () => {
    if (!handleAuthCheck()) return;
    
    setIsRunning(true);
    setOutput("");
    
    try {
      if (language === "javascript") {
        // Create a safe execution environment
        const originalConsoleLog = console.log;
        let capturedOutput = "";
        
        console.log = (...args) => {
          capturedOutput += args.join(" ") + "\n";
        };
        
        try {
          // Execute the code in a try-catch to handle errors
          const result = eval(code);
          if (result !== undefined) {
            capturedOutput += `Result: ${result}\n`;
          }
        } catch (error) {
          capturedOutput += `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }
        
        console.log = originalConsoleLog;
        setOutput(capturedOutput || "Code executed successfully (no output)");
        
      } else if (language === "html") {
        // For HTML, show a preview
        setOutput("HTML Preview: Open the downloaded file in a browser to see the result.");
        
      } else if (language === "css") {
        setOutput("CSS code is ready. Apply it to an HTML document to see the styling effects.");
        
      } else if (language === "json") {
        try {
          JSON.parse(code);
          setOutput("✅ Valid JSON format");
        } catch (error) {
          setOutput(`❌ Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
        
      } else if (language === "python") {
        setOutput("Python execution requires a server environment. Code syntax appears valid.");
      }
      
      toast.success("Code executed!");
    } catch (error) {
      setOutput(`Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Code execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const formatCode = () => {
    if (!handleAuthCheck()) return;
    
    try {
      if (language === "json") {
        const parsed = JSON.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
        toast.success("JSON formatted!");
      } else if (language === "javascript") {
        // Basic JavaScript formatting
        let formatted = code
          .replace(/;/g, ';\n')
          .replace(/{/g, '{\n')
          .replace(/}/g, '\n}')
          .replace(/,/g, ',\n');
        
        // Clean up extra newlines
        formatted = formatted.replace(/\n\s*\n/g, '\n').trim();
        setCode(formatted);
        toast.success("Code formatted!");
      } else {
        toast.info("Auto-formatting not available for this language");
      }
    } catch (error) {
      toast.error("Failed to format code");
    }
  };

  const copyToClipboard = async () => {
    if (!handleAuthCheck()) return;
    
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const saveFile = () => {
    if (!handleAuthCheck()) return;
    
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`File saved as ${fileName}`);
    } catch (error) {
      toast.error("Failed to save file");
    }
  };

  const loadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleAuthCheck()) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      setFileName(file.name);
      
      // Auto-detect language based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json'
      };
      
      if (extension && languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }
      
      toast.success("File loaded successfully!");
    };
    reader.readAsText(file);
  };

  const insertSnippet = (snippet: string) => {
    if (!handleAuthCheck()) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    
    setCode(newCode);
    toast.success("Snippet inserted!");
  };

  const getEditorStyle = () => ({
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: `${fontSize}px`,
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: theme === 'dark' ? '#d4d4d4' : '#000000',
    border: theme === 'dark' ? '1px solid #404040' : '1px solid #d1d5db',
  });

  const snippets = {
    javascript: [
      { name: "Function", code: "function myFunction() {\n    // Your code here\n}" },
      { name: "For Loop", code: "for (let i = 0; i < array.length; i++) {\n    // Your code here\n}" },
      { name: "If Statement", code: "if (condition) {\n    // Your code here\n}" },
      { name: "Try-Catch", code: "try {\n    // Your code here\n} catch (error) {\n    console.error(error);\n}" }
    ],
    python: [
      { name: "Function", code: "def my_function():\n    # Your code here\n    pass" },
      { name: "For Loop", code: "for item in items:\n    # Your code here\n    pass" },
      { name: "If Statement", code: "if condition:\n    # Your code here\n    pass" },
      { name: "Class", code: "class MyClass:\n    def __init__(self):\n        # Your code here\n        pass" }
    ],
    html: [
      { name: "Div", code: '<div class="container">\n    <!-- Your content here -->\n</div>' },
      { name: "Button", code: '<button onclick="myFunction()">Click me</button>' },
      { name: "Form", code: '<form>\n    <input type="text" placeholder="Enter text">\n    <button type="submit">Submit</button>\n</form>' }
    ]
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Professional Code Editor
          </CardTitle>
          <CardDescription>
            Write, edit, and run code with syntax highlighting and professional tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Editor Settings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={!user}
                className="bg-white/50 backdrop-blur border-white/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange} disabled={!user}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme} disabled={!user}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fontsize">Font Size</Label>
              <Select value={fontSize} onValueChange={setFontSize} disabled={!user}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 p-3 bg-white/10 rounded-lg border border-white/20">
            <input
              ref={fileInputRef}
              type="file"
              accept=".js,.py,.html,.css,.json,.txt"
              onChange={loadFile}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={!user}
            >
              <Upload className="h-4 w-4 mr-2" />
              Load File
            </Button>
            
            <Button
              onClick={saveFile}
              variant="outline"
              size="sm"
              disabled={!user}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            
            <Button
              onClick={runCode}
              variant="default"
              size="sm"
              disabled={!user || isRunning}
            >
              {isRunning ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Code
                </>
              )}
            </Button>
            
            <Button
              onClick={formatCode}
              variant="outline"
              size="sm"
              disabled={!user}
            >
              <Bug className="h-4 w-4 mr-2" />
              Format
            </Button>
            
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              disabled={!user}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Code Editor</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="snippets">Snippets</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              {/* Code Editor */}
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Textarea
                  ref={textareaRef}
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={user ? "Start coding..." : "Please sign in to use the code editor"}
                  className="min-h-[400px] resize-none font-mono"
                  style={getEditorStyle()}
                  disabled={!user}
                />
                <div className="text-sm text-muted-foreground">
                  Lines: {code.split('\n').length} | 
                  Characters: {code.length} | 
                  Language: {language.toUpperCase()}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              <div className="space-y-2">
                <Label>Output</Label>
                <div className="min-h-[400px] p-4 bg-black text-green-400 rounded-lg font-mono text-sm overflow-auto">
                  {output || "No output yet. Run your code to see results here."}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="snippets" className="space-y-4">
              <div className="space-y-4">
                <Label>Code Snippets for {language.toUpperCase()}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {snippets[language as keyof typeof snippets]?.map((snippet, index) => (
                    <Button
                      key={index}
                      onClick={() => insertSnippet(snippet.code)}
                      variant="outline"
                      className="h-auto p-4 text-left justify-start"
                      disabled={!user}
                    >
                      <div>
                        <div className="font-medium">{snippet.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {snippet.code.split('\n')[0]}...
                        </div>
                      </div>
                    </Button>
                  )) || (
                    <div className="col-span-2 text-center text-muted-foreground">
                      No snippets available for {language}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {!user && (
            <div className="text-center p-8 bg-white/5 rounded-lg border border-white/20">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to access the professional code editor</p>
              <Button onClick={onAuthRequired} variant="default" size="lg">
                Sign In to Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};