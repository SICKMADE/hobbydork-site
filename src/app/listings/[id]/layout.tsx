import { ListingSchema } from './schema';
import { Suspense } from 'react';
import { generateMetadata as generateListingMetadata } from './metadata';

export const generateMetadata = generateListingMetadata;

export default function ListingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ListingSchemaWrapper params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function ListingSchemaWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingSchema listingId={id} />;
}
