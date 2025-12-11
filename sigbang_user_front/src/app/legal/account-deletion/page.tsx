import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import AccountDeletionRequestForm from '@/components/account/AccountDeletionRequestForm';

export const dynamic = 'force-dynamic';

export default function AccountDeletionInfoPage() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="text-2xl font-semibold">계정 및 데이터 삭제 요청 안내</h1>
        <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">서비스 정보</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>앱 이름: 식방</li>
              <li>개발자: 아미니티</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">계정 삭제 요청 방법</h2>
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              <li>아래 양식에 식방 앱에서 사용 중인 이메일 주소와 계정 정보를 입력합니다.</li>
              <li>
                계정 및 데이터 삭제를 원하는 내용을 자세히 적고,&nbsp;
                <strong>“계정 삭제 요청 보내기”</strong> 버튼을 누릅니다.
              </li>
              <li>
                입력하신 내용은 운영팀 이메일(
                <a className="text-sky-600 hover:underline" href="mailto:support@sigbang.com">
                  support@sigbang.com
                </a>
                )로 자동 전송됩니다.
              </li>
              <li>아미니티는 영업일 기준 7일 이내에 요청을 검토하고, 처리 결과를 이메일로 안내드립니다.</li>
            </ol>
            <p className="mt-2 text-sm text-gray-600">
              앱에 로그인할 수 없는 경우에도, 이 페이지에서 계정 삭제를 요청하실 수 있습니다.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">삭제·보관되는 데이터 및 보관 기간</h2>
            <p className="mt-2 font-medium">삭제되는 데이터</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>계정 기본 정보: 이메일 주소, 닉네임, 프로필 이미지 등</li>
              <li>서비스 이용 정보: 레시피 북마크, 저장한 레시피, 좋아요/저장 기록, 개인화 추천 기록 등</li>
              <li>앱 설정 및 환경 정보: 알림 설정, 언어/지역 설정 등</li>
            </ul>
            <p className="mt-3 font-medium">예외적으로 보관되는 데이터</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>
                전자상거래·세법 등 관계 법령에 따라 결제·환불 및 거래 관련 기록은 최대 5년간 보관 후 안전하게 파기합니다.
              </li>
              <li>
                부정 이용 방지 및 보안 목적의 최소한의 접속 기록(접속 IP 등)은 최대 1년간 보관 후 파기합니다.
              </li>
              <li>
                분쟁 해결, 신고 처리 등 필요한 경우에는 해당 사유가 해소될 때까지 관련 정보를 보관할 수 있으며, 목적이
                달성되면 지체 없이 파기합니다.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              일부 공용 게시물(예: 다른 이용자의 이용 기록 보호가 필요한 레시피, 댓글 등)은 계정과 분리하여 닉네임·이메일
              등 식별 정보를 제거한 <strong>익명화 상태로 보관</strong>될 수 있습니다.
            </p>
            <p className="mt-1 text-sm text-gray-600">
              위 보관 기간이 지난 데이터는 복구 불가능한 방법으로 영구 삭제합니다.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">계정 삭제 요청 양식</h2>
            <p className="mt-2 text-sm text-gray-600">
              요청을 정확히 처리하기 위해, 가능한 한 자세한 계정 정보를 입력해 주세요.
            </p>
            <AccountDeletionRequestForm />
          </div>
        </div>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}


