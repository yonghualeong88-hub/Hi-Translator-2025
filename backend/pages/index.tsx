// 简单的首页，只显示API状态
export default function Home() {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1>🌐 翻译API服务</h1>
      <p>✅ 服务运行正常</p>
      <p>API端点：<code>/api/translate</code></p>
    </div>
  );
}
