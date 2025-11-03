import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

export default function AccountDeletePage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-semibold">계정 및 데이터 삭제</h1>
        <div className="mt-6 space-y-4 text-gray-700 leading-relaxed">
          <p>
            계정과 관련 데이터의 삭제를 원하시면 아래 방법 중 하나로 요청해 주세요. 본인 확인 후 지체 없이 처리합니다.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              이메일 요청: <a className="text-sky-600 hover:underline" href="mailto:contact.aminity@gmail.com?subject=%5B%EC%8B%9D%EB%B0%A9%5D%20%EA%B3%84%EC%A0%95%20%EB%B0%8F%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD">contact.aminity@gmail.com</a>
              로 아래 정보를 포함해 보내 주세요: 계정 이메일, 닉네임(선택), 삭제 사유(선택)
            </li>
            <li>
              앱 내 지원: 향후 제공 예정인 설정 &gt; 계정 &gt; 삭제 요청 기능을 통해 간편하게 접수하실 수 있습니다.
            </li>
          </ol>
          <p className="mt-6">
            법령에 의해 보관이 필요한 항목은 해당 기간 동안 분리 보관 후 파기하며, 그 외 데이터는 삭제 완료 시 즉시 파기됩니다.
          </p>
        </div>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}


