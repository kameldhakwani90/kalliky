
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { menuSync } from '@/ai/flows/menu-sync-ai';
import { Loader2, UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function MenuSyncForm() {
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
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un fichier à importer.',
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
            title: 'Synchronisation réussie!',
            description: 'Votre menu a été analysé et mis à jour.',
        });

    } catch (error) {
      console.error('Menu sync failed:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: 'Impossible de traiter le fichier. Veuillez vérifier le format et réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-dashed border-2 border-muted rounded-lg p-6 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <Label htmlFor="menu-file" className="mt-4 block text-sm font-medium text-foreground">
                Glissez-déposez un fichier ou cliquez pour sélectionner
            </Label>
            <Input
            id="menu-file"
            type="file"
            accept=".xlsx, .xls, .png, .jpg, .jpeg"
            onChange={handleFileChange}
            disabled={loading}
            className="sr-only"
            />
            {file && <p className="text-xs text-muted-foreground mt-2">Fichier sélectionné: {file.name}</p>}
        </div>
        <Button type="submit" disabled={loading || !file} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Analyse en cours...' : 'Lancer la synchronisation'}
        </Button>
      </form>

      {result && (
        <div className="mt-4">
            <h4 className="font-semibold mb-2">Résultat de l'analyse :</h4>
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
