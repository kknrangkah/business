'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QueueTicketRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/registration');
  }, [router]);

  return null;
}
