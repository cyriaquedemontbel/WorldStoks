import React from 'react';

type Props = {
  children: React.ReactNode;
};

const PageContainer: React.FC<Props> = ({ children }) => {
  return (
    <main className="page-container">
      <div className="page-inner">{children}</div>
    </main>
  );
};

export default PageContainer;
