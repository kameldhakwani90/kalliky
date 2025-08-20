
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
type ProcessingPhase = 'PENDING' | 'EXTRACTING_TEXT' | 'ANALYZING_STRUCTURE' | 'DETECTING_COMPOSITIONS' | 'CREATING_COMPONENTS' | 'ASSEMBLING_PRODUCTS' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW';

interface MenuSyncFormProps {
  onUploadComplete?: () => void;
}

export default function MenuSyncForm({ onUploadComplete }: MenuSyncFormProps) {
  const { t } = useLanguage();
  const params = useParams();
  const storeId = params.serviceId as string;
  
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Polling pour le statut de traitement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionId && status === 'processing') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/ai/upload-status/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setProgress(data.progress);
            setCurrentPhase(data.currentPhase);
            
            if (data.status === 'COMPLETED') {
              setStatus('completed');
              setResult(data);
              toast({
                title: t({ fr: 'Analyse terminée !', en: 'Analysis completed!' }),
                description: t({ 
                  fr: `${data.productsCreatedCount} produits créés avec ${data.componentsCreated} composants`, 
                  en: `${data.productsCreatedCount} products created with ${data.componentsCreated} components` 
                }),
              });
              
              // Recharger les produits dans l'interface parent
              if (onUploadComplete) {
                onUploadComplete();
              }
            } else if (data.status === 'FAILED') {
              setStatus('error');
              toast({
                title: t({ fr: 'Erreur de traitement', en: 'Processing error' }),
                description: t({ fr: 'Le traitement a échoué', en: 'Processing failed' }),
                variant: 'destructive',
              });
            }
          }
        } catch (error) {
          console.error('Error checking status:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, status, t, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setStatus('idle');
      setProgress(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: t({ fr: 'Aucun fichier sélectionné', en: 'No file selected' }),
        description: t({ fr: 'Veuillez sélectionner un fichier à importer.', en: 'Please select a file to import.' }),
        variant: 'destructive',
      });
      return;
    }

    setStatus('uploading');
    setResult(null);
    setProgress(0);

    try {
      // Upload du fichier
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);
      formData.append('autoProcess', 'true');

      const uploadResponse = await fetch('/api/ai/menu-upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setSessionId(uploadData.sessionId);
      setStatus('processing');
      setProgress(5);
      setCurrentPhase('Début du traitement IA...');

      toast({
        title: t({ fr: 'Upload réussi !', en: 'Upload successful!' }),
        description: t({ fr: 'Analyse IA en cours...', en: 'AI analysis in progress...' }),
      });

    } catch (error) {
      console.error('Menu sync failed:', error);
      setStatus('error');
      toast({
        title: t({ fr: 'Erreur d\'upload', en: 'Upload error' }),
        description: t({ fr: 'Impossible de traiter le fichier. Veuillez vérifier le format et réessayer.', en: 'Could not process the file. Please check the format and try again.' }),
        variant: 'destructive',
      });
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <UploadCloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return t({ fr: 'Upload en cours...', en: 'Uploading...' });
      case 'processing':
        return currentPhase || t({ fr: 'Traitement IA...', en: 'AI Processing...' });
      case 'completed':
        return t({ fr: 'Analyse terminée !', en: 'Analysis completed!' });
      case 'error':
        return t({ fr: 'Erreur de traitement', en: 'Processing error' });
      default:
        return t({ fr: 'Lancer la synchronisation', en: 'Start synchronization' });
    }
  };

  const translations = {
    dropOrSelect: { fr: 'Glissez-déposez un fichier ou cliquez pour sélectionner', en: 'Drag and drop a file or click to select' },
    fileSelected: { fr: 'Fichier sélectionné', en: 'File selected' },
    analysisResult: { fr: 'Résultat de l\'analyse :', en: 'Analysis Result:' },
    productsCreated: { fr: 'Produits créés', en: 'Products created' },
    componentsCreated: { fr: 'Composants créés', en: 'Components created' },
    categoriesCreated: { fr: 'Catégories créées', en: 'Categories created' },
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-dashed border-2 border-muted rounded-lg p-6 text-center">
            {getStatusIcon()}
            <Label htmlFor="menu-file" className="mt-4 block text-sm font-medium text-foreground">
                {t(translations.dropOrSelect)}
            </Label>
            <Input
              id="menu-file"
              type="file"
              accept=".pdf, .png, .jpg, .jpeg, .xlsx, .xls"
              onChange={handleFileChange}
              disabled={status === 'uploading' || status === 'processing'}
              className="sr-only"
            />
            {file && (
              <p className="text-xs text-muted-foreground mt-2">
                {t(translations.fileSelected)}: {file.name}
              </p>
            )}
        </div>

        {(status === 'processing' || status === 'uploading') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{getStatusText()}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button 
          type="submit" 
          disabled={!file || status === 'uploading' || status === 'processing'} 
          className="w-full"
        >
          {getStatusIcon()}
          <span className="ml-2">{getStatusText()}</span>
        </Button>
      </form>

      {result && status === 'completed' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-lg">{t(translations.analysisResult)}</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.productsCreatedCount || 0}</div>
              <div className="text-sm text-muted-foreground">{t(translations.productsCreated)}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.componentsCreated || 0}</div>
              <div className="text-sm text-muted-foreground">{t(translations.componentsCreated)}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.componentCategoriesCreated || 0}</div>
              <div className="text-sm text-muted-foreground">{t(translations.categoriesCreated)}</div>
            </div>
          </div>

          {result.productsPreview && result.productsPreview.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium">Aperçu des produits créés :</h5>
              <div className="space-y-1">
                {result.productsPreview.map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm font-medium">{product.name}</span>
                    <Badge variant={product.hasComposition ? 'default' : 'secondary'}>
                      {product.hasComposition ? 'Avec composition' : 'Simple'}
                    </Badge>
                  </div>
                ))}
                {result.totalProducts > result.productsPreview.length && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Et {result.totalProducts - result.productsPreview.length} autres produits...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

    