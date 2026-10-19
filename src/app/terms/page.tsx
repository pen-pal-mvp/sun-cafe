'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function Terms() {
  const router = useRouter();
  const supabase = createClient();
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [nativeLanguage, setNativeLanguage] = useState('ko');
  const [learningLanguage, setLearningLanguage] = useState('ja');

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          router.push('/letters');
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkUserStatus();
  }, [router, supabase]);

  const handleSendMagicLink = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      alert('결제를 진행할 이메일을 입력해주세요. / 決済を進めるメールアドレスを入力してください。');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('올바른 이메일 형식이 아닙니다. / 正しいメールアドレスの形式で入力してください。');
      return;
    }

    setSending(true);
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, is_deleted, native_language, learning_language')
      .eq('email', trimmedEmail)
      .maybeSingle();

    let finalNative = nativeLanguage;
    let finalLearn = learningLanguage;
    let redirectUrl = `${window.location.origin}/checkout?lang=${finalNative}&learn=${finalLearn}`;

    if (existingProfile) {
      if (!existingProfile.is_deleted) {
        alert('이미 가입된 이메일입니다. 메인 화면에서 로그인해주세요.\n/ すでに登録済みのメールアドレスです。トップページからログインしてください。');
        setSending(false);
        router.push('/');
        return;
      }
      
      finalNative = existingProfile.native_language || 'ko';
      finalLearn = existingProfile.learning_language || 'ja';
      redirectUrl = `${window.location.origin}/checkout?returning=true&lang=${finalNative}&learn=${finalLearn}`;
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          native_language: finalNative,
          learning_language: finalLearn,
        }
      },
    });

    if (error) {
      alert('전송 실패 / 送信失敗: ' + error.message);
      setSending(false);
    } else {
      setSent(true);
    }
  };

  const handleNativeLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setNativeLanguage(selected);
    if (selected === 'ko') setLearningLanguage('ja');
    if (selected === 'ja') setLearningLanguage('ko');
  };

  const handleLearningLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setLearningLanguage(selected);
    if (selected === 'ko') setNativeLanguage('ja');
    if (selected === 'ja') setNativeLanguage('ko');
  };

  if (loading) return null;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fdfbf7' }}>
      
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px 32px', 
        backgroundColor: '#f4efe8', 
        borderBottom: '1px solid #e6dfd5',
      }}>
        <h1 className="text-3xl font-bold text-[#4a3b32]">순카페 (純喫茶)</h1>
        
        <div>
          <Button 
            onClick={() => router.push('/')}
            variant="outline" 
            className="border-[#4a3b32] text-[#4a3b32] font-bold hover:bg-[#efebe3] text-lg px-6 py-3 h-auto"
          >
            돌아가기 / 戻る
          </Button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-[#e6dfd5]">
          <h2 className="text-3xl font-bold text-[#4a3b32] mb-8 pb-4 border-b border-[#e6dfd5] text-center">
            이용약관 / 利用規約
          </h2>

          <div className="space-y-10 text-xl leading-loose">
            
            <div className="space-y-2">
              <p className="text-[#4a3b32]">이 이용약관(이하 '본 약관'이라 합니다)은 순카페(이하 '본 서비스'라 합니다)가 제공하는 웹 플랫폼 서비스의 이용 조건을 정하는 것입니다. 본 서비스를 이용하는 모든 사용자(이하 '사용자'라 합니다)는 본 약관에 동의한 것으로 간주됩니다.</p>
              <p className="text-[#5c4d44]">この利用規約（以下「本規約」といいます。）は、순카페（純喫茶）（以下「当サービス」といいます。）が提供するWebプラットフォームサービスの利用条件を定めるものです。当サービスを利用するすべてのユーザー（以下「ユーザー」といいます。）は、本規約に同意したものとみなされます。</p>
            </div>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제1조 (목적) / 第1条（目的）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 사용자가 온라인상에서 메시지를 교환할 수 있는 커뮤니케이션 플랫폼을 제공하는 것을 목적으로 합니다.</p>
                <p className="text-[#5c4d44]">当サービスは、ユーザーがオンライン上でメッセージを交換できるコミュニケーションプラットフォームを提供することを目的とします。</p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제2조 (약관의 변경) / 第2条（規約の変更）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 필요한 경우 본 약관의 내용을 변경할 수 있습니다. 변경 후의 약관 내용 및 효력 발생 시기를 본 서비스 내에 게시하거나 기타 적절한 방법으로 공지함으로써 효력을 발생합니다.</p>
                <p className="text-[#5c4d44]">当サービスは、必要に応じて本規約の内容を変更することができるものとします。変更後の規約の内容および効力発生時期を当サービス内に掲示その他適切な方法で周知することにより、効力を生じるものとします。</p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제3조 (이용 자격) / 第3条（利用資格）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스의 이용은 18세 이상으로 제한됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスの利用は18歳以上の方に限られます。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 일본어 또는 한국어로 소통이 가능한 자를 대상으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、日本語または韓国語でのコミュニケーションが可能な方を対象とします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">타인에 대한 비방, 민폐 행위, 질서 훼손 목적의 이용은 금지됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">他者への誹謗中傷、迷惑行為、秩序を乱す目的での利用は禁止します。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제4조 (계정 등록 및 관리) / 第4条（アカウント登録・管理）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">사용자는 본 서비스를 이용하기 위해 정확한 정보를 제공하여 계정을 등록해야 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーは、当サービスを利用するために正確な情報を提供してアカウント登録を行うものとします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">사용자는 자신의 계정, 등록 이메일 주소 및 인증 링크(로그인 정보)를 관리할 책임이 있으며, 이를 제3자에게 양도 또는 대여할 수 없습니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーは、自己のアカウント、登録メールアドレスおよび認証用リンク（ログイン情報）を管理する責任を負い、これを第三者に譲渡または貸与してはなりません。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">계정 정보의 유출 또는 부정 이용으로 인해 발생한 손해에 대하여, 본 서비스의 고의 또는 중과실에 의한 경우를 제외하고 본 서비스는 책임을 지지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">アカウント情報の漏洩または不正利用によって生じた損害について、当サービスの故意または重過失による場合を除き、当サービスは責任を負いません。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제5조 (서비스의 내용 및 제한) / 第5条（サービスの内容および制限）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 프로필 열람, 메시지 송수신, 프로필 정보 설정 및 편집 등의 기능을 제공합니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、プロフィール閲覧、メッセージ送受信、プロフィール情報の設定・編集等の機能を提供します。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">서비스의 일부는 유료로 제공될 수 있습니다.</p>
                  <p className="text-[#5c4d44] ml-4">サービスの一部は有料で提供される場合があります。</p>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32]">시스템의 안정적 운영을 위해 다음과 같은 이용 제한이 적용됩니다.
                    <br/>・메시지 발송은 1개월당 최대 10회로 제한됩니다.
                    <br/>・번역 기능 이용은 1일 최대 10회로 제한됩니다.
                    <br/>・송수신된 데이터는 발송일로부터 300일이 경과한 시점에 자동 삭제됩니다.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3">システムの安定的運営のため、以下の利用制限が適用されます。
                    <br/>・メッセージの送信は、1ヶ月につき最大10回に制限されます。
                    <br/>・翻訳機能の利用は、1日につき最大10回に制限されます。
                    <br/>・送受信されたデータは、送信日から300日を経過した時点に自動削除されます。
                  </p>
                  <div className="mt-5">
                    <p className="text-[#4a3b32] font-semibold">
                      본 서비스가 정하는 각종 이용 횟수 제한 및 300일 경과 데이터의 자동 삭제 규정은 시스템 사양으로서 모든 사용자에게 예외 없이 적용됩니다.
                    </p>
                    <p className="text-[#5c4d44] ml-4 mt-3 font-semibold">
                      当サービスが定める各種利用回数の制限、および300日を経過したデータの自動削除規定については、システムの仕様としてすべてのユーザーに例外なく適用されるものとします。
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-semibold">
                    본 서비스에서 발송된 메시지는 수신자에게 도달한 후 36시간이 경과한 시점부터 열람할 수 있도록 시스템 제한이 적용됩니다.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3 font-semibold">
                    当サービスで送信されたメッセージは、受信者に到達した後、36時間が経過した時点から閲覧可能となるシステム制限が適用されます。
                  </p>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-semibold">
                    발송이 완료된 메시지는 발신자 본인의 재열람을 포함하여, 어떠한 경우에도 내용 수정 및 전송 취소가 일체 불가능합니다.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3 font-semibold">
                    送信が完了したメッセージは、送信者自身による再閲覧を含め、いかなる場合でも内容の修正および送信の取り消しを行うことは一切できません。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제6조 (요금 및 결제) / 第6条（料金と決済）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">유료 서비스의 이용 요금 및 결제 방법은 본 서비스 내에 별도로 명시합니다.</p>
                  <p className="text-[#5c4d44] ml-4">有料サービスの利用料金および支払い方法等は、当サービス内に別途明示します。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">결제 처리는 글로벌 결제 플랫폼 'Stripe'를 이용하며, 한국 내 사용자는 Stripe를 통해 국내 신용카드, 체크카드 및 카카오페이(Kakao Pay)를 이용할 수 있습니다.</p>
                  <p className="text-[#5c4d44] ml-4">決済処理にはグローバル決済プラットフォーム「Stripe」を利用し、韓国国内のユーザーはStripeを介して韓国内クレジットカード、チェックカード、カカオペイ（Kakao Pay）を利用できます。</p>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold">구독 요금에 대한 일할 계산 및 환불은 제공되지 않으며, 서비스 해지 시 즉시 서비스 이용이 종료됩니다.</p>
                  <p className="text-[#5c4d44] ml-4 mt-2 font-bold">サブスクリプション料金の日割り計算および返金は行われず、サービス解約時をもって即座にサービスの利用が終了します。</p>
                </div>

                <div>
                  <p className="text-[#4a3b32]">결제 정보의 취급 및 오류 처리에 대해서는 Stripe의 이용약관을 따릅니다.</p>
                  <p className="text-[#5c4d44] ml-4">決済情報の取り扱いやエラー処理については、Stripeの利用規約に準じます。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제7조 (금지 사항) / 第7条（禁止事項）</h3>
              <div className="space-y-4 mt-3">
                <p className="text-[#4a3b32]">사용자는 다음의 행위를 해서는 안 됩니다.</p>
                <p className="text-[#5c4d44] mb-2">ユーザーは、以下の行為を行ってはなりません。</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[#4a3b32]">타 사용자, 본 서비스, 제3자의 명예나 신용을 훼손하는 행위, 비방, 괴롭힘 행위.</p>
                    <p className="text-[#5c4d44]">他のユーザー、当サービス、第三者の名誉・信用を毀損する行為、誹謗中傷、嫌がらせ行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">음란하거나 공서양속에 반하는 내용의 게시 및 전송.</p>
                    <p className="text-[#5c4d44]">わいせつ、公序良俗に反する内容の投稿および送信。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">상업적 목적, 정치·종교 활동, 권유 행위.</p>
                    <p className="text-[#5c4d44]">商業目的、政治・宗教活動、勧誘行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">자신 또는 제3자의 개인정보를 무단으로 공개하거나 타인의 개인정보를 수집하는 행위.</p>
                    <p className="text-[#5c4d44]">自己または第三者の個人情報を無断で公開、または他者の個人情報を収集する行為。</p>
                  </div>
                  <div>
                    <p className="text-red-800 font-bold">이메일, 카카오톡, LINE 등 외부 연락처를 교환하거나 기재하여 본 서비스 외부로 유도하는 행위.</p>
                    <p className="text-red-700 font-bold mt-1">メールアドレス、カカオトーク、LINE等の外部連絡先を交換・記載し、当サービス外へ誘導する行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">본 서비스 시스템에 대한 공격 및 부정 접속.</p>
                    <p className="text-[#5c4d44]">当サービスのシステムへの攻撃および不正アクセス。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">기타 본 서비스가 부적절하다고 판단하는 행위.</p>
                    <p className="text-[#5c4d44]">その他、当サービスが不適切と判断する行為。</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold text-sm">※ 위 금지 사항(특히 외부 연락처 교환)을 위반할 경우, 사전 통고 없이 계정이 영구 정지 및 삭제될 수 있습니다.</p>
                  <p className="text-[#5c4d44] font-bold text-sm mt-1">※ 上記の禁止事項（特に外部連絡先の交換）に違反した場合、事前の通知なしにアカウントが永久停止および削除される場合があります。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제8조 (지적 재산권) / 第8条（知的財産権）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">사용자가 본 서비스에 작성 및 발송한 내용의 저작권은 사용자에게 귀속됩니다. 단, 본 서비스는 서비스의 원활한 운영 및 시스템 처리(메시지 송수신, 번역 기능 제공 등)에 필요한 범위 내에서만 해당 내용을 무상으로 이용할 수 있는 것으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーが当サービス上で作成および送信した内容の著作権は、ユーザーに帰属します。ただし、当サービスは、サービスの円滑な運営およびシステム処理（メッセージの送受信、翻訳機能の提供等）に必要な範囲内でのみ、当該内容を無償で利用できるものとします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">본 서비스와 관련된 모든 지적 재산권은 본 서비스에 귀속됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスに関するすべての知的財産権は、当サービスに帰属します。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제9조 (면책 조항) / 第9条（免責事項）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 정보의 정확성, 특정 목적에의 적합성, 안전성에 대하여 어떠한 법적 보증도 하지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、情報の正確性、特定の目的への適合性、安全性についていかなる法的保証も行いません。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">사용자 간의 분쟁에 대하여 본 서비스는 개입하지 않으며, 사용자는 자신의 책임과 비용으로 이를 해결해야 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザー間の紛争について、当サービスは介入せず、ユーザー自身の責任と費用で解決するものとします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">통신 오류, 결제 시스템 장애 등 본 서비스의 고의나 중과실이 없는 사유로 발생한 손해에 대하여 본 서비스는 책임을 지지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">通信エラー、決済システム障害等、当サービスの故意または重過失によらない事由で生じた損害について、当サービスは責任を負いません。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제10조 (서비스의 중단 및 종료) / 第10条（サービスの中断・終了）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 유지보수, 시스템 장애, 천재지변, 기타 불가항력적 사유가 발생할 경우 사용자에게 사전 통지 없이 서비스의 일부 또는 전부를 중단하거나 종료할 수 있습니다.</p>
                <p className="text-[#5c4d44]">当サービスは、メンテナンス、システム障害、天災地変、その他の不可抗力事由が発生した場合、ユーザーに事前通知することなく、サービスの一部または全部を中断、または終了させることができるものとします。</p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제11조 (준거법 및 관할 법원) / 第11条（準拠法・管轄裁判所）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 약관의 해석 및 적용은 일본법을 준거법으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">本規約の解釈および適用は、日本法に準拠します。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">본 약관 또는 본 서비스와 관련하여 발생한 분쟁에 대해서는 나고야 지방법원을 제1심의 전속적 합의 관할 법원으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">本規約または当サービスに関して生じた紛争については、名古屋地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#e6dfd5] flex flex-col items-center gap-6">
            <label className="flex items-center gap-4 cursor-pointer p-4 hover:bg-[#fcfaf7] rounded-lg transition-colors">
              <input 
                type="checkbox" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="w-8 h-8 text-[#879977] border-[#d3c9c1] rounded focus:ring-[#879977] focus:ring-2 accent-[#879977]"
              />
              <span className="text-2xl font-bold text-[#4a3b32]">이용약관에 동의합니다 / 利用規約に同意する</span>
            </label>
            
            {isAgreed && !sent && (
              <div className="w-full max-w-md flex flex-col gap-6 bg-[#f0e6dd] p-6 rounded-xl mt-4 border border-[#e6dfd5] shadow-sm">
                
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#4a3b32] font-bold text-lg">
                      모국어 / 母国語
                    </label>
                    <select
                      value={nativeLanguage}
                      onChange={handleNativeLanguageChange}
                      className="w-full px-4 py-3 rounded-md border border-[#d3c9c1] text-lg focus:outline-none focus:ring-2 focus:ring-[#879977] bg-white text-[#4a3b32]"
                    >
                      <option value="ko">한국어 (韓国語)</option>
                      <option value="ja">일본어 (日本語)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[#4a3b32] font-bold text-lg">
                      배우고 싶은 언어 / 学習したい言語
                    </label>
                    <select
                      value={learningLanguage}
                      onChange={handleLearningLanguageChange}
                      className="w-full px-4 py-3 rounded-md border border-[#d3c9c1] text-lg focus:outline-none focus:ring-2 focus:ring-[#879977] bg-white text-[#4a3b32]"
                    >
                      <option value="ja">일본어 (日本語)</option>
                      <option value="ko">한국어 (韓国語)</option>
                    </select>
                    <p className="text-sm text-[#879977] mt-1 font-semibold">
                      ※등록 후 언어 설정은 변경할 수 없습니다.<br/>※登録後、言語設定は変更できません。
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-[#d3c9c1]"></div>

                <div className="flex flex-col gap-2">
                  <p className="text-[#4a3b32] font-bold text-center text-lg">
                    결제를 위해 이메일을 입력해주세요.<br/>決済のためにメールアドレスを入力してください。
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    placeholder="suncafe@example.com"
                    className="w-full px-4 py-3 rounded-md border border-[#d3c9c1] text-lg focus:outline-none focus:ring-2 focus:ring-[#879977]"
                  />
                </div>

                <Button
                  onClick={handleSendMagicLink}
                  disabled={sending}
                  className="w-full bg-[#879977] hover:bg-[#738563] text-white font-bold text-xl py-6 h-auto shadow-md rounded-lg transition-all"
                >
                  {sending ? '전송 중... / 送信中...' : '매직링크 받기 / リンクを受け取る'}
                </Button>
              </div>
            )}

            {sent && (
              <div className="w-full max-w-md bg-[#eaf3e1] p-6 rounded-xl border border-[#879977] text-center mt-4 shadow-sm">
                <p className="text-[#4a3b32] font-bold text-lg leading-relaxed">
                  ✨ 메일함을 확인해주세요!<br/>가입 링크를 클릭하면 결제 화면으로 이동합니다.<br/><br/>
                  メールをご確認ください！<br/>リンクをクリックすると決済画面へ移動します。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}