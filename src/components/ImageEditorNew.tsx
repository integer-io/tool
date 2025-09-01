import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Download, Upload, RotateCw, Crop, Palette, Sliders, Eraser, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const ImageEditor = ({ user, onAuthRequired }: ImageEditorProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [blur, setBlur] = useState([0]);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleAuthCheck = () => {
    if (!user) {
      onAuthRequired();
      return false;
    }
    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleAuthCheck()) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setOriginalImage(imageUrl);
      resetFilters();
      toast.success('Image loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const resetFilters = () => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setBlur([0]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const applyFilters = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Save context state
            ctx.save();

            // Apply transformations
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // Apply filters
            ctx.filter = `
              brightness(${brightness[0]}%) 
              contrast(${contrast[0]}%) 
              saturate(${saturation[0]}%) 
              blur(${blur[0]}px)
            `;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Restore context state
            ctx.restore();
            
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = originalImage || selectedImage;
      });
      
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, originalImage, brightness, contrast, saturation, blur, rotation, flipH, flipV]);

  // Apply filters whenever values change
  useEffect(() => {
    if (selectedImage && originalImage) {
      const timeoutId = setTimeout(() => {
        applyFilters();
      }, 100); // Debounce to prevent too many updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedImage, originalImage, applyFilters]);

  const downloadImage = () => {
    if (!handleAuthCheck() || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      
      // Create a temporary canvas to ensure proper image format
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Could not create temporary canvas');
      }
      
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      // Fill with white background
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the edited image
      tempCtx.drawImage(canvas, 0, 0);
      
      // Convert to blob and download
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Image downloaded successfully!');
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const rotateImage = (degrees: number) => {
    if (!handleAuthCheck()) return;
    setRotation(prev => (prev + degrees) % 360);
  };

  const flipImage = (direction: 'horizontal' | 'vertical') => {
    if (!handleAuthCheck()) return;
    if (direction === 'horizontal') {
      setFlipH(prev => !prev);
    } else {
      setFlipV(prev => !prev);
    }
  };

  const resetImage = () => {
    if (!handleAuthCheck()) return;
    resetFilters();
    toast.success('Image reset to original');
  };

  const cropToSquare = () => {
    if (!handleAuthCheck() || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const size = Math.min(canvas.width, canvas.height);
      const x = (canvas.width - size) / 2;
      const y = (canvas.height - size) / 2;

      // Get the cropped image data
      const imageData = ctx.getImageData(x, y, size, size);
      
      // Resize canvas to square
      canvas.width = size;
      canvas.height = size;
      
      // Clear and draw cropped image
      ctx.clearRect(0, 0, size, size);
      ctx.putImageData(imageData, 0, 0);

      toast.success('Image cropped to square');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to crop image');
    }
  };

  const addGrayscale = () => {
    if (!handleAuthCheck() || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // Red
        data[i + 1] = gray; // Green
        data[i + 2] = gray; // Blue
      }

      ctx.putImageData(imageData, 0, 0);
      toast.success('Grayscale filter applied');
    } catch (error) {
      console.error('Grayscale error:', error);
      toast.error('Failed to apply grayscale filter');
    }
  };

  const addSepia = () => {
    if (!handleAuthCheck() || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // Red
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
      }

      ctx.putImageData(imageData, 0, 0);
      toast.success('Sepia filter applied');
    } catch (error) {
      console.error('Sepia error:', error);
      toast.error('Failed to apply sepia filter');
    }
  };

  const invertColors = () => {
    if (!handleAuthCheck() || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];         // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
      }

      ctx.putImageData(imageData, 0, 0);
      toast.success('Colors inverted');
    } catch (error) {
      console.error('Invert error:', error);
      toast.error('Failed to invert colors');
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Professional Image Editor (No API Required)
          </CardTitle>
          <CardDescription>
            Edit images with filters, transformations, and effects - works completely offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Upload Image</Label>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={!user}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {!user && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Please sign in to use the image editor. All editing is done locally on your device.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {selectedImage && user && (
            <>
              {/* Processing Indicator */}
              {isProcessing && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Processing image... Please wait.
                  </AlertDescription>
                </Alert>
              )}

              {/* Image Preview and Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Original</Label>
                  <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                    <img
                      ref={imageRef}
                      src={originalImage || selectedImage}
                      alt="Original"
                      className="w-full h-64 object-contain rounded"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Edited</Label>
                  <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-64 object-contain rounded border"
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto',
                        backgroundColor: '#f8f9fa'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Editing Tools */}
              <Tabs defaultValue="filters" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="filters">Filters</TabsTrigger>
                  <TabsTrigger value="transform">Transform</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="crop">Crop</TabsTrigger>
                </TabsList>

                <TabsContent value="filters" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Brightness: {brightness[0]}%</Label>
                        <Slider
                          value={brightness}
                          onValueChange={setBrightness}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!user || isProcessing}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Contrast: {contrast[0]}%</Label>
                        <Slider
                          value={contrast}
                          onValueChange={setContrast}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!user || isProcessing}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Saturation: {saturation[0]}%</Label>
                        <Slider
                          value={saturation}
                          onValueChange={setSaturation}
                          max={200}
                          min={0}
                          step={1}
                          disabled={!user || isProcessing}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Blur: {blur[0]}px</Label>
                        <Slider
                          value={blur}
                          onValueChange={setBlur}
                          max={10}
                          min={0}
                          step={0.1}
                          disabled={!user || isProcessing}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transform" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      onClick={() => rotateImage(90)}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate 90°
                    </Button>
                    
                    <Button
                      onClick={() => rotateImage(-90)}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <RotateCw className="h-4 w-4 mr-2 scale-x-[-1]" />
                      Rotate -90°
                    </Button>
                    
                    <Button
                      onClick={() => flipImage('horizontal')}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      Flip H
                    </Button>
                    
                    <Button
                      onClick={() => flipImage('vertical')}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      Flip V
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Rotation: {rotation}°</Label>
                    <Slider
                      value={[rotation]}
                      onValueChange={(value) => setRotation(value[0])}
                      max={360}
                      min={-360}
                      step={1}
                      disabled={!user || isProcessing}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="effects" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      onClick={addGrayscale}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Grayscale
                    </Button>
                    
                    <Button
                      onClick={addSepia}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Sepia
                    </Button>
                    
                    <Button
                      onClick={invertColors}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Invert
                    </Button>
                    
                    <Button
                      onClick={resetImage}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <Eraser className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="crop" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button
                      onClick={cropToSquare}
                      variant="outline"
                      disabled={!user || isProcessing}
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Crop Square
                    </Button>
                  </div>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      More crop options coming soon! Currently supports square cropping.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={downloadImage}
                  variant="studio"
                  size="lg"
                  disabled={!user || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Edited Image
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetImage}
                  variant="outline"
                  size="lg"
                  disabled={!user || isProcessing}
                >
                  Reset All
                </Button>
              </div>
            </>
          )}

          {!selectedImage && user && (
            <div className="text-center p-12 border-2 border-dashed border-white/20 rounded-lg">
              <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">No image selected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image to start editing with professional tools
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="default"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </div>
          )}

          {!user && (
            <div className="text-center p-8 bg-white/5 rounded-lg border border-white/20">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to access the professional image editor</p>
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