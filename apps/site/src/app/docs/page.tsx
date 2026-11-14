import { redirect } from 'next/navigation';

/** /docs has no page of its own; the quick start is the docs landing page. */
export default function DocsIndex() {
  redirect('/docs/quick-start');
}
