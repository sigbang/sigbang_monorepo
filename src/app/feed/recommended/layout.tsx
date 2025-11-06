export const metadata = {
  title: '추천 - 식방',
  description: '취향에 맞춘 추천 레시피를 확인해 보세요.',
  alternates: { canonical: '/feed/recommended' },
  openGraph: { type: 'website', url: '/feed/recommended', title: '추천 - 식방', description: '추천 레시피' },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}


