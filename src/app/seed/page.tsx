'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedDatabase } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    const result = await seedDatabase();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Seed Database</CardTitle>
          <CardDescription>
            Click the button below to populate your Firestore database with the initial set of departments, classes, and students. You only need to do this once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This action will add the data from the local `src/lib/data.ts` file into the `departments`, `classes`, and `students` collections in Firestore. If the collections already contain data, this action will not add duplicates.
          </p>
          <Button onClick={handleSeed} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Data into Firestore'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
