import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllPages } from '@/lib/db';
import PageEditor from '@/app/components/PageEditor';

export default async function EditPagePage({ params }: { params: { id: string } }) {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    redirect('/admin');
  }

  const pages = await getAllPages();
  const page = pages.find(p => p.id === id);

  if (!page) {
    redirect('/admin');
  }

  return <PageEditor mode="edit" initialPage={page} />;
}