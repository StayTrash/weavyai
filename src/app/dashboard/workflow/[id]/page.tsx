'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { WorkflowBuilder } from '@/components/workflow/workflow-builder';
import { Spinner } from '@/components/ui/spinner';

export default function WorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const workflowId = params.id as string;

  // Protected route: redirect to sign-in when unauthenticated
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/signin');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground">
      <WorkflowBuilder workflowId={workflowId} />
    </div>
  );
}
