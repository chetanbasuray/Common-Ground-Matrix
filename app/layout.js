import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Common Ground Matrix',
  description: 'Find the shared statistical humanity between two countries.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
