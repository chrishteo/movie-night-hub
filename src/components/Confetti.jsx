const COLORS = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fa0']

export default function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        >
          <div
            className="w-3 h-3"
            style={{
              backgroundColor: COLORS[i % COLORS.length],
              transform: `rotate(${Math.random() * 360}deg)`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0'
            }}
          />
        </div>
      ))}
    </div>
  )
}
