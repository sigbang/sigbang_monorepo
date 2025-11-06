export const metadata = {
  title: '인기 - 식방',
  description: '많은 사랑을 받은 인기 레시피를 만나보세요.',
  alternates: { canonical: '/feed/popular' },
  openGraph: { type: 'website', url: '/feed/popular', title: '인기 - 식방', description: '인기 레시피' },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}


