import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string | null;
}

interface CodeGeneratorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const CodeGenerator = ({ user, onAuthRequired }: CodeGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("none");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const generateCode = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what code you need");
      return;
    }

    if (!apiKey) {
      toast.error("Please enter your Hugging Face API key");
      return;
    }

    setIsGenerating(true);
    setGeneratedCode("");

    try {
      const systemPrompt = `You are a professional software developer. Generate clean, well-documented ${language} code${framework !== 'none' ? ` using ${framework}` : ''}. 
      Include comments explaining key parts. Follow best practices and modern conventions.`;
      
      const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}\n\nPlease provide only the code with appropriate comments:`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/bigcode/starcoder2-15b",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_length: 1000,
              temperature: 0.3,
              do_sample: true,
              return_full_text: false,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const code = result[0]?.generated_text || "// No code generated. Please try again with a more specific prompt.";
      setGeneratedCode(code.trim());
      toast.success("Code generated successfully!");

    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error(error.message || "Failed to generate code. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            AI Code Generator
          </CardTitle>
          <CardDescription>
            Generate clean, well-documented code in any programming language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Hugging Face API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Hugging Face API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-white/10 border-white/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Programming Language */}
            <div className="space-y-2">
              <Label>Programming Language</Label>
              <Select value={language} onValueChange={setLanguage}>
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
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="rust">Rust</SelectItem>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Framework */}
            <div className="space-y-2">
              <Label>Framework/Library</Label>
              <Select value={framework} onValueChange={setFramework}>
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
                  <SelectItem value="spring">Spring Boot</SelectItem>
                  <SelectItem value="laravel">Laravel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe the code you need</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your code requirements... (e.g., 'Create a function to validate email addresses', 'Build a REST API endpoint for user authentication')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-white/10 border-white/20 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateCode}
            disabled={!prompt.trim() || !apiKey || isGenerating}
            className="w-full"
            variant="studio"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                Generate Code
              </>
            )}
          </Button>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Generated Code</Label>
                <Button onClick={copyToClipboard} variant="ghost" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              
              <div className="relative">
                <pre className="p-4 bg-black/20 border border-white/20 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono whitespace-pre">{generatedCode}</code>
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};