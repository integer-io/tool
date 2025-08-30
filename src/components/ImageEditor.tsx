import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Loader2, Upload, Download, Scissors } from "lucide-react";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string | null;
}

interface ImageEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const ImageEditor = ({ user, onAuthRequired }: ImageEditorProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [editType, setEditType] = useState("background-removal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      toast.error("Please upload an image first");
      return;
    }

    if (!apiKey && editType !== "crop") {
      toast.error("Please enter your API key for AI processing");
      return;
    }

    setIsProcessing(true);

    try {
      if (editType === "crop") {
        // Simple crop simulation - in a real app, you'd implement canvas cropping
        setEditedImage(selectedImage);
        toast.success("Image cropped (demo mode)");
      } else if (editType === "background-removal") {
        // Use Remove.bg API or similar
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey,
          },
          body: (() => {
            const formData = new FormData();
            // Convert base64 to blob
            const byteCharacters = atob(selectedImage.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            formData.append('image_file', blob);
            return formData;
          })(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultBlob = await response.blob();
        const resultUrl = URL.createObjectURL(resultBlob);
        setEditedImage(resultUrl);
        toast.success("Background removed successfully!");
      } else {
        // Hugging Face image editing
        const response = await fetch(
          "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: `enhance and improve this image, ${editType}`,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resultBlob = await response.blob();
        const resultUrl = URL.createObjectURL(resultBlob);
        setEditedImage(resultUrl);
        toast.success("Image processed successfully!");
      }
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast.error(error.message || "Failed to process image. Please check your API key and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!editedImage) return;
    
    const a = document.createElement('a');
    a.href = editedImage;
    a.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            AI Image Editor
          </CardTitle>
          <CardDescription>
            Edit and enhance your images with AI-powered tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (Remove.bg or Hugging Face)</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key (not needed for crop)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-white/10 border-white/20"
            />
          </div>

          {/* Edit Type */}
          <div className="space-y-2">
            <Label>Edit Type</Label>
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="background-removal">Remove Background</SelectItem>
                <SelectItem value="crop">Crop Image</SelectItem>
                <SelectItem value="enhance">Enhance Quality</SelectItem>
                <SelectItem value="artistic">Artistic Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Image</Label>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="bg-white/10 border-white/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Image</Label>
                  <div className="border border-white/20 rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
                
                {editedImage && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Edited Image</Label>
                      <Button onClick={downloadImage} variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="border border-white/20 rounded-lg overflow-hidden">
                      <img 
                        src={editedImage} 
                        alt="Edited" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Process Button */}
              <Button
                onClick={processImage}
                disabled={isProcessing || (!apiKey && editType !== "crop")}
                className="w-full"
                variant="studio"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4 mr-2" />
                    Apply {editType.charAt(0).toUpperCase() + editType.slice(1).replace('-', ' ')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};