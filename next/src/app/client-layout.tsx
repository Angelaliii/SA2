"use client";

import { useEffect } from 'react';
import { schedulerService } from '../firebase/services';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    schedulerService?.startDeadlineChecker();
    return () => {
      schedulerService?.stopDeadlineChecker();
    };
  }, []);

  return <>{children}</>;
}