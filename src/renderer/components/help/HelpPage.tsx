import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import helpContent from '../../content/help.md?raw';

export function HelpPage() {
  return (
    <div className="help-page">
      <div className="help-page__content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {helpContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
