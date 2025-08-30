import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Download, Wand2, Lock, History, Key } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useApiKeys } from "@/hooks/useApiKeys";

interface GeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
  timestamp: Date;
}

interface ImageHistory {
  id: string;
  prompt: string;
  imageURL: string;
  timestamp: Date;
  userId: string;
  seed: number;
}

interface FaceGeneratorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const FaceGenerator = ({ user, onAuthRequired }: FaceGeneratorProps) => {
  const [prompt, setPrompt] = useState("A professional headshot of a person with kind eyes and a warm smile");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ImageHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { getApiKey, setApiKey, hasApiKey } = useApiKeys();

  const apiKey = getApiKey('runware');

  const saveToHistory = async (imageData: GeneratedImage) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "imageHistory"), {
        userId: user.uid,
        prompt: imageData.positivePrompt,
        imageURL: imageData.imageURL,
        timestamp: imageData.timestamp,
        seed: imageData.seed
      });
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "imageHistory"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const historyData: ImageHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          prompt: data.prompt,
          imageURL: data.imageURL,
          timestamp: data.timestamp.toDate(),
          userId: data.userId,
          seed: data.seed
        });
      });
      
      setHistory(historyData);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const generateFace = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your Runware API key");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a description for the face");
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('https://api.runware.ai/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            taskType: "authentication",
            apiKey: apiKey
          },
          {
            taskType: "imageInference",
            taskUUID: crypto.randomUUID(),
            positivePrompt: prompt,
            width: 512,
            height: 512,
            model: "runware:100@1",
            numberResults: 1,
            outputFormat: "WEBP",
            CFGScale: 1,
            scheduler: "FlowMatchEulerDiscreteScheduler"
          }
        ])
      });

      const data = await response.json();
      
      if (data.error || data.errors) {
        throw new Error(data.errorMessage || data.errors?.[0]?.message || "Generation failed");
      }

      const imageResult = data.data?.find((item: any) => item.taskType === "imageInference");
      
      if (imageResult && imageResult.imageURL) {
        const timestamp = new Date();
        const imageData: GeneratedImage = {
          ...imageResult,
          timestamp
        };
        
        setGeneratedImage(imageData);
        
        // Save to history
        await saveToHistory(imageData);
        
        toast.success("Face generated successfully!");
      } else {
        throw new Error("No image was generated");
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate face");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage.imageURL);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `face-${generatedImage.seed}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Panel */}
        <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Face Generator
            </CardTitle>
            <CardDescription>
              Create AI-generated faces with custom descriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Runware API Key
                {hasApiKey('runware') && (
                  <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full">
                    Saved
                  </span>
                )}
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder={hasApiKey('runware') ? "API key saved (click to change)" : "Enter your API key from runware.ai"}
                value={apiKey}
                onChange={(e) => setApiKey('runware', e.target.value)}
                className="bg-white/50 backdrop-blur border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a href="https://runware.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  runware.ai
                </a>
                {hasApiKey('runware') && " • Your API key is saved securely in your browser"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Face Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the face you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white/50 backdrop-blur border-white/30 min-h-[100px]"
              />
            </div>

            <Button
              onClick={generateFace}
              disabled={isGenerating || !apiKey.trim()}
              className="w-full"
              variant="studio"
              size="lg"
            >
              {!user ? (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In Required
                </>
              ) : isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Face
                </>
              )}
            </Button>

            {user && (
              <Button
                onClick={toggleHistory}
                variant="glass"
                className="w-full"
                disabled={loadingHistory}
              >
                <History className="h-4 w-4 mr-2" />
                {loadingHistory ? "Loading..." : showHistory ? "Hide History" : "Show History"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
          <CardHeader>
            <CardTitle>Generated Face</CardTitle>
            <CardDescription>
              Your AI-generated face will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={generatedImage.imageURL}
                    alt="Generated face"
                    className="w-full rounded-lg shadow-glow transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Prompt:</strong> {generatedImage.positivePrompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seed: {generatedImage.seed} | Generated: {generatedImage.timestamp.toLocaleString()}
                  </p>
                </div>

                <Button
                  onClick={downloadImage}
                  variant="glass"
                  size="lg"
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No face generated yet</p>
                  <p className="text-sm text-muted-foreground">Enter your API key and description to start</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      {showHistory && user && (
        <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Image Generation History
            </CardTitle>
            <CardDescription>
              Your previously generated images
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images generated yet</p>
                <p className="text-sm text-muted-foreground">Start generating images to see your history here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="border border-white/20 rounded-lg p-4 space-y-3">
                    <img
                      src={item.imageURL}
                      alt="Generated image"
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        Seed: {item.seed}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = item.imageURL;
                        a.download = `face-${item.seed}.webp`;
                        a.click();
                      }}
                      variant="glass"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};