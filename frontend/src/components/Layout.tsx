import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <main className="app-shell">
      <header className="site-header">
        <div>
          <h1>排盘 MVP</h1>
          <p>六壬 / 六爻结构化排盘工具</p>
        </div>
        <a className="header-link" href="https://github.com/DIYUWEIHUANG/paipan-mvp" target="_blank" rel="noreferrer">
          GitHub · v0.1.0
        </a>
      </header>
      <div className="app-grid">{children}</div>
    </main>
  );
}
