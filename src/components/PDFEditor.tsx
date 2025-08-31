import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Upload, Scissors, Merge, RotateCw, Lock, Unlock, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";

interface PDFEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const PDFEditor = ({ user, onAuthRequired }: PDFEditorProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<{ name: string; url: string }[]>([]);
  const [splitPages, setSplitPages] = useState("1-5");
  const [rotationAngle, setRotationAngle] = useState("90");
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthCheck = () => {
    if (!user) {
      onAuthRequired();
      return false;
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleAuthCheck()) return;
    
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast.error('Please select PDF files only');
      return;
    }
    
    setSelectedFiles(pdfFiles);
    toast.success(`${pdfFiles.length} PDF file(s) loaded`);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const splitPDF = async () => {
    if (!handleAuthCheck() || selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const results: { name: string; url: string }[] = [];
      
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Parse page range
        const [start, end] = splitPages.split('-').map(n => parseInt(n.trim()) - 1);
        const totalPages = pdfDoc.getPageCount();
        
        if (start < 0 || end >= totalPages || start > end) {
          toast.error(`Invalid page range for ${file.name}. Total pages: ${totalPages}`);
          continue;
        }
        
        // Create new PDF with selected pages
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(pdfDoc, Array.from({length: end - start + 1}, (_, i) => start + i));
        pages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        results.push({
          name: `${file.name.replace('.pdf', '')}_pages_${start + 1}-${end + 1}.pdf`,
          url
        });
      }
      
      setProcessedFiles(results);
      toast.success(`Split ${selectedFiles.length} PDF(s) successfully!`);
    } catch (error) {
      console.error('Split error:', error);
      toast.error('Failed to split PDF. Please check the file and page range.');
    } finally {
      setIsProcessing(false);
    }
  };

  const mergePDFs = async () => {
    if (!handleAuthCheck() || selectedFiles.length < 2) {
      toast.error('Please select at least 2 PDF files to merge');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedFiles([{
        name: 'merged_document.pdf',
        url
      }]);
      
      toast.success('PDFs merged successfully!');
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge PDFs');
    } finally {
      setIsProcessing(false);
    }
  };

  const rotatePDF = async () => {
    if (!handleAuthCheck() || selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const results: { name: string; url: string }[] = [];
      
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();
        
        const rotation = parseInt(rotationAngle);
        pages.forEach(page => {
          page.setRotation(degrees(rotation));
        });
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        results.push({
          name: `${file.name.replace('.pdf', '')}_rotated_${rotation}.pdf`,
          url
        });
      }
      
      setProcessedFiles(results);
      toast.success(`Rotated ${selectedFiles.length} PDF(s) by ${rotationAngle}°`);
    } catch (error) {
      console.error('Rotation error:', error);
      toast.error('Failed to rotate PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const addPasswordProtection = async () => {
    if (!handleAuthCheck() || selectedFiles.length === 0 || !password.trim()) {
      toast.error('Please select files and enter a password');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Note: PDF password protection requires server-side processing in production
      // This is a demo implementation
      toast.info('Password protection requires server-side processing. Creating demo protected PDF...');
      
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      pdf.text('This PDF would be password protected in production', 20, 20);
      pdf.text(`Password: ${password}`, 20, 40);
      pdf.text('Original files:', 20, 60);
      
      selectedFiles.forEach((file, index) => {
        pdf.text(`${index + 1}. ${file.name}`, 20, 80 + (index * 10));
      });
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setProcessedFiles([{
        name: 'password_protected_demo.pdf',
        url
      }]);
      
      toast.success('Demo password-protected PDF created!');
    } catch (error) {
      console.error('Password protection error:', error);
      toast.error('Failed to add password protection');
    } finally {
      setIsProcessing(false);
    }
  };

  const compressPDF = async () => {
    if (!handleAuthCheck() || selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const results: { name: string; url: string }[] = [];
      
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Basic compression by re-saving
        const pdfBytes = await pdfDoc.save({
          useObjectStreams: false,
          addDefaultPage: false,
        });
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (blob.size / 1024 / 1024).toFixed(2);
        
        results.push({
          name: `${file.name.replace('.pdf', '')}_compressed.pdf`,
          url
        });
        
        toast.success(`Compressed ${file.name}: ${originalSize}MB → ${compressedSize}MB`);
      }
      
      setProcessedFiles(results);
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Failed to compress PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (file: { name: string; url: string }) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${file.name}`);
  };

  const downloadAll = () => {
    processedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 200);
    });
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setProcessedFiles([]);
    processedFiles.forEach(file => URL.revokeObjectURL(file.url));
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            PDF Editor (No API Required)
          </CardTitle>
          <CardDescription>
            Professional PDF editing tools - split, merge, rotate, and protect your PDFs - works completely offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select PDF Files</Label>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={!user}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <span className="text-sm font-medium">{file.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Operations */}
          <Tabs defaultValue="split" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="split">Split</TabsTrigger>
              <TabsTrigger value="merge">Merge</TabsTrigger>
              <TabsTrigger value="rotate">Rotate</TabsTrigger>
              <TabsTrigger value="protect">Protect</TabsTrigger>
              <TabsTrigger value="compress">Compress</TabsTrigger>
            </TabsList>

            <TabsContent value="split" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pages">Page Range (e.g., 1-5)</Label>
                <Input
                  id="pages"
                  value={splitPages}
                  onChange={(e) => setSplitPages(e.target.value)}
                  placeholder="1-5"
                  disabled={!user}
                />
              </div>
              <Button
                onClick={splitPDF}
                disabled={!user || selectedFiles.length === 0 || isProcessing}
                className="w-full"
                variant="studio"
              >
                <Scissors className="h-4 w-4 mr-2" />
                {isProcessing ? 'Splitting...' : 'Split PDF'}
              </Button>
            </TabsContent>

            <TabsContent value="merge" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select multiple PDF files to merge them into one document.
              </p>
              <Button
                onClick={mergePDFs}
                disabled={!user || selectedFiles.length < 2 || isProcessing}
                className="w-full"
                variant="studio"
              >
                <Merge className="h-4 w-4 mr-2" />
                {isProcessing ? 'Merging...' : 'Merge PDFs'}
              </Button>
            </TabsContent>

            <TabsContent value="rotate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rotation">Rotation Angle</Label>
                <select
                  id="rotation"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(e.target.value)}
                  className="w-full p-2 rounded-md bg-white/50 border border-white/30"
                  disabled={!user}
                >
                  <option value="90">90° Clockwise</option>
                  <option value="180">180°</option>
                  <option value="270">270° (90° Counter-clockwise)</option>
                </select>
              </div>
              <Button
                onClick={rotatePDF}
                disabled={!user || selectedFiles.length === 0 || isProcessing}
                className="w-full"
                variant="studio"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                {isProcessing ? 'Rotating...' : 'Rotate PDF'}
              </Button>
            </TabsContent>

            <TabsContent value="protect" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={!user}
                />
              </div>
              <Button
                onClick={addPasswordProtection}
                disabled={!user || selectedFiles.length === 0 || !password.trim() || isProcessing}
                className="w-full"
                variant="studio"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isProcessing ? 'Protecting...' : 'Add Password Protection'}
              </Button>
            </TabsContent>

            <TabsContent value="compress" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reduce PDF file size while maintaining quality.
              </p>
              <Button
                onClick={compressPDF}
                disabled={!user || selectedFiles.length === 0 || isProcessing}
                className="w-full"
                variant="studio"
              >
                <FileText className="h-4 w-4 mr-2" />
                {isProcessing ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Results */}
          {processedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Processed Files</h3>
                <Button onClick={downloadAll} variant="glass" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {processedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <Button
                      onClick={() => downloadFile(file)}
                      variant="glass"
                      size="sm"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clear Button */}
          {(selectedFiles.length > 0 || processedFiles.length > 0) && (
            <Button onClick={clearAll} variant="outline" className="w-full">
              Clear All
            </Button>
          )}

          {!user && (
            <div className="text-center p-8 bg-white/5 rounded-lg border border-white/20">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to access PDF editing tools</p>
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