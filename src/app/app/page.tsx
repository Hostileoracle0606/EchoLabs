import { Suspense } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainLayout />
    </Suspense>
  );
}
