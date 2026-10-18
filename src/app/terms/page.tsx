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
              <p className="text-[#4a3b32]">이 이용약관(이하 '본 약관'이라 합니다)은 순카페(이하 '본 서비스'라 합니다)가 제공하는 한일 웹 펜팔 플랫폼 서비스의 이용 조건을 정하는 것입니다. 본 서비스를 이용하는 모든 사용자(이하 '사용자'라 합니다)는 본 약관에 동의한 것으로 간주됩니다.</p>
              <p className="text-[#5c4d44]">この利用規約（以下「本規約」といいます。）は、순카페（純喫茶）（以下「当サービス」といいます。）が提供する日韓Web文通プラットフォームサービスの利用条件を定めるものです。当サービスを利用するすべてのユーザー（以下「ユーザー」といいます。）は、本規約に同意したものとみなされます。</p>
            </div>

            <section className="bg-[#f0e6dd] p-8 rounded-xl border-l-8 border-[#879977] my-8">
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-4">총칙 (총칙) / 総則</h3>
              <p className="text-2xl font-bold text-[#4a3b32] leading-relaxed">
                내가 원하지 않는 바를 남에게 행하지 말라.<br />
                自分がして欲しくないことを、他者にしてはならない。
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제1조 (목적) / 第1条（目的）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 일본과 한국의 국경을 넘은 따뜻한 연결과, 카페처럼 편안하게 온라인상에서 펜팔(메시지 교환)을 할 수 있는 공간을 제공하는 것을 목적으로 합니다.</p>
                <p className="text-[#5c4d44]">当サービスは、日本と韓国の国境を越えた温かい繋がりと、カフェのようにリラックスできるオンライン上での文通（メッセージ交換）の場を提供することを目的とします。</p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제2조 (약관의 변경) / 第2条（規約の変更）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 사용자의 동의를 얻지 않고 언제든지 본 약관의 내용을 변경할 수 있습니다. 변경된 약관은 본 서비스에 표시된 시점부터 효력을 발생합니다.</p>
                <p className="text-[#5c4d44]">当サービスは、ユーザーの同意を得ることなく、いつでも本規約の内容を変更することができるものとします。変更後の規約は、当サービス上に表示された時点から効力を生じるものとします。</p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제3조 (이용 자격) / 第3条（利用資格）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스의 이용은 원칙적으로 18세 이상으로 제한됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスの利用は、原則として18歳以上の方に限られます。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 일본어 또는 한국어로 소통이 가능한 분을 대상으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、日本語または韓国語でのコミュニケーションが可能な方を対象としています。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">타인에 대한 비방, 민폐 행위, 질서를 어지럽힐 목적의 이용은 엄격히 금지합니다.</p>
                  <p className="text-[#5c4d44] ml-4">他者への誹謗中傷、迷惑行為、秩序を乱す目的での利用は固くお断りいたします。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제4조 (계정 등록 및 관리) / 第4条（アカウント登録・管理）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">사용자는 본 서비스를 이용하기 위해 정확한 정보(이메일 주소 등)를 제공하고 계정 등록을 해야 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーは、当サービスを利用するために、正確な情報（メールアドレス等）を提供し、アカウント登録を行う必要があります。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">사용자는 자신의 계정 및 비밀번호 관리 책임을 지며, 제3자에게 이용하게 해서는 안 됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーは、自己のアカウントおよびパスワードの管理責任を負い、第三者に利用させてはなりません。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">계정 정보의 유출이나 부정 이용으로 인해 발생한 손해에 대해 본 서비스는 일절 책임을 지지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">アカウント情報の漏洩や不正利用によって生じた損害について、当サービスは一切の責任を負いません。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제5조 (서비스의 내용) / 第5条（サービスの内容）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 다음과 같은 기능을 제공합니다.
                    <br/>- 다른 사용자의 프로필 열람
                    <br/>- '편지' 형식의 메시지 송수신
                    <br/>- 프로필 정보 설정 및 편집
                  </p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、以下の機能を提供します。
                    <br/>・他ユーザーのプロフィールの閲覧
                    <br/>・「手紙」形式によるメッセージの送受信
                    <br/>・プロフィール情報の設定・編集
                  </p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">서비스 내용의 일부는 유료일 수 있습니다.</p>
                  <p className="text-[#5c4d44] ml-4">サービス内容の一部は、有料となる場合があります。</p>
                </div>
                
                {/* 💡 背景色や枠線を消してフラット化 */}
                <div className="mt-4">
                  <p className="text-[#4a3b32]">서비스의 품질 유지를 위해 다음과 같은 이용 제한을 두고 있습니다.
                    <br/>- 편지 발송은 1개월에 최대 10통까지 가능합니다.
                    <br/>- 편지 번역 기능의 이용은 1일에 최대 10회까지 가능합니다.
                    <br/>- 송수신된 편지 데이터는 발송일로부터 300일이 경과하면 자동으로 삭제됩니다.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3">サービスの品質維持のため、以下の利用制限を設けています。
                    <br/>・手紙の送信は、1ヶ月につき最大10通までとなります。
                    <br/>・手紙の翻訳機能の利用は、1日につき最大10回までとなります。
                    <br/>・送受信された手紙のデータは、送信日から300日経過後に自動的に削除されます。
                  </p>
                  <div className="mt-5">
                    <p className="text-[#4a3b32] font-semibold">
                      제한된 횟수와 시간 속에서 나누는 이야기이기에, 한 통의 편지가 더욱 진심으로 다가간다고 저희는 믿습니다. 따라서 위와 같은 횟수 제한 및 300일 후 자동 삭제 규정은 어떠한 경우에도 예외 없이 적용되는 점, 따뜻한 마음으로 양해해 주시길 부탁드립니다.
                    </p>
                    <p className="text-[#5c4d44] ml-4 mt-3 font-semibold">
                      限られた回数と時間の中で交わされる言葉だからこそ、一通の手紙により深い思いが宿ると私たちは信じています。そのため、上記の各種回数制限および300日後の自動削除につきましては、いかなる理由がございましても例外なく適用されますこと、どうか温かいご理解を賜りますようお願い申し上げます。
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold text-xl mb-2">기다림의 미학 (기능 특칙) / 待つことの美学（機能特則）</p>
                  <p className="text-[#4a3b32]">
                    순카페의 편지는 아날로그 우편의 따뜻함을 소중히 여깁니다. 상대방의 수신함에는 즉시 도착하지만, <b>발송 후 36시간이 지나야 개봉할 수 있는</b> 특별한 사양이 적용되어 있습니다. 편지가 도착하기를 기다리는 설렘의 시간을 즐겨보세요.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3">
                    純喫茶の手紙はアナログ郵便の温もりを大切にしています。相手の受信箱には即時届きますが、<b>送信から36時間後に開封できるようになる</b>特別な仕様となっております。ゆっくり届くワクワク感と、手紙を待つ豊かな時間をお楽しみください。
                  </p>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold text-xl mb-2">발송된 편지의 수정 및 취소 불가 / 送信済み手紙の修正・取り消し不可</p>
                  <p className="text-[#4a3b32]">
                    한 번 우체통에 넣은 편지는 다시 꺼낼 수 없듯이, 발송이 완료된 편지는 어떠한 경우에도 <b>내용 수정이나 전송 취소가 불가능</b>합니다. 전송 버튼을 누르기 전, 신중하게 마음을 담아 확인해주세요.
                  </p>
                  <p className="text-[#5c4d44] ml-4 mt-3">
                    一度ポストに入れた手紙は取り出せないように、送信が完了した手紙は、いかなる場合でも<b>内容の修正や送信の取り消しを行うことは一切できません</b>。送信ボタンを押す前に、心を込めて慎重にご確認ください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제6조 (요금 및 결제) / 第6条（料金と決済）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">유료 서비스의 이용 요금, 결제 방법 등은 별도로 본 서비스 상에 정합니다.</p>
                  <p className="text-[#5c4d44] ml-4">有料サービスの利用料金、支払い方法等は、別途当サービス上に定めます。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">결제에는 글로벌 결제 플랫폼 'Stripe'를 이용합니다.</p>
                  <p className="text-[#5c4d44] ml-4">決済には、グローバル決済プラットフォーム「Stripe」を利用します。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">한국 내 사용자는 Stripe를 통해 한국 국내 발행 신용카드, 체크카드 및 카카오페이(Kakao Pay)를 이용할 수 있습니다.</p>
                  <p className="text-[#5c4d44] ml-4">韓国国内からの利用者は、Stripeを介して韓国国内発行のクレジットカードおよびチェックカード、ならびにカカオペイ（Kakao Pay）をご利用いただけます。</p>
                </div>
                
                {/* 💡 背景色や枠線を消してフラット化 */}
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold">구독 요금에 대한 일할 계산 및 환불은 제공되지 않습니다. 서비스 해지 시, 그 즉시 서비스 이용이 종료됩니다.</p>
                  <p className="text-[#5c4d44] ml-4 mt-2 font-bold">サブスクリプション料金の日割り計算および返金は行いません。サービスを解約した時点で、即座にサービスの利用が終了します。</p>
                </div>

                <div>
                  <p className="text-[#4a3b32]">결제 정보의 취급 및 오류에 대해서는 Stripe의 약관에 따릅니다.</p>
                  <p className="text-[#5c4d44] ml-4">決済情報の取り扱いやエラーについては、Stripeの規約に準じます。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제7조 (금지 사항) / 第7조（禁止事項）</h3>
              <div className="space-y-4 mt-3">
                <p className="text-[#4a3b32]">사용자는 다음의 행위를 해서는 안 됩니다.</p>
                <p className="text-[#5c4d44] mb-2">ユーザーは、以下の行為を行ってはなりません。</p>
                
                {/* 💡 左側の線(pl-4 border-l-2...)や赤いボックスなどの装飾を全て削除してフラット化 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[#4a3b32]">다른 사용자, 본 서비스, 제3자의 명예나 신용을 훼손하는 행위, 비방, 괴롭힘 행위.</p>
                    <p className="text-[#5c4d44]">他のユーザー、当サービス、第三者の名誉・信用を毀損する行為、誹謗中傷、嫌がらせ行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">음란하거나 공서양속에 반하는 내용의 게시, 메시지 전송.</p>
                    <p className="text-[#5c4d44]">わいせつ、公序良俗に反する内容の投稿、メッセージ送信。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">상업적 목적, 정치·종교 활동, 권유 행위.</p>
                    <p className="text-[#5c4d44]">商業目的、政治・宗教活動、勧誘行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">자신 또는 제3자의 개인정보를 과도하게 공개하거나 타인의 개인정보를 수집하는 행위.</p>
                    <p className="text-[#5c4d44]">自己または第三者の個人情報を過度に公開、または他者の個人情報を収集する行為。</p>
                  </div>
                  <div>
                    <p className="text-red-800 font-bold">이메일, 카카오톡, LINE 등 외부 연락처를 교환하거나 기재하여 본 서비스 외부로 유도하는 행위.</p>
                    <p className="text-red-700 font-bold mt-1">メールアドレス、カカオトーク、LINE等の外部連絡先を交換・記載し、当サービス外へ誘導（引き抜き）する行為。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">본 서비스 시스템에 대한 공격, 부정 접속.</p>
                    <p className="text-[#5c4d44]">当サービスのシステムへの攻撃、不正アクセス。</p>
                  </div>
                  <div>
                    <p className="text-[#4a3b32]">기타 본 서비스가 부적절하다고 판단하는 행위.</p>
                    <p className="text-[#5c4d44]">その他、当サービスが不適切と判断する行為。</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-[#4a3b32] font-bold text-sm">※ 위 금지 사항(특히 외부 연락처 교환)을 위반할 경우, 사전 경고 없이 계정이 영구 정지 및 삭제될 수 있습니다.</p>
                  <p className="text-[#5c4d44] font-bold text-sm mt-1">※ 上記の禁止事項（特に外部連絡先の交換）に違反した場合、事前の警告なしにアカウントが永久停止・削除される場合があります。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제8조 (지적 재산권) / 第8조（知的財産権）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">사용자가 본 서비스에 게시한 내용의 저작권은 사용자에게 귀속됩니다. 단, 사용자는 본 서비스에 대해 서비스 제공·광고 등의 목적을 위해 무상 및 무기한으로 게시 내용을 전 세계적으로 이용(복제, 번역, 공중송신 등)할 수 있는 권리를 허락하는 것으로 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザーが当サービス上に投稿した内容の著作権は、ユーザーに帰属します。ただし、ユーザーは当サービスに対し、サービスの提供・広告等の目的のために、無償かつ無期限で、投稿内容を世界的範囲で利用（複製、翻訳、公衆送信等）する権利を許諾するものとします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">본 서비스와 관련된 지적 재산권(디자인, 텍스트, 코드 등)은 모두 본 서비스에 귀속됩니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスに関する知的財産権（デザイン、テキスト、コード等）は、すべて当サービスに帰属します。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제9조 (면책 조항) / 第9조（免責事項）</h3>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-[#4a3b32]">본 서비스는 정보의 정확성, 특정 목적에의 적합성, 안전성에 대해 어떠한 보증도 하지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">当サービスは、情報の正確性、特定の目的への適合性、安全性について一切の保証を行いません。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">사용자 간의 분쟁에 대해 본 서비스는 일절 관여하지 않으며, 사용자 자신의 책임과 비용으로 해결해야 합니다.</p>
                  <p className="text-[#5c4d44] ml-4">ユーザー間のトラブルについて、当サービスは一切関与せず、ユーザー自身の責任と費用で解決するものとします。</p>
                </div>
                <div>
                  <p className="text-[#4a3b32]">통신 오류, Stripe 결제 시스템의 장애, 기타 본 서비스의 과실에 의하지 않은 사유로 인해 발생한 손해에 대해 본 서비스는 책임을 지지 않습니다.</p>
                  <p className="text-[#5c4d44] ml-4">通信エラー、Stripe決済システムの障害、その他当サービスの過失によらない事由によって生じた損害について、当サービスは責任を負いません。</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-[#4a3b32] mb-3 border-b-2 border-[#f4efe8] inline-block pb-1">제10조 (서비스의 중단 및 종료) / 第10条（サービスの中断・終了）</h3>
              <div className="space-y-2 mt-3">
                <p className="text-[#4a3b32]">본 서비스는 유지보수, 시스템 장애, 천재지변, 기타 사유로 인해 사용자에게 통지하지 않고 서비스의 일부 또는 전부를 중단하거나 종료할 수 있습니다.</p>
                <p className="text-[#5c4d44]">当サービスは、メンテナンス、システム障害、天災地変、その他の事由により、ユーザーに通知することなく、サービスの一部または全部を中断、または終了させることができるものとします。</p>
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