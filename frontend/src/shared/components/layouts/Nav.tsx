import React from 'react';

export default function Nav({ children }: { children: React.ReactNode }) {
  return (
    <nav className="sticky top-0 flex h-screen flex-shrink-0 flex-col border-r border-gray-200 bg-white px-4 ">
      <ul className="flex flex-1 flex-col pt-4">{children}</ul>
    </nav>
  );
}
