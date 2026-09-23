export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}
