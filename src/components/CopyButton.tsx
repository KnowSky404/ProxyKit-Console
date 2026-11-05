import { useState } from 'react';
export function CopyButton({
  text,
  children,
  disabled = false,
}: {
  text: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback('Copied');
    } catch {
      setFeedback('Copy failed. Select and copy the text manually.');
    }
  }
  return (
    <span className="copy-control">
      <button
        type="button"
        className="primary"
        disabled={disabled}
        onClick={copy}
      >
        {children}
      </button>
      <span role="status" className="copy-feedback">
        {feedback}
      </span>
    </span>
  );
}
