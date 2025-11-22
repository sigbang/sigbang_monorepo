import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-semibold">개인정보처리방침 (Privacy Policy)</h1>
        <div className="mt-6 space-y-5 text-gray-700 leading-relaxed">
          <p>
            식방은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수하고 있습니다. 본 개인정보처리방침은 이용자가 당사의 모바일 앱을 통해 제공하는 개인정보가 어떠한 방식으로 수집, 이용, 보관, 파기되는지를 안내합니다.
          </p>

          <h2 className="text-xl font-semibold mt-8">1. 수집하는 개인정보 항목</h2>
          <div className="space-y-2">
            <p className="font-medium">필수 항목: Google/Apple 로그인 시 수집되는 기본 정보</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>이름 또는 닉네임</li>
              <li>이메일 주소</li>
              <li>프로필 이미지 (선택적)</li>
            </ul>
            <p className="font-medium mt-4">자동 수집 항목</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>기기 정보 (모델명, OS 버전 등)</li>
              <li>앱 사용 기록 및 로그</li>
            </ul>
          </div>

          <h2 className="text-xl font-semibold mt-8">2. 개인정보 수집 방법</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Google/Apple 로그인 인증을 통해 사용자가 동의한 범위 내에서 수집</li>
            <li>앱 사용 중 자동으로 수집되는 정보</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. 개인정보의 이용 목적</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원 식별 및 서비스 제공</li>
            <li>피드 작성, 댓글, 좋아요 등 기능 제공</li>
            <li>부정 이용 방지 및 고객 지원</li>
            <li>서비스 개선 및 통계 분석</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">4. 개인정보 보유 및 이용기간</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원 탈퇴 시 즉시 파기 (단, 관계 법령에 따라 일정 기간 보관할 수 있음)</li>
            <li>서비스 이용기록, 접속로그: 3개월~1년 보관 후 자동 삭제</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">5. 개인정보 제공 및 위탁</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>제3자에게 제공하지 않으며, 위탁하지 않음</li>
            <li>(단, 향후 위탁이 발생할 경우 별도 고지)</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">6. 이용자의 권리 및 행사 방법</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>개인정보 열람, 정정, 삭제 요청 가능</li>
            <li>앱 내 고객센터 또는 이메일(<a className="text-sky-600 hover:underline" href="mailto:support@sigbang.com">support@sigbang.com</a>) 통해 요청 가능</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">7. 개인정보의 파기절차 및 방법</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>이용자의 회원탈퇴 또는 보관 기간 만료 시 지체 없이 파기</li>
            <li>전자적 파일은 복구 불가능한 기술적 방법으로 영구 삭제</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">8. 개인정보 보호책임자</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>책임자: 이효섭</li>
            <li>이메일: <a className="text-sky-600 hover:underline" href="mailto:support@sigbang.com">support@sigbang.com</a></li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">9. 정책 변경</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>본 방침은 2025.07.23부터 시행됩니다.</li>
            <li>변경사항 발생 시 앱 내 공지 또는 이메일을 통해 고지합니다.</li>
          </ul>
        </div>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}

