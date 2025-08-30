@@ .. @@
 import { FaceGenerator } from "@/components/FaceGenerator";
-import { ImageEditor } from "@/components/ImageEditorNew";
+import { ImageEditor } from "@/components/ImageEditorNew";
 import { PDFConverter } from "@/components/PDFConverterNew";
 import { TextGenerator } from "@/components/TextGenerator";
-import { CodeEditor } from "@/components/CodeEditorNew";
+import { CodeEditorWithGenerator } from "@/components/CodeEditorWithGenerator";
 import { DocumentEditor } from "@/components/DocumentEditor";
 import { PDFEditor } from "@/components/PDFEditor";
@@ .. @@
               <TabsContent value="code" className="space-y-6">
                <CodeEditorWithGenerator user={user} onAuthRequired={() => setAuthModalOpen(true)} />
+                <CodeEditorWithGenerator user={user} onAuthRequired={() => setAuthModalOpen(true)} />
               </TabsContent>