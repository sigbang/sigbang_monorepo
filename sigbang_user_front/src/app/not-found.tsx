export const runtime = 'nodejs';
export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <div style={{ padding: 32 }}>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
    </div>
  );
}


