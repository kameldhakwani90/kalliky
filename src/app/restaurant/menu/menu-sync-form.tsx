

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { menuSync } from '@/ai/flows/menu-sync-ai';
import { Loader2, UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';

export default function MenuSyncForm() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setResult(null);
    }
  };

  const toDataURI = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });

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

    setLoading(true);
    setResult(null);

    try {
        const excelDataUri = await toDataURI(file);
        const response = await menuSync({ excelDataUri });
        
        const formattedJson = JSON.stringify(JSON.parse(response.menuItems), null, 2);
        setResult(formattedJson);

        toast({
            title: t({ fr: 'Synchronisation réussie!', en: 'Synchronization successful!' }),
            description: t({ fr: 'Votre menu a été analysé et mis à jour.', en: 'Your menu has been analyzed and updated.' }),
        });

    } catch (error) {
      console.error('Menu sync failed:', error);
      toast({
        title: t({ fr: 'Erreur de synchronisation', en: 'Synchronization error' }),
        description: t({ fr: 'Impossible de traiter le fichier. Veuillez vérifier le format et réessayer.', en: 'Could not process the file. Please check the format and try again.' }),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const translations = {
    dropOrSelect: { fr: 'Glissez-déposez un fichier ou cliquez pour sélectionner', en: 'Drag and drop a file or click to select' },
    fileSelected: { fr: 'Fichier sélectionné', en: 'File selected' },
    loading: { fr: 'Analyse en cours...', en: 'Analyzing...' },
    sync: { fr: 'Lancer la synchronisation', en: 'Start synchronization' },
    analysisResult: { fr: 'Résultat de l\'analyse :', en: 'Analysis Result:' },
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-dashed border-2 border-muted rounded-lg p-6 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <Label htmlFor="menu-file" className="mt-4 block text-sm font-medium text-foreground">
                {t(translations.dropOrSelect)}
            </Label>
            <Input
            id="menu-file"
            type="file"
            accept=".xlsx, .xls, .png, .jpg, .jpeg"
            onChange={handleFileChange}
            disabled={loading}
            className="sr-only"
            />
            {file && <p className="text-xs text-muted-foreground mt-2">{t(translations.fileSelected)}: {file.name}</p>}
        </div>
        <Button type="submit" disabled={loading || !file} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {loading ? t(translations.loading) : t(translations.sync)}
        </Button>
      </form>

      {result && (
        <div className="mt-4">
            <h4 className="font-semibold mb-2">{t(translations.analysisResult)}</h4>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                <code>
                    {result}
                </code>
            </pre>
        </div>
      )}
    </div>
  );
}
