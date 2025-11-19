export const buildVerifyEmailHtml = (link: string, nickname?: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; line-height:1.6; color:#111">
    <h2 style="margin:0 0 16px">${nickname ? `${escapeHtml(nickname)}님` : '안녕하세요'} 👋</h2>
    <p style="margin:0 0 12px">시그방 회원가입을 완료하려면 아래 버튼을 눌러 이메일 주소를 확인해주세요.</p>
    <p style="margin:16px 0">
      <a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none" target="_blank" rel="noopener">이메일 확인하기</a>
    </p>
    <p style="margin:16px 0 8px">버튼이 동작하지 않는 경우 아래 링크를 복사해 브라우저에 붙여넣기 하세요.</p>
    <p style="margin:0"><code style="background:#f6f6f6;padding:8px 10px;border-radius:6px;display:inline-block">${link}</code></p>
  </div>
`;

export const buildResetPasswordHtml = (link: string, nickname?: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; line-height:1.6; color:#111">
    <h2 style="margin:0 0 16px">${nickname ? `${escapeHtml(nickname)}님` : '안녕하세요'} 🔒</h2>
    <p style="margin:0 0 12px">비밀번호 재설정을 요청하셨습니다. 아래 버튼을 눌러 새 비밀번호를 설정하세요.</p>
    <p style="margin:0 0 12px">이 요청을 본인이 하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
    <p style="margin:16px 0">
      <a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none" target="_blank" rel="noopener">비밀번호 재설정</a>
    </p>
    <p style="margin:16px 0 8px">버튼이 동작하지 않는 경우 아래 링크를 복사해 브라우저에 붙여넣기 하세요.</p>
    <p style="margin:0"><code style="background:#f6f6f6;padding:8px 10px;border-radius:6px;display:inline-block">${link}</code></p>
  </div>
`;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#039;';
      default: return c;
    }
  });
}


