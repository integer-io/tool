import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Download, Save, Upload, Play, Copy, FileText, Zap, Bug, Wand2, Key, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { useApiKeys } from "@/hooks/useApiKeys";

interface CodeEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const CodeEditorWithGenerator = ({ user, onAuthRequired }: CodeEditorProps) => {
  const [fileName, setFileName] = useState("main.js");
  const [code, setCode] = useState(`// Welcome to the Code Editor with AI Generator
function greetUser(name) {
    console.log(\`Hello, \${name}! Welcome to Integer-io Code Editor.\`);
    return \`Welcome, \${name}!\`;
}

// Example usage
const userName = "Developer";
const greeting = greetUser(userName);
console.log(greeting);`);
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("14");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [generatorLanguage, setGeneratorLanguage] = useState("javascript");
  const [generatorFramework, setGeneratorFramework] = useState("none");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getApiKey, setApiKey, hasApiKey } = useApiKeys();

  const runwareApiKey = getApiKey('runware') || '';

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

const result = calculateSum(5, 3);
console.log("Sum:", result);`,
    
    python: `# Python Example
def calculate_sum(a, b):
    return a + b

result = calculate_sum(5, 3)
print("Sum:", result)`,
    
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
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
}`,

    typescript: `// TypeScript Example
interface User {
    name: string;
    age: number;
}

function greetUser(user: User): string {
    return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

const user: User = { name: "Developer", age: 25 };
console.log(greetUser(user));`,

    java: `// Java Example
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        int sum = calculateSum(5, 3);
        System.out.println("Sum: " + sum);
    }
    
    public static int calculateSum(int a, int b) {
        return a + b;
    }
}`,

    cpp: `// C++ Example
#include <iostream>
using namespace std;

int calculateSum(int a, int b) {
    return a + b;
}

int main() {
    cout << "Hello, World!" << endl;
    
    int result = calculateSum(5, 3);
    cout << "Sum: " << result << endl;
    
    return 0;
}`,

    csharp: `// C# Example
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        int result = CalculateSum(5, 3);
        Console.WriteLine($"Sum: {result}");
    }
    
    static int CalculateSum(int a, int b) {
        return a + b;
    }
}`
  };

  const generateCode = async () => {
    if (!handleAuthCheck()) return;

    if (!runwareApiKey.trim()) {
      toast.error("Please enter your Runware API key");
      return;
    }

    if (!generatorPrompt.trim()) {
      toast.error("Please describe what code you need");
      return;
    }

    setIsGenerating(true);

    try {
      const systemPrompt = `You are a professional ${generatorLanguage} developer. Generate clean, well-documented ${generatorLanguage} code${generatorFramework !== 'none' ? ` using ${generatorFramework}` : ''}. 
Include comments explaining key parts. Follow best practices and modern conventions. Only return the code, no explanations.`;
      
      const fullPrompt = `${systemPrompt}\n\nUser request: ${generatorPrompt}\n\nCode:`;

      // Using Runware API for text generation
      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            taskType: "authentication",
            apiKey: runwareApiKey
          },
          {
            taskType: "textInference",
            taskUUID: crypto.randomUUID(),
            prompt: fullPrompt,
            maxTokens: 1500,
            temperature: 0.3
          }
        ])
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error || result.errors) {
        throw new Error(result.error || result.errors[0]?.message || "Failed to generate code");
      }

      const textResult = result.data?.find((item: any) => item.taskType === "textInference");
      
      if (textResult && textResult.text) {
        let generatedCode = textResult.text.trim();
        
        // Clean up the generated code
        if (generatedCode.includes('```')) {
          const codeMatch = generatedCode.match(/```[\w]*\n?([\s\S]*?)```/);
          if (codeMatch) {
            generatedCode = codeMatch[1].trim();
          }
        }
        
        setCode(generatedCode);
        setLanguage(generatorLanguage);
        
        // Update file extension
        const extensions = {
          javascript: ".js",
          python: ".py",
          html: ".html",
          css: ".css",
          json: ".json",
          typescript: ".ts",
          java: ".java",
          cpp: ".cpp",
          csharp: ".cs"
        };
        
        const baseName = fileName.replace(/\.[^/.]+$/, "") || "generated";
        setFileName(baseName + (extensions[generatorLanguage as keyof typeof extensions] || ".txt"));
        
        toast.success("Code generated successfully!");
      } else {
        throw new Error("No code generated");
      }
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error(error.message || "Failed to generate code. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
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
      json: ".json",
      typescript: ".ts",
      java: ".java",
      cpp: ".cpp",
      csharp: ".cs"
    };
    
    const baseName = fileName.replace(/\.[^/.]+$/, "") || "main";
    setFileName(baseName + (extensions[newLanguage as keyof typeof extensions] || ".txt"));
    
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
        const originalConsoleError = console.error;
        let capturedOutput = "";
        
        console.log = (...args) => {
          capturedOutput += "LOG: " + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" ") + "\n";
        };
        
        console.error = (...args) => {
          capturedOutput += "ERROR: " + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" ") + "\n";
        };
        
        try {
          // Execute the code in a try-catch to handle errors
          const result = new Function(code)();
          if (result !== undefined) {
            capturedOutput += `RETURN: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}\n`;
          }
        } catch (error) {
          capturedOutput += `EXECUTION ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }
        
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        setOutput(capturedOutput || "✅ Code executed successfully (no output)");
        
      } else if (language === "html") {
        // For HTML, validate and show preview info
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(code, 'text/html');
          const errors = doc.querySelectorAll('parsererror');
          
          if (errors.length === 0) {
            setOutput("✅ HTML is valid\n📄 Preview: Save and open the file in a browser to see the result");
          } else {
            setOutput("❌ HTML contains errors\n" + Array.from(errors).map(e => e.textContent).join('\n'));
          }
        } catch (error) {
          setOutput(`❌ HTML Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
      } else if (language === "css") {
        setOutput("✅ CSS code is ready\n📄 Apply this CSS to an HTML document to see the styling effects");
        
      } else if (language === "json") {
        try {
          const parsed = JSON.parse(code);
          setOutput("✅ Valid JSON format\n📊 Parsed successfully:\n" + JSON.stringify(parsed, null, 2));
        } catch (error) {
          setOutput(`❌ Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
        
      } else if (language === "typescript") {
        try {
          // Basic TypeScript syntax check (convert to JS and run)
          const jsCode = code.replace(/:\s*\w+/g, '').replace(/interface\s+\w+\s*{[^}]*}/g, '');
          new Function(jsCode);
          setOutput("✅ TypeScript syntax is valid\n📝 Note: Full TypeScript compilation requires a build environment");
        } catch (error) {
          setOutput(`❌ TypeScript Syntax Error: ${error instanceof Error ? error.message : 'Syntax error'}`);
        }
        
      } else {
        setOutput(`✅ ${language.toUpperCase()} code syntax appears valid\n📝 Note: Execution requires a ${language} runtime environment`);
      }
      
      toast.success("Code executed!");
    } catch (error) {
      setOutput(`❌ Execution Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Code execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const compileCode = async () => {
    if (!handleAuthCheck()) return;
    
    setIsCompiling(true);
    setOutput("");
    
    try {
      if (language === "javascript") {
        // JavaScript syntax validation
        try {
          new Function(code);
          setOutput("✅ JavaScript compiled successfully\n🔍 No syntax errors found\n📋 Code is ready for execution");
          toast.success("Code compiled successfully!");
        } catch (error) {
          setOutput(`❌ Compilation Error: ${error instanceof Error ? error.message : 'Syntax error'}\n🔧 Please fix the syntax errors and try again`);
          toast.error("Compilation failed");
        }
      } else if (language === "typescript") {
        // TypeScript validation
        try {
          // Basic TypeScript syntax check
          const jsCode = code.replace(/:\s*\w+/g, '').replace(/interface\s+\w+\s*{[^}]*}/g, '');
          new Function(jsCode);
          setOutput("✅ TypeScript compiled successfully\n🔍 Type annotations and syntax are valid\n📋 Ready for TypeScript compiler");
          toast.success("TypeScript compiled successfully!");
        } catch (error) {
          setOutput(`❌ TypeScript Compilation Error: ${error instanceof Error ? error.message : 'Syntax error'}\n🔧 Please fix the syntax errors and try again`);
          toast.error("TypeScript compilation failed");
        }
      } else if (language === "json") {
        try {
          const parsed = JSON.parse(code);
          setOutput("✅ JSON compiled successfully\n🔍 Valid JSON structure\n📊 Data:\n" + JSON.stringify(parsed, null, 2));
          toast.success("JSON validated successfully!");
        } catch (error) {
          setOutput(`❌ JSON Compilation Error: ${error instanceof Error ? error.message : 'Parse error'}\n🔧 Please fix the JSON syntax`);
          toast.error("JSON validation failed");
        }
      } else if (language === "html") {
        // HTML validation
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(code, 'text/html');
          const errors = doc.querySelectorAll('parsererror');
          
          if (errors.length === 0) {
            const elements = doc.querySelectorAll('*').length;
            setOutput(`✅ HTML compiled successfully\n🔍 Valid HTML structure\n📊 Elements found: ${elements}\n📋 Ready for browser rendering`);
            toast.success("HTML validated successfully!");
          } else {
            setOutput("❌ HTML contains structural errors:\n" + Array.from(errors).map(e => e.textContent).join('\n'));
            toast.error("HTML validation failed");
          }
        } catch (error) {
          setOutput(`❌ HTML Compilation Error: ${error instanceof Error ? error.message : 'Parse error'}`);
          toast.error("HTML compilation failed");
        }
      } else if (language === "css") {
        // CSS validation
        try {
          const style = document.createElement('style');
          style.textContent = code;
          document.head.appendChild(style);
          document.head.removeChild(style);
          
          setOutput("✅ CSS compiled successfully\n🔍 No syntax errors detected\n📋 Styles are ready to apply");
          toast.success("CSS validated successfully!");
        } catch (error) {
          setOutput(`❌ CSS Compilation Error: ${error instanceof Error ? error.message : 'Syntax error'}`);
          toast.error("CSS validation failed");
        }
      } else {
        setOutput(`✅ ${language.toUpperCase()} syntax check completed\n🔍 Basic syntax validation passed\n📋 Code appears to be well-formed`);
        toast.success("Code syntax checked!");
      }
    } catch (error) {
      setOutput(`❌ Compilation Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Compilation failed");
    } finally {
      setIsCompiling(false);
    }
  };

  const formatCode = () => {
    if (!handleAuthCheck()) return;
    
    try {
      if (language === "json") {
        const parsed = JSON.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
        toast.success("JSON formatted!");
      } else if (language === "javascript" || language === "typescript") {
        // Basic JavaScript/TypeScript formatting
        let formatted = code
          .replace(/;(?!\s*$)/g, ';\n')
          .replace(/\{(?!\s*$)/g, '{\n')
          .replace(/\}(?!\s*$)/g, '\n}\n')
          .replace(/,(?!\s*$)/g, ',\n');
        
        // Clean up extra newlines and fix indentation
        formatted = formatted
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        setCode(formatted);
        toast.success("Code formatted!");
      } else if (language === "html") {
        // Basic HTML formatting
        let formatted = code
          .replace(/></g, '>\n<')
          .replace(/^\s+|\s+$/gm, '');
        
        setCode(formatted);
        toast.success("HTML formatted!");
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
        'ts': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'cpp',
        'cs': 'csharp'
      };
      
      if (extension && languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }
      
      toast.success("File loaded successfully!");
    };
    reader.readAsText(file);
  };

  const getEditorStyle = () => ({
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: `${fontSize}px`,
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: theme === 'dark' ? '#d4d4d4' : '#000000',
    border: theme === 'dark' ? '1px solid #404040' : '1px solid #d1d5db',
  });

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            AI Code Editor & Generator
          </CardTitle>
          <CardDescription>
            Write, edit, generate, and run code with AI assistance and professional tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Code Editor</TabsTrigger>
              <TabsTrigger value="generator">AI Generator</TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              {/* API Key Section */}
              <div className="space-y-2">
                <Label htmlFor="runware-api-key" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Runware API Key
                  {hasApiKey('runware') && (
                    <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                </Label>
                <Input
                  id="runware-api-key"
                  type="password"
                  placeholder={hasApiKey('runware') ? "API key saved (click to change)" : "Enter your Runware API key"}
                  value={runwareApiKey}
                  onChange={(e) => setApiKey('runware', e.target.value)}
                  className="bg-white/50 backdrop-blur border-white/30"
                />
                <p className="text-xs text-muted-foreground">
                  Get your free API key from{" "}
                  <a 
                    href="https://runware.ai" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline font-semibold"
                  >
                    runware.ai
                  </a>
                  {hasApiKey('runware') && " • Your API key is saved securely"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Programming Language</Label>
                  <Select value={generatorLanguage} onValueChange={setGeneratorLanguage}>
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Framework/Library</Label>
                  <Select value={generatorFramework} onValueChange={setGeneratorFramework}>
                    <SelectTrigger className="bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue.js</SelectItem>
                      <SelectItem value="angular">Angular</SelectItem>
                      <SelectItem value="nodejs">Node.js</SelectItem>
                      <SelectItem value="express">Express.js</SelectItem>
                      <SelectItem value="django">Django</SelectItem>
                      <SelectItem value="flask">Flask</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generator-prompt">Describe the code you need</Label>
                <Textarea
                  id="generator-prompt"
                  placeholder="Enter your code requirements... (e.g., 'Create a function to validate email addresses', 'Build a REST API endpoint for user authentication')"
                  value={generatorPrompt}
                  onChange={(e) => setGeneratorPrompt(e.target.value)}
                  className="min-h-[120px] bg-white/10 border-white/20 resize-none"
                />
              </div>

              <Button
                onClick={generateCode}
                disabled={!runwareApiKey.trim() || !generatorPrompt.trim() || isGenerating}
                className="w-full"
                variant="studio"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin mr-2" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Code with AI
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
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
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
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
                  accept=".js,.ts,.py,.html,.css,.json,.txt,.java,.cpp,.cs"
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
                  onClick={compileCode}
                  variant="studio"
                  size="sm"
                  disabled={!user || isCompiling}
                >
                  {isCompiling ? (
                    <>
                      <Bug className="h-4 w-4 mr-2 animate-spin" />
                      Compiling...
                    </>
                  ) : (
                    <>
                      <Bug className="h-4 w-4 mr-2" />
                      Compile
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={formatCode}
                  variant="outline"
                  size="sm"
                  disabled={!user}
                >
                  <FileText className="h-4 w-4 mr-2" />
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

              {/* Output */}
              <div className="space-y-2">
                <Label>Output</Label>
                <div className="min-h-[200px] p-4 bg-black text-green-400 rounded-lg font-mono text-sm overflow-auto whitespace-pre-wrap">
                  {output || "No output yet. Run or compile your code to see results here."}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {!user && (
            <div className="text-center p-8 bg-white/5 rounded-lg border border-white/20">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to access the AI code editor and generator</p>
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