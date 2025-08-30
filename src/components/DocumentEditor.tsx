import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Save, Upload, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { User } from "firebase/auth";

interface DocumentEditorProps {
  user: User | null;
  onAuthRequired: () => void;
}

export const DocumentEditor = ({ user, onAuthRequired }: DocumentEditorProps) => {
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [documentContent, setDocumentContent] = useState("");
  const [fontSize, setFontSize] = useState("14");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState("left");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuthCheck = () => {
    if (!user) {
      onAuthRequired();
      return false;
    }
    return true;
  };

  const applyFormatting = (format: string) => {
    if (!handleAuthCheck()) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = documentContent.substring(start, end);
    
    if (selectedText) {
      let formattedText = selectedText;
      
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          setIsBold(!isBold);
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          setIsItalic(!isItalic);
          break;
        case 'underline':
          formattedText = `<u>${selectedText}</u>`;
          setIsUnderline(!isUnderline);
          break;
      }
      
      const newContent = documentContent.substring(0, start) + formattedText + documentContent.substring(end);
      setDocumentContent(newContent);
      toast.success(`Applied ${format} formatting`);
    } else {
      toast.info("Please select text to format");
    }
  };

  const insertList = (ordered: boolean = false) => {
    if (!handleAuthCheck()) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const listItem = ordered ? "1. New item\n" : "• New item\n";
    
    const newContent = documentContent.substring(0, start) + listItem + documentContent.substring(start);
    setDocumentContent(newContent);
    toast.success(`Inserted ${ordered ? 'numbered' : 'bullet'} list`);
  };

  const saveDocument = async () => {
    if (!handleAuthCheck()) return;
    
    try {
      const blob = new Blob([documentContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Document saved successfully!");
    } catch (error) {
      toast.error("Failed to save document");
    }
  };

  const exportToPDF = async () => {
    if (!handleAuthCheck()) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      // Set font
      pdf.setFont(fontFamily.toLowerCase());
      pdf.setFontSize(parseInt(fontSize));
      
      // Add title
      pdf.setFontSize(18);
      pdf.text(documentTitle, 20, 30);
      
      // Add content
      pdf.setFontSize(parseInt(fontSize));
      const lines = pdf.splitTextToSize(documentContent, 170);
      pdf.text(lines, 20, 50);
      
      // Save PDF
      pdf.save(`${documentTitle}.pdf`);
      toast.success("Document exported to PDF!");
    } catch (error) {
      toast.error("Failed to export to PDF");
    }
  };

  const exportToWord = async () => {
    if (!handleAuthCheck()) return;
    
    try {
      // Create a simple HTML document that can be opened in Word
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${documentTitle}</title>
          <style>
            body { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize}px; 
              text-align: ${textAlign};
              margin: 1in;
              line-height: 1.5;
            }
            h1 { font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${documentTitle}</h1>
          <div>${documentContent.replace(/\n/g, '<br>')}</div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Document exported to Word format!");
    } catch (error) {
      toast.error("Failed to export to Word");
    }
  };

  const loadDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!handleAuthCheck()) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setDocumentContent(content);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
      toast.success("Document loaded successfully!");
    };
    reader.readAsText(file);
  };

  const getTextareaStyle = () => ({
    fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecoration: isUnderline ? 'underline' : 'none',
    textAlign: textAlign as any,
  });

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card backdrop-blur-lg border-white/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Editor
          </CardTitle>
          <CardDescription>
            Create, edit, and format documents with professional tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-white/50 backdrop-blur border-white/30 text-lg font-semibold"
              disabled={!user}
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-2 p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex gap-2">
              <Select value={fontFamily} onValueChange={setFontFamily} disabled={!user}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fontSize} onValueChange={setFontSize} disabled={!user}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1">
              <Button
                variant={isBold ? "default" : "outline"}
                size="sm"
                onClick={() => applyFormatting('bold')}
                disabled={!user}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={isItalic ? "default" : "outline"}
                size="sm"
                onClick={() => applyFormatting('italic')}
                disabled={!user}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={isUnderline ? "default" : "outline"}
                size="sm"
                onClick={() => applyFormatting('underline')}
                disabled={!user}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant={textAlign === 'left' ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign('left')}
                disabled={!user}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={textAlign === 'center' ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign('center')}
                disabled={!user}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={textAlign === 'right' ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign('right')}
                disabled={!user}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertList(false)}
                disabled={!user}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertList(true)}
                disabled={!user}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Document Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Document Content</Label>
            <Textarea
              ref={textareaRef}
              id="content"
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder={user ? "Start typing your document..." : "Please sign in to use the document editor"}
              className="min-h-[400px] bg-white/50 backdrop-blur border-white/30 resize-none"
              style={getTextareaStyle()}
              disabled={!user}
            />
            <div className="text-sm text-muted-foreground">
              Words: {documentContent.split(/\s+/).filter(word => word.length > 0).length} | 
              Characters: {documentContent.length}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx"
              onChange={loadDocument}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={!user}
            >
              <Upload className="h-4 w-4 mr-2" />
              Load Document
            </Button>

            <Button
              onClick={saveDocument}
              variant="glass"
              disabled={!user}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as TXT
            </Button>

            <Button
              onClick={exportToPDF}
              variant="glass"
              disabled={!user}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to PDF
            </Button>

            <Button
              onClick={exportToWord}
              variant="glass"
              disabled={!user}
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Word
            </Button>
          </div>

          {!user && (
            <div className="text-center p-8 bg-white/5 rounded-lg border border-white/20">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Sign in to access the document editor</p>
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