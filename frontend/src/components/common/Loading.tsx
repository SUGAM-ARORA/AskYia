const Loading = ({ label = "Loading..." }: { label?: string }) => (
  <div style={{ padding: 12, opacity: 0.7 }}>{label}</div>
);

export default Loading;
