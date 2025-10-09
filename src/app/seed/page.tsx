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
            Click the button to populate your database with initial data. This will add or overwrite existing entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-bold">Warning: This is a potentially destructive action.</p>
            <p>Running this will overwrite any existing departments, classes, or students in your database that have the same ID as the data in `src/lib/data.ts`. Use with caution.</p>
          </div>
          <Button onClick={handleSeed} disabled={isLoading} variant="destructive" className="w-full">
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
