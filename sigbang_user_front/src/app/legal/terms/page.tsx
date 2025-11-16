import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-semibold">서비스 이용약관 (Terms of Service)</h1>
        <div className="mt-6 space-y-5 text-gray-700 leading-relaxed">
          <p>
            본 약관은 <strong>식방</strong>(이하 “회사” 또는 “서비스”)가 제공하는 모바일 애플리케이션(안드로이드, iOS) 서비스 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정합니다.
          </p>

          <h2 className="text-xl font-semibold mt-8">제1조 (목적)</h2>
          <p>
            이 약관은 회사가 제공하는 서비스의 이용조건, 절차, 이용자와 회사 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-xl font-semibold mt-8">제2조 (정의)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>“회원”이라 함은 Google 또는 Apple 계정으로 본 서비스에 로그인한 자를 말합니다.</li>
            <li>“콘텐츠”란 사용자가 업로드한 레시피, 이미지, 댓글 등을 말합니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">제3조 (약관 동의)</h2>
          <p>사용자는 앱 설치 및 로그인 시 본 약관에 동의한 것으로 간주합니다.</p>

          <h2 className="text-xl font-semibold mt-8">제4조 (회원가입 및 탈퇴)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원은 Google 또는 Apple 로그인을 통해 가입할 수 있습니다.</li>
            <li>회원은 앱 내 메뉴를 통해 언제든지 탈퇴할 수 있으며, 탈퇴 시 모든 데이터는 파기됩니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">제5조 (서비스 제공)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>서비스는 레시피 공유, 피드 열람, 콘텐츠 작성 및 저장 기능 등을 포함합니다.</li>
            <li>회사는 서비스의 전부 또는 일부를 변경, 중단할 수 있습니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">제6조 (회원의 의무)</h2>
          <p>회원은 관련 법령과 본 약관을 준수해야 하며, 다음 행위를 해서는 안 됩니다:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>타인의 개인정보 도용</li>
            <li>비방, 혐오, 음란물 등 부적절한 콘텐츠 게시</li>
            <li>서비스의 정상적 운영 방해</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">제7조 (저작권 및 콘텐츠 관리)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>회원이 작성한 콘텐츠의 저작권은 회원에게 있습니다.</li>
            <li>다만 회사는 서비스 홍보 및 운영을 위해 비상업적 목적에 한하여 콘텐츠를 사용할 수 있습니다.</li>
            <li>부적절한 콘텐츠는 사전 고지 없이 숨김 또는 삭제될 수 있습니다.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">제8조 (계정 정지 및 해지)</h2>
          <p>회사는 본 약관을 위반하거나 사회질서를 해치는 활동이 발견될 경우 사전 통지 없이 서비스 이용을 제한할 수 있습니다.</p>

          <h2 className="text-xl font-semibold mt-8">제9조 (면책조항)</h2>
          <p>서비스 오류, 데이터 유실, 기기 문제 등으로 인한 손해에 대해 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</p>

          <h2 className="text-xl font-semibold mt-8">제10조 (준거법 및 재판관할)</h2>
          <p>본 약관은 대한민국 법령에 따르며, 분쟁 발생 시 회사 소재지 관할 법원을 1심 관할로 합니다.</p>

          <h2 className="text-xl font-semibold mt-8">부칙</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>본 약관은 2025.07.23부터 시행합니다.</li>
          </ul>
        </div>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}


