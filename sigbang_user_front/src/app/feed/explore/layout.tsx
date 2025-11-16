export const metadata = {
  title: '탐색 - 식방',
  description: '인기 급상승/새로운 레시피를 탐색해 보세요.',
  alternates: { canonical: '/feed/explore' },
  openGraph: { type: 'website', url: '/feed/explore', title: '탐색 - 식방', description: '새로운 레시피 탐색' },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}


