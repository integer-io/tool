import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Loader2, Download, Play, Pause } from "lucide-react";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string | null;
}

interface MusicGeneratorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const MusicGenerator = ({ user, onAuthRequired }: MusicGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("30");
  const [genre, setGenre] = useState("electronic");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const generateMusic = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the music you want to generate");
      return;
    }

    if (!apiKey) {
      toast.error("Please enter your Hugging Face API key");
      return;
    }

    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      const fullPrompt = `${genre} music, ${duration} seconds, ${prompt}`;
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/musicgen-small",
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              duration: parseInt(duration),
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);
      toast.success("Music generated successfully!");

    } catch (error: any) {
      console.error("Error generating music:", error);
      toast.error(error.message || "Failed to generate music. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playPauseAudio = () => {
    if (!generatedAudio) return;

    if (!audioElement) {
      const audio = new Audio(generatedAudio);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;
    
    const a = document.createElement('a');
    a.href = generatedAudio;
    a.download = `generated-music-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Music downloaded!");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            AI Music Generator
          </CardTitle>
          <CardDescription>
            Generate unique music tracks using AI based on your description
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
            {/* Genre */}
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your music</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the music you want... (e.g., 'upbeat energetic track with drums', 'calm peaceful melody with piano')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-white/10 border-white/20 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateMusic}
            disabled={!prompt.trim() || !apiKey || isGenerating}
            className="w-full"
            variant="studio"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Music...
              </>
            ) : (
              <>
                <Music className="h-4 w-4 mr-2" />
                Generate Music
              </>
            )}
          </Button>

          {/* Generated Audio Player */}
          {generatedAudio && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Generated Music</Label>
                <div className="flex gap-2">
                  <Button onClick={playPauseAudio} variant="ghost" size="sm">
                    {isPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button onClick={downloadAudio} variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-black/20 border border-white/20 rounded-lg">
                <audio 
                  src={generatedAudio} 
                  controls 
                  className="w-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};