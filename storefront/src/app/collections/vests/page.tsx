import { Suspense } from 'react';
import MedusaCollectionPage from '@/components/collections/MedusaCollectionPage';

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy"></div>
    </div>
  );
}

export default function VestsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MedusaCollectionPage collectionId="vests" />
    </Suspense>
  );
}
