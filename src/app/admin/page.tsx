import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllPages } from '@/lib/db';
import AdminDashboard from '@/app/components/AdminDashboard';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  const pages = await getAllPages();

  return <AdminDashboard initialPages={pages} />;
}