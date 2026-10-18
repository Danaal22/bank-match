import { Link } from 'wouter';
import type { Recommendation } from '@workspace/api-client-react';
import { ChevronLeft } from 'lucide-react';

export const currency = (amount: number) => `${amount.toLocaleString('en-US', { maximumFractionDigits: 3 })} د.ك`;
const unknown = 'غير متوفر حاليًا';
export const cashbackSummary = (product: Recommendation['product']) => {
  const program = product.cashbackProgram;
  if (!program) return product.cashbackPercent === null ? unknown : `${product.cashbackPercent}٪ وفق الشروط`;
  const rates = program.tiers.length ? program.tiers.map((t) => t.ratePercent) : program.rules.map((r) => r.ratePercent);
  return `${Math.min(...rates)}–${Math.max(...rates)}٪ للفئات المحسوبة؛ سقف ${program.monthlyCapKwd} د.ك شهريًا`;
};

export function MatchCard({ recommendation, index, selected, onToggle }: {
  recommendation: Recommendation; index: number; selected: boolean; onToggle: (id: string) => void;
}) {
  const { product, annualCost } = recommendation;
  const incomplete = !annualCost.complete;
  const additionalReasons = recommendation.reasons.filter((reason) => !recommendation.recommendationText.includes(reason));
  return (
    <article className={`panel recommendation-card ${index === 0 ? 'first' : ''}`} dir="rtl" data-testid={`card-recommendation-${product.id}`}>
      <div>
        {index === 0 && <span className="rank">الأقرب لاحتياجك</span>}
        <div className="bank-top">
          <span className="bank-badge">{product.bankInitials}</span>
          <div><h3>{product.productNameAr}</h3><p>{product.bankNameAr} · {product.productType === 'card' ? 'بطاقة' : 'حساب'}</p></div>
          <div className="score" data-testid={`text-match-${product.id}`}><b>{recommendation.matchPercent}٪</b><span>مطابقة</span></div>
        </div>
        <p className="recommendation-summary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} data-testid={`text-explanation-${product.id}`}>{recommendation.recommendationText}</p>
        <details className="method-panel" data-testid={`details-match-${product.id}`}>
          <summary style={{ cursor: 'pointer' }}>أسباب الترشيح وتفصيل نسبة التطابق</summary>
          {additionalReasons.length > 0 && <ul className="reason-list">{additionalReasons.map((reason, i) => <li key={`${product.id}-reason-${i}`}>{reason}</li>)}</ul>}
          <ul className="feature-list">{recommendation.scoreBreakdown.map((part) => <li key={part.label}>{part.label}: {part.earned} من {part.weight} نقطة</li>)}</ul>
        </details>
        <p className="hint">الاسترداد: {cashbackSummary(product)}</p>
        <div className="rec-actions">
          <Link href={`/products/${product.id}`} className="text-link" data-testid={`link-product-${product.id}`}>تفاصيل المنتج <ChevronLeft size={18} /></Link>
          <label className="compare-check"><input type="checkbox" checked={selected} onChange={() => onToggle(product.id)} data-testid={`input-compare-${product.id}`} /> أضف للمقارنة</label>
        </div>
      </div>
      <div className={`cost-box ${incomplete ? 'partial' : ''}`}>
        <span className="cost-label">{incomplete ? 'جزء معلوم من التكلفة — وليس الإجمالي' : 'التكلفة الصافية السنوية المقدّرة'}</span>
        <strong className="cost-number" data-testid={`text-net-cost-${product.id}`}>{product.annualFeeKwd === null && annualCost.knownNetAnnualCostKwd === 0 ? 'غير مكتملة' : currency(annualCost.knownNetAnnualCostKwd)}</strong>
        <span className="cost-caption">{incomplete ? `تنقصنا معلومات: ${annualCost.missing.join('، ') || 'بعض الشروط'}` : 'تقدير وفق الرسوم والفئات المعروفة؛ يخضع لشروط البنك'}</span>
        <div className="cost-breakdown"><span>رسوم سنوية</span><b>{product.annualFeeKwd === null ? unknown : currency(annualCost.knownAnnualFeesKwd)}</b></div>
        <div className="cost-breakdown"><span>رسوم معاملات أجنبية</span><b>{annualCost.missing.some((item) => item.startsWith('رسم معاملات')) ? unknown : currency(annualCost.knownAnnualForeignFeesKwd)}</b></div>
        <div className="cost-breakdown"><span>الاسترداد السنوي المقدر</span><b>{annualCost.cashbackEstimated ? currency(annualCost.knownAnnualCashbackKwd) : 'لم يُحتسب'}</b></div>
        <details className="cost-caption" style={{ marginTop: 16 }}><summary style={{ cursor: 'pointer' }}>طريقة الحساب والافتراضات</summary><p>{annualCost.calculationNote}</p><p>{annualCost.cashbackNote}</p></details>
      </div>
    </article>
  );
}
