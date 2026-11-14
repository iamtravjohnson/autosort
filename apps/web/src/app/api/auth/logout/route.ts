import { NextResponse } from 'next/server';
import { appUrl } from '@/lib/config';
import { endSession } from '@/lib/session';

export async function POST() {
  await endSession();
  return NextResponse.redirect(`${await appUrl()}/connect`, { status: 303 });
}
