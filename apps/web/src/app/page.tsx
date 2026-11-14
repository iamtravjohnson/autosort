import { redirect } from 'next/navigation';
import { setupStatus } from '@/lib/setup';
import { currentUser } from '@/lib/session';

/** Send people where they need to be: setup until configured, then connect, then the app. */
export default async function Root() {
  const status = await setupStatus();
  if (!status.ready) redirect('/setup');
  const user = await currentUser();
  redirect(user ? '/app' : '/connect');
}
