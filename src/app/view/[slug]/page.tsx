import { notFound } from 'next/navigation';
import { getPublishedPageBySlug } from '@/lib/db';
import PublicPageView from '@/app/components/PublicPageView';

export default async function ViewPage({ params }: { params: { slug: string } }) {
  const page = await getPublishedPageBySlug(params.slug);

  if (!page) {
    notFound();
  }

  return <PublicPageView page={page} />;
}