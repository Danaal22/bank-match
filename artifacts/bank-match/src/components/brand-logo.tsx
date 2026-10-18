export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="شعار بانك ماتش">
      <rect x="2" y="9" width="27" height="30" rx="9" fill="#14243f" />
      <rect x="19" y="9" width="27" height="30" rx="9" fill="none" stroke="#2b7a58" strokeWidth="4" />
      <path d="M17 24.5l5 5 9-10" fill="none" stroke="#f8f4ea" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="39" cy="9" r="3.5" fill="#c98a35" />
    </svg>
  );
}

export function BrandLogo() {
  return (<><BrandMark /><span>بانك ماتش</span></>);
}
