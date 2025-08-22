      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier');
      }
    };

    input.click();
  };

  return (