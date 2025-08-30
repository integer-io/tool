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
  FileImage,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker with multiple fallbacks
const setupPDFWorker = () => {
  try {
    // Try using the bundled version first
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } catch (error) {
    try {
      // Fallback to CDN with current version
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } catch (error2) {
      // Final fallback to a known working version
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }
};

setupPDFWorker();

export const PDFConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<
    { name: string; url: string; type: string }[]
  >([]);
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState('pdf-to-images');
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
    } else {
      // Word to PDF - accept doc, docx files
      const wordFiles = files.filter(
        (file) =>
          file.type === 'application/msword' ||
          file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      if (wordFiles.length === 0) {
        toast.error('Please select Word documents (.doc, .docx)');
        return;
      }
      setSelectedFiles(wordFiles);
    }

    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertPDFToImages = async (
    file: File
  ): Promise<{ name: string; url: string; type: string }[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      const images: { name: string; url: string; type: string }[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Could not get canvas context');
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          const renderTask = page.render(renderContext);
          await renderTask.promise;

          // Convert canvas to blob with better quality
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/png', 0.95);
          });

          const url = URL.createObjectURL(blob);
          images.push({
            name: `${file.name.replace('.pdf', '')}_page_${pageNum.toString().padStart(3, '0')}.png`,
            url,
            type: 'image',
          });

          // Clean up page resources
          page.cleanup();
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          toast.error(`Failed to convert page ${pageNum} of ${file.name}`);
        }
      }

      // Clean up PDF document
      pdf.destroy();
      
      if (images.length === 0) {
        throw new Error('No pages could be converted');
      }

      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertImagesToPDF = async (
    files: File[]
  ): Promise<{ name: string; url: string; type: string }> => {
    // This is a simplified version - in a real app, you'd use a library like jsPDF
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = URL.createObjectURL(file);

      return new Promise((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Calculate dimensions to fit PDF page
          const maxWidth = 190; // A4 width in mm minus margins
          const maxHeight = 270; // A4 height in mm minus margins

          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 10, 10, width, height);

          URL.revokeObjectURL(imageUrl);

          if (i === files.length - 1) {
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            resolve({
              name: 'converted_images.pdf',
              url,
              type: 'pdf',
            });
          }
        };
        img.src = imageUrl;
      });
    }

    // Fallback return (shouldn't reach here)
    return { name: 'converted.pdf', url: '', type: 'pdf' };
  };

  const convertWordToPDF = async (
    file: File
  ): Promise<{ name: string; url: string; type: string }> => {
    // This is a placeholder - Word to PDF conversion requires server-side processing
    // In a real application, you'd send this to a backend service
    toast.info(
      'Word to PDF conversion requires server-side processing. This is a demo placeholder.'
    );

    // Create a dummy PDF for demo purposes
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.text(`Converted from: ${file.name}`, 10, 10);
    pdf.text('This is a demo conversion.', 10, 30);
    pdf.text(
      'In a real application, this would be processed server-side.',
      10,
      50
    );

    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);

    return {
      name: file.name.replace(/\.(doc|docx)$/, '.pdf'),
      url,
      type: 'pdf',
    };
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to convert');
      return;
    }

    setIsConverting(true);
    setConvertedFiles([]);

    try {
      if (activeTab === 'pdf-to-images') {
        const allImages: { name: string; url: string; type: string }[] = [];
        for (const file of selectedFiles) {
          const images = await convertPDFToImages(file);
          allImages.push(...images);
        }
        setConvertedFiles(allImages);
        toast.success(
          `Converted ${selectedFiles.length} PDF(s) to ${allImages.length} images`
        );
      } else if (activeTab === 'images-to-pdf') {
        const pdfResult = await convertImagesToPDF(selectedFiles);
        setConvertedFiles([pdfResult]);
        toast.success(`Converted ${selectedFiles.length} images to PDF`);
      } else if (activeTab === 'word-to-pdf') {
        const results: { name: string; url: string; type: string }[] = [];
        for (const file of selectedFiles) {
          const result = await convertWordToPDF(file);
          results.push(result);
        }
        setConvertedFiles(results);
        toast.success(
          `Converted ${selectedFiles.length} Word document(s) to PDF`
        );
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
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
    convertedFiles.forEach((file) => {
      setTimeout(() => downloadFile(file), 100);
    });
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setConvertedFiles([]);
    convertedFiles.forEach((file) => URL.revokeObjectURL(file.url));
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
            Convert between PDF, images, and Word documents with ease
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
                      : '.doc,.docx'
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
                          <span className="text-sm truncate">{file.name}</span>
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
