import { Link } from 'wouter';
import type { Recommendation } from '@workspace/api-client-react';
import { ChevronLeft } from 'lucide-react';

export const currency = (amount: number) => `${amount.toLocaleString('en-US', { maximumFractionDigits: 3 })} د.ك`;
export const RESULT_REVISION = 'eligibility-primary-priority-2026-10-19';
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
  const incomplete = !annualCost.feesComplete;
  const additionalReasons = recommendation.reasons.filter((reason) => !recommendation.recommendationText.includes(reason));
  return (
    <article className={`panel recommendation-card ${index === 0 ? 'first' : ''}`} dir="rtl" data-testid={`card-recommendation-${product.id}`}>
      <div>
        {index === 0 && <span className="rank">{annualCost.feesComplete ? 'الأول حسب أولوياتك' : 'خيار بتكلفة غير مكتملة'}</span>}
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
          <p className="hint">التحقق من شروط الأهلية المنشورة:</p>
          <ul className="feature-list">{recommendation.eligibilityCheck.notes.map((note, i) => <li key={`eligibility-${i}`}>{note}</li>)}</ul>
        </details>
        <p className="hint">الأهلية: {recommendation.eligibilityCheck.summary}</p>
        <p className="hint">الاسترداد: {cashbackSummary(product)}</p>
        <p className="hint">آخر تحقق: {product.lastVerified ? new Date(product.lastVerified).toLocaleDateString('ar-KW') : unknown}</p>
        <div className="rec-actions">
          <Link href={`/products/${product.id}`} className="text-link" data-testid={`link-product-${product.id}`}>تفاصيل المنتج <ChevronLeft size={18} /></Link>
          <label className="compare-check"><input type="checkbox" checked={selected} onChange={() => onToggle(product.id)} data-testid={`input-compare-${product.id}`} /> أضف للمقارنة</label>
        </div>
      </div>
      <div className={`cost-box ${incomplete ? 'partial' : ''}`}>
        <span className="cost-label">{incomplete ? 'جزء معلوم من التكلفة — وليس الإجمالي' : annualCost.cashbackDeducted ? 'التكلفة الصافية السنوية المقدّرة' : 'التكلفة السنوية المقدّرة قبل المكافآت'}</span>
        <strong className="cost-number" data-testid={`text-net-cost-${product.id}`}>{incomplete ? 'تقدير جزئي' : currency(annualCost.knownNetAnnualCostKwd)}</strong>
        {incomplete && annualCost.knownNetAnnualCostKwd !== 0 && <span className="cost-caption">صافي الأجزاء المعلومة فقط: {currency(annualCost.knownNetAnnualCostKwd)} — وليس التكلفة النهائية.</span>}
        <span className="cost-caption">{annualCost.summary}</span>
        {incomplete && <span className="cost-caption">المعلومة الناقصة: {annualCost.missing.join('، ')}</span>}
        <div className="cost-breakdown"><span>رسوم سنوية</span><b>{product.annualFeeKwd === null ? unknown : currency(annualCost.knownAnnualFeesKwd)}</b></div>
        <div className="cost-breakdown"><span>رسوم معاملات أجنبية</span><b>{product.productType === 'account' ? 'غير مشمولة' : annualCost.missing.some((item) => item.startsWith('رسم معاملات') || item.startsWith('تكلفة عملة')) ? unknown : currency(annualCost.knownAnnualForeignFeesKwd)}</b></div>
        {product.category.includes('مسبقة') && <div className="cost-breakdown"><span>التعبئة المدفوعة سنويًا</span><b>{annualCost.missing.some((item) => item.startsWith('رسم إعادة')) ? unknown : currency(annualCost.knownAnnualOtherFeesKwd)}</b></div>}
        <div className="cost-breakdown"><span>العائد السنوي المكتسب المقدر</span><b>{annualCost.cashbackEstimated ? currency(annualCost.knownAnnualCashbackKwd) : 'لم يُحتسب'}</b></div>
        {annualCost.cashbackEstimated && !annualCost.cashbackDeducted && <p className="cost-caption">لم نخصم العائد من الرسوم لأن حد استبداله غير متوفر حاليًا.</p>}
        <details className="cost-caption" style={{ marginTop: 16 }}><summary style={{ cursor: 'pointer' }}>طريقة الحساب والافتراضات</summary><p>{annualCost.calculationNote}</p><p>{annualCost.cashbackNote}</p></details>
      </div>
    </article>
  );
}
