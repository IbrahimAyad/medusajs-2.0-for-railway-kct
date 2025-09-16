'use client';

import { default as NextLink } from 'next/link';
import type { LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type SafeLinkProps = LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
};

/**
 * SafeLink component - Wrapper around Next.js Link to fix Next.js 15.5.0 issues
 * This component helps prevent the originalFactory.call error in Next.js 15.5.0
 */
export default function SafeLink({ href, children, ...props }: SafeLinkProps) {
  // Ensure href is always a string
  const safeHref = typeof href === 'string' ? href : href?.toString() || '/';
  
  return (
    <NextLink href={safeHref} {...props}>
      {children}
    </NextLink>
  );
}