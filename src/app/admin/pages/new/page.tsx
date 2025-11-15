import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import PageEditor from '@/app/components/PageEditor';

export default async function NewPagePage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <PageEditor mode="create" />;
}