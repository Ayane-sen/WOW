// 親コンポーネント(pages/index.tsx)から渡されるプロパティの型を定義
interface UserStatus {
  userId: number;
  currentLevel: number;
  currentExperience: number;
  status: {
    characterImage: string;
    attackPower: number;
    defensePower: number;
    hp: number;
  } | null;
}

interface UserProfileProps {
  userData: UserStatus | null;
  loading: boolean;
  error: string | null;
}

// プロパティとして userData, loading, error を受け取る
export default function UserProfile({ userData, loading, error }: UserProfileProps) {
  // ローディング中の表示
  if (loading) {
    return <p>ステータスを読み込み中...</p>;
  }

  // エラー発生時の表示
  if (error) {
    return <p style={{ color: 'red' }}>エラー: {error}</p>;
  }

  // データが無い場合の表示
  if (!userData) {
    return <p>ユーザーデータが見つかりません。</p>;
  }

  // 4. 正常にデータを表示
  return (
    <div style={{ border: '1px solid gray', padding: '15px', borderRadius: '8px' }}>
      <h3>現在のステータス</h3>
      <p><strong>レベル:</strong> {userData.currentLevel}</p>
      <p><strong>経験値:</strong> {userData.currentExperience}</p>
      {/* statusオブジェクトが存在する場合のみ、詳細ステータスを表示 */}
      {userData.status && (
        <>
          <p><strong>HP:</strong> {userData.status.hp}</p>
          <p><strong>攻撃力:</strong> {userData.status.attackPower}</p>
          <p><strong>守備力:</strong> {userData.status.defensePower}</p>
        </>
      )}
    </div>
  );
}