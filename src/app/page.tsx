import { getPublishedPages } from '@/lib/db';
import PublicGallery from './components/PublicGallery';

// Disable caching for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const pages = await getPublishedPages();

  return <PublicGallery pages={pages} />;
}
