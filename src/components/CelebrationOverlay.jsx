function CelebrationOverlay() {
  return (
    <div className="celebration-overlay" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} className="confetti" style={{ animationDelay: `${index * 0.05}s` }} />
      ))}
      <div className="celebration-message">¡Excelente!</div>
    </div>
  );
}

export default CelebrationOverlay;
