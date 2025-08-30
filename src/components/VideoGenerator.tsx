import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, Download, Upload, X, Play, Lock, History } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GeneratedVideo {
  videoURL: string;
  prompt: string;
  taskId: string;
  timestamp: Date;
}

interface VideoHistory {
  id: string;
  prompt: string;
  videoURL: string;
  timestamp: Date;
  userId: string;
}

interface VideoGeneratorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const VideoGenerator = ({ user, onAuthRequired }: VideoGeneratorProps) => {
  const [prompt, setPrompt] = useState("Two people laying on a beach, romantic sunset, cinematic");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<VideoHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    if (uploadedImages.length + imageFiles.length > 1) {
      toast.error("Maximum 1 image allowed for video generation");
      return;
    }

    setUploadedImages(prev => [...prev, ...imageFiles]);
    toast.success(`${imageFiles.length} image(s) uploaded`);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const saveToHistory = async (videoData: GeneratedVideo) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "videoHistory"), {
        userId: user.uid,
        prompt: videoData.prompt,
        videoURL: videoData.videoURL,
        timestamp: videoData.timestamp,
        taskId: videoData.taskId
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
        collection(db, "videoHistory"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const historyData: VideoHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          prompt: data.prompt,
          videoURL: data.videoURL,
          timestamp: data.timestamp.toDate(),
          userId: data.userId
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

  const generateVideo = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter your Runware API key");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Using Runware API for video generation
      const taskUUID = crypto.randomUUID();
      
      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            taskType: "authentication",
            apiKey: apiKey
          },
          {
            taskType: "videoInference",
            taskUUID: taskUUID,
            positivePrompt: prompt,
            width: 512,
            height: 512,
            duration: 3,
            fps: 8,
            model: "runware:100@1"
          }
        ])
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate video";
        
        if (response.status === 401 || response.status === 403) {
          errorMessage = "Invalid API key. Please check your Runware API key";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait before trying again";
        } else {
          try {
            const errorData = await response.json();
            if (errorData.error || errorData.errors) {
              errorMessage = errorData.error || errorData.errors[0]?.message || errorMessage;
            }
          } catch {
            // Use default error message
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.error || result.errors) {
        throw new Error(result.error || result.errors[0]?.message || "Failed to generate video");
      }

      if (!result.data || result.data.length === 0) {
        throw new Error("No video data received from API");
      }

      // Find the video inference result
      const videoResult = result.data.find((item: any) => item.taskType === "videoInference");
      
      if (!videoResult || !videoResult.videoURL) {
        throw new Error("Video generation failed - no video URL received");
      }

      const timestamp = new Date();
      
      const videoData: GeneratedVideo = {
        videoURL: videoResult.videoURL,
        prompt: prompt,
        taskId: videoResult.taskUUID || Date.now().toString(),
        timestamp
      };
      
      setGeneratedVideo(videoData);
      
      // Save to history
      await saveToHistory(videoData);
      
      toast.success("Video generated successfully!");
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = async () => {
    if (!generatedVideo) return;
    
    try {
      const response = await fetch(generatedVideo.videoURL);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${generatedVideo.taskId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Video downloaded!");
    } catch (error) {
      toast.error("Failed to download video");
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
              <Video className="h-5 w-5 text-primary" />
              Video Generator
            </CardTitle>
            <CardDescription>
              Create AI-generated videos from your images and prompts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video-api-key">Runware API Key</Label>
              <Input
                id="video-api-key"
                type="password"
                placeholder="Enter your API key from runware.ai"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/50 backdrop-blur border-white/30"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a href="https://runware.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  runware.ai
                </a>{" "}
                (Free tier available!)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Video Style (Optional)</Label>
              <select 
                className="w-full p-2 bg-white/50 backdrop-blur border border-white/30 rounded-md"
                onChange={(e) => setPrompt(prev => e.target.value ? `${prev} in ${e.target.value} style` : prev)}
              >
                <option value="">Choose a style...</option>
                <option value="cinematic">Cinematic</option>
                <option value="anime">Anime</option>
                <option value="realistic">Realistic</option>
                <option value="cartoon">Cartoon</option>
                <option value="vintage">Vintage</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-prompt">Video Description</Label>
              <Textarea
                id="video-prompt"
                placeholder="Describe the video you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white/50 backdrop-blur border-white/30 min-h-[100px]"
              />
            </div>

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !apiKey.trim() || !prompt.trim()}
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
                  <Video className="h-4 w-4 animate-pulse" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Generate Video
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
            <CardTitle>Generated Video</CardTitle>
            <CardDescription>
              Your AI-generated video will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedVideo ? (
              <div className="space-y-4">
                <div className="relative group">
                  <video
                    src={generatedVideo.videoURL}
                    controls
                    className="w-full rounded-lg shadow-glow"
                    poster=""
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300 pointer-events-none" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Prompt:</strong> {generatedVideo.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated: {generatedVideo.timestamp.toLocaleString()}
                  </p>
                </div>

                <Button
                  onClick={downloadVideo}
                  variant="glass"
                  size="lg"
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Download Video
                </Button>
              </div>
            ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted rounded-lg">
                <div className="text-center">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No video generated yet</p>
                  <p className="text-sm text-muted-foreground">Enter a description and your API key to start</p>
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
              Video Generation History
            </CardTitle>
            <CardDescription>
              Your previously generated videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No videos generated yet</p>
                <p className="text-sm text-muted-foreground">Start generating videos to see your history here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="border border-white/20 rounded-lg p-4 space-y-3">
                    <video
                      src={item.videoURL}
                      controls
                      className="w-full h-32 object-cover rounded"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = item.videoURL;
                        a.download = `video-${item.timestamp.getTime()}.mp4`;
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