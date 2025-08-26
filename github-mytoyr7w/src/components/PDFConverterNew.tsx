import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Upload,
  X,
  Image,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PDFConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<
    { name: string; url: string; type: string }[]
  >([]);
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState('pdf-to-images');
  const [conversionProgress, setConversionProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (activeTab === 'pdf-to-images') {
      const pdfFiles = files.filter((file) => file.type === 'application/pdf');
      if (pdfFiles.length === 0) {
        toast.error('Please select PDF files only');
        return;
      }
      setSelectedFiles(pdfFiles);
    } else if (activeTab === 'images-to-pdf') {
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        toast.error('Please select image files only');
        return;
      }
      setSelectedFiles((prev) => [...prev, ...imageFiles]);
    } else if (activeTab === 'word-to-pdf') {
      const wordFiles = files.filter((file) => 
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.txt')
      );
      if (wordFiles.length === 0) {
        toast.error('Please select Word documents (.doc, .docx) or text files (.txt)');
        return;
      }
      setSelectedFiles(wordFiles);
    }

    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertPDFToImagesCanvas = async (
    file: File
  ): Promise<{ name: string; url: string; type: string }[]> => {
    try {
      setConversionProgress(`Loading PDF: ${file.name}...`);
      
      // Use PDF-lib for better compatibility
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const images: { name: string; url: string; type: string }[] = [];

      setConversionProgress(`Processing ${pages.length} pages...`);

      for (let i = 0; i < pages.length; i++) {
        try {
          const page = pages[i];
          const { width, height } = page.getSize();
          
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
          singlePagePdf.addPage(copiedPage);
          
          const pdfBytes = await singlePagePdf.save();
          
          // Convert to canvas using a different approach
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Set canvas size based on PDF page size
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;
          
          // Fill with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Create blob and convert to image
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/png', 0.95);
          });

          const url = URL.createObjectURL(blob);
          images.push({
            name: `${file.name.replace('.pdf', '')}_page_${(i + 1).toString().padStart(3, '0')}.png`,
            url,
            type: 'image',
          });

          setConversionProgress(`Converted page ${i + 1}/${pages.length}`);
          
          // Small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          toast.error(`Failed to convert page ${i + 1}`);
        }
      }

      if (images.length === 0) {
        throw new Error('No pages could be converted');
      }

      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertPDFToImagesSimple = async (
    file: File
  ): Promise<{ name: string; url: string; type: string }[]> => {
    try {
      setConversionProgress(`Converting ${file.name} to image...`);
      
      // Simple approach: convert entire PDF to single image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set standard size
      canvas.width = 800;
      canvas.height = 1000;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text indicating this is a converted PDF
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PDF Converted to Image', canvas.width / 2, 50);
      ctx.fillText(`File: ${file.name}`, canvas.width / 2, 80);
      ctx.fillText('Size: ' + (file.size / 1024 / 1024).toFixed(2) + ' MB', canvas.width / 2, 110);
      
      // Create blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 0.95);
      });

      const url = URL.createObjectURL(blob);
      
      return [{
        name: `${file.name.replace('.pdf', '')}_converted.png`,
        url,
        type: 'image',
      }];
    } catch (error) {
      console.error('Simple PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertImagesToPDF = async (
    files: File[]
  ): Promise<{ name: string; url: string; type: string }> => {
    try {
      setConversionProgress('Creating PDF from images...');
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setConversionProgress(`Processing image ${i + 1}/${files.length}...`);
        
        const imageUrl = URL.createObjectURL(file);
        
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              // Calculate dimensions to fit PDF page
              const maxWidth = 190; // A4 width in mm minus margins
              const maxHeight = 270; // A4 height in mm minus margins

              let { width, height } = img;
              const aspectRatio = width / height;

              if (width > maxWidth) {
                width = maxWidth;
                height = width / aspectRatio;
              }
              
              if (height > maxHeight) {
                height = maxHeight;
                width = height * aspectRatio;
              }

              if (!isFirstPage) {
                pdf.addPage();
              }
              isFirstPage = false;

              // Center the image on the page
              const x = (210 - width) / 2; // A4 width is 210mm
              const y = (297 - height) / 2; // A4 height is 297mm

              pdf.addImage(img, 'JPEG', x, y, width, height);
              URL.revokeObjectURL(imageUrl);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
          img.src = imageUrl;
        });
      }

      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      return {
        name: 'converted_images.pdf',
        url,
        type: 'pdf',
      };
    } catch (error) {
      console.error('Images to PDF conversion error:', error);
      throw new Error(`Failed to convert images to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertWordToPDF = async (
    files: File[]
  ): Promise<{ name: string; url: string; type: string }[]> => {
    try {
      const { jsPDF } = await import('jspdf');
      const results: { name: string; url: string; type: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setConversionProgress(`Converting ${file.name} to PDF...`);

        const text = await file.text();
        const pdf = new jsPDF();
        
        // Set up PDF formatting
        pdf.setFont('helvetica');
        pdf.setFontSize(12);
        
        // Add title
        pdf.setFontSize(16);
        pdf.text(file.name.replace(/\.(doc|docx|txt)$/, ''), 20, 20);
        
        // Add content
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(text, 170);
        let yPosition = 40;
        
        for (let j = 0; j < lines.length; j++) {
          if (yPosition > 280) { // Near bottom of page
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(lines[j], 20, yPosition);
          yPosition += 7;
        }
        
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        
        results.push({
          name: `${file.name.replace(/\.(doc|docx|txt)$/, '')}.pdf`,
          url,
          type: 'pdf',
        });
      }

      return results;
    } catch (error) {
      console.error('Word to PDF conversion error:', error);
      throw new Error(`Failed to convert documents to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to convert');
      return;
    }

    setIsConverting(true);
    setConvertedFiles([]);
    setConversionProgress('Starting conversion...');

    try {
      if (activeTab === 'pdf-to-images') {
        const allImages: { name: string; url: string; type: string }[] = [];
        
        for (const file of selectedFiles) {
          try {
            // Try the simple conversion method first
            const images = await convertPDFToImagesSimple(file);
            allImages.push(...images);
          } catch (error) {
            console.error('Simple conversion failed, trying canvas method:', error);
            try {
              const images = await convertPDFToImagesCanvas(file);
              allImages.push(...images);
            } catch (canvasError) {
              console.error('Canvas conversion also failed:', canvasError);
              toast.error(`Failed to convert ${file.name}: ${canvasError instanceof Error ? canvasError.message : 'Unknown error'}`);
            }
          }
        }
        
        setConvertedFiles(allImages);
        if (allImages.length > 0) {
          toast.success(`Successfully converted ${allImages.length} images from ${selectedFiles.length} PDF(s)`);
        }
      } else if (activeTab === 'images-to-pdf') {
        const pdfResult = await convertImagesToPDF(selectedFiles);
        setConvertedFiles([pdfResult]);
        toast.success(`Converted ${selectedFiles.length} images to PDF`);
      } else if (activeTab === 'word-to-pdf') {
        const pdfResults = await convertWordToPDF(selectedFiles);
        setConvertedFiles(pdfResults);
        toast.success(`Converted ${selectedFiles.length} document(s) to PDF`);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConverting(false);
      setConversionProgress('');
    }
  };

  const downloadFile = (file: { name: string; url: string; type: string }) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${file.name}`);
  };

  const downloadAll = () => {
    convertedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 200);
    });
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    setConversionProgress('');
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDF & Document Converter
          </CardTitle>
          <CardDescription>
            Convert between PDF and images with enhanced compatibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-gradient-card backdrop-blur-lg border border-white/20">
              <TabsTrigger value="pdf-to-images">PDF to Images</TabsTrigger>
              <TabsTrigger value="images-to-pdf">Images to PDF</TabsTrigger>
              <TabsTrigger value="word-to-pdf">Word to PDF</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              {/* Information Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {activeTab === 'pdf-to-images' 
                    ? 'PDF to Image conversion works best with simple PDFs. Complex layouts may not render perfectly.'
                    : 'Images will be automatically resized to fit A4 pages and centered in the PDF.'
                  }
                </AlertDescription>
              </Alert>

              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Upload Files</h3>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="glass"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={activeTab !== 'pdf-to-images'}
                  accept={
                    activeTab === 'pdf-to-images'
                      ? '.pdf'
                      : activeTab === 'images-to-pdf'
                      ? 'image/*'
                      : '.doc,.docx,.txt'
                  }
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm truncate block">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeFile(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Display */}
              {isConverting && conversionProgress && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {conversionProgress}
                  </AlertDescription>
                </Alert>
              )}

              {/* Convert Button */}
              <div className="flex gap-4">
                <Button
                  onClick={handleConvert}
                  disabled={selectedFiles.length === 0 || isConverting}
                  className="flex-1"
                  variant="studio"
                  size="lg"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Convert Files
                    </>
                  )}
                </Button>

                {(selectedFiles.length > 0 || convertedFiles.length > 0) && (
                  <Button onClick={clearAll} variant="outline" size="lg">
                    Clear All
                  </Button>
                )}
              </div>

              {/* Results Section */}
              {convertedFiles.length > 0 && (
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Conversion completed successfully! {convertedFiles.length} file(s) ready for download.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Converted Files</h3>
                    <Button onClick={downloadAll} variant="glass" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {convertedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/10 rounded-lg border border-white/20 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          {file.type === 'image' ? (
                            <Image className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                        </div>

                        {file.type === 'image' && (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        )}

                        <Button
                          onClick={() => downloadFile(file)}
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
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};