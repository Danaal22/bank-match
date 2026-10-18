import type { BankProduct } from '@workspace/api-client-react';

export function VerifiedProductFacts({ product }: { product: BankProduct }) {
  if (!product.review) return <p className="hint">لم تُراجع معلومات هذا المنتج معلومةً بمعلومة بعد؛ راجع المصادر وشروط البنك.</p>;
  return <details className="method-panel" data-testid="verified-product-facts">
    <summary>مرجع كل معلومة وتاريخ التحقق منها</summary>
    {product.review.facts.map((fact, i) => <div key={`${fact.field}-${i}`} style={{ marginTop: 18 }}>
      <strong>{fact.field}</strong><p style={{ margin: '6px 0' }}>{fact.value}</p>
      <a className="text-link" href={fact.sourceUrl} target="_blank" rel="noreferrer">المصدر الرسمي</a>
      <span className="hint"> — تحقق {new Date(fact.verifiedAt).toLocaleDateString('ar-KW')}</span>
    </div>)}
  </details>;
}
