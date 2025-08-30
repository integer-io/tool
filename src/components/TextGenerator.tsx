import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string | null;
}

interface TextGeneratorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const TextGenerator = ({ user, onAuthRequired }: TextGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [textType, setTextType] = useState("article");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const generateText = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!apiKey) {
      toast.error("Please enter your Hugging Face API key");
      return;
    }

    setIsGenerating(true);
    setGeneratedText("");

    try {
      const systemPrompt = `You are a professional ${textType} writer. Write in a ${tone} tone. 
      Length should be ${length === 'short' ? '100-200 words' : length === 'medium' ? '300-500 words' : '600-1000 words'}.`;
      
      const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_length: length === 'short' ? 200 : length === 'medium' ? 500 : 1000,
              temperature: 0.7,
              do_sample: true,
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

      const text = result[0]?.generated_text || "No text generated. Please try again.";
      setGeneratedText(text.replace(fullPrompt, "").trim());
      toast.success("Text generated successfully!");

    } catch (error: any) {
      console.error("Error generating text:", error);
      toast.error(error.message || "Failed to generate text. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success("Text copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Text Generator
          </CardTitle>
          <CardDescription>
            Generate professional content for articles, blogs, social media, and more
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Text Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={textType} onValueChange={setTextType}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="story">Creative Story</SelectItem>
                  <SelectItem value="description">Product Description</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (100-200 words)</SelectItem>
                  <SelectItem value="medium">Medium (300-500 words)</SelectItem>
                  <SelectItem value="long">Long (600-1000 words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">What would you like me to write about?</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your topic or request... (e.g., 'Write an article about sustainable technology')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-white/10 border-white/20 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateText}
            disabled={!prompt.trim() || !apiKey || isGenerating}
            className="w-full"
            variant="studio"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Text...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Text
              </>
            )}
          </Button>

          {/* Generated Text Display */}
          {generatedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Generated Text</Label>
                <Button onClick={copyToClipboard} variant="ghost" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
                <p className="whitespace-pre-wrap leading-relaxed">{generatedText}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};