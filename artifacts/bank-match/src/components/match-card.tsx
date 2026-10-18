import { Link } from 'wouter';
import type { Recommendation } from '@workspace/api-client-react';
import { ChevronLeft } from 'lucide-react';

export const currency = (amount: number) => `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} د.ك`;
const unknown = 'غير متاح';

export function MatchCard({ recommendation, index, selected, onToggle }: {
  recommendation: Recommendation; index: number; selected: boolean; onToggle: (id: string) => void;
}) {
  const { product, annualCost } = recommendation;
  const incomplete = !annualCost.complete;
  return (
    <article className={`panel recommendation-card ${index === 0 ? 'first' : ''}`} dir="rtl" data-testid={`card-recommendation-${product.id}`}>
      <div>
        {index === 0 && <span className="rank">الأقرب لاحتياجك</span>}
        <div className="bank-top">
          <span className="bank-badge">{product.bankInitials}</span>
          <div><h3>{product.productNameAr}</h3><p>{product.bankNameAr} · {product.productType === 'card' ? 'بطاقة' : 'حساب'}</p></div>
          <div className="score" data-testid={`text-match-${product.id}`}><b>{recommendation.matchPercent}٪</b><span>مطابقة</span></div>
        </div>
        <ul className="reason-list">
          {recommendation.reasons.map((reason, i) => <li key={`${product.id}-reason-${i}`}>{reason}</li>)}
        </ul>
        <p className="legal-note">{recommendation.recommendationText}</p>
        <div className="rec-actions">
          <Link href={`/products/${product.id}`} className="text-link" data-testid={`link-product-${product.id}`}>تفاصيل المنتج <ChevronLeft size={18} /></Link>
          <label className="compare-check"><input type="checkbox" checked={selected} onChange={() => onToggle(product.id)} data-testid={`input-compare-${product.id}`} /> أضف للمقارنة</label>
        </div>
      </div>
      <div className={`cost-box ${incomplete ? 'partial' : ''}`}>
        <span className="cost-label">{incomplete ? 'جزء معلوم من الرسوم — وليس الإجمالي' : 'الرسوم السنوية المقدّرة'}</span>
        <strong className="cost-number" data-testid={`text-net-cost-${product.id}`}>{product.annualFeeKwd === null && annualCost.knownNetAnnualCostKwd === 0 ? 'غير مكتملة' : currency(annualCost.knownNetAnnualCostKwd)}</strong>
        <span className="cost-caption">{incomplete ? `تنقصنا معلومات: ${annualCost.missing.join('، ') || 'بعض الشروط'}` : 'المعلومات المعروفة مكتملة'}<br />{annualCost.calculationNote}</span>
        <div className="cost-breakdown"><span>رسوم سنوية</span><b>{product.annualFeeKwd === null ? unknown : currency(annualCost.knownAnnualFeesKwd)}</b></div>
        <div className="cost-breakdown"><span>رسوم معاملات أجنبية</span><b>{annualCost.missing.some((item) => item.startsWith('رسم معاملات')) ? unknown : currency(annualCost.knownAnnualForeignFeesKwd)}</b></div>
        <div className="cost-breakdown"><span>الكاش باك المخصوم</span><b>لم يُحتسب</b></div>
      </div>
    </article>
  );
}
