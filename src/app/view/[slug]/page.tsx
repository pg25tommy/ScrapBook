import { notFound } from 'next/navigation';
import { getPublishedPageBySlug } from '@/lib/db';
import PublicPageView from '@/app/components/PublicPageView';

export default async function ViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <PublicPageView page={page} />;
}