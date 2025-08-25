export default function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <iframe
        src="/unity/index.html"
        tabIndex={0}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
