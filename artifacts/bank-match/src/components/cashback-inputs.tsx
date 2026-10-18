import type { QuizAnswers, CashbackCategory } from '@workspace/api-client-react';

const categories: { id: CashbackCategory; label: string }[] = [
  { id: 'groceries', label: 'جمعيات وسوبرماركت' },
  { id: 'dining', label: 'مطاعم ومقاهٍ مباشرة (دون التوصيل)' },
  { id: 'health', label: 'مستشفيات وعيادات' },
  { id: 'utilities', label: 'فواتير مرافق: كهرباء وماء' },
  { id: 'streaming', label: 'اشتراكات بث تدفعها للمزود مباشرة' },
  { id: 'delivery', label: 'تطبيقات توصيل الطعام فقط' },
  { id: 'fuel', label: 'محطات الوقود' },
  { id: 'onlineFashion', label: 'ملابس وأحذية عبر الإنترنت' },
];

export function cashbackInputError(a: QuizAnswers) {
  if (!a.cashbackSpending) return '';
  const amounts = Object.values(a.cashbackSpending);
  if (amounts.some((n) => !Number.isFinite(n) || (n ?? 0) < 0)) return 'راجع مبالغ الفئات؛ يجب أن تكون أرقامًا غير سالبة.';
  const total = Math.round(amounts.reduce((s, n) => s + (n ?? 0), 0) * 1000) / 1000;
  return total > a.monthlySpendKwd ? 'مجموع فئات الكاش باك لا يمكن أن يتجاوز إجمالي إنفاقك؛ لا تكرر المعاملة في أكثر من فئة.' : '';
}

export function CashbackInputs({ answers, patch }: { answers: QuizAnswers; patch: (p: Partial<QuizAnswers>) => void }) {
  return <details className="method-panel" style={{ marginTop: 24 }} data-testid="cashback-spending">
    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>تفصيل المصاريف لتقدير الكاش باك — اختياري</summary>
    <p>أدخل أجزاء من إجمالي مصروفاتك، لا مبالغ إضافية. اجعل الفئات منفصلة دون تكرار. هذا سيناريو تحويل الإنفاق إلى مشتريات على بطاقة واحدة مع السداد الكامل. نقدر العائد فقط للفئات المدخلة والتجار المؤهلين، لا لكل مصروفاتك.</p>
    {categories.map(({ id, label }) => <div className="field" key={id}>
      <label className="field-label" htmlFor={`cashback-${id}`}>{label}</label>
      <div className="input-wrap"><input id={`cashback-${id}`} type="number" inputMode="decimal" min="0" step="0.001" max={answers.monthlySpendKwd} value={answers.cashbackSpending?.[id] ?? ''} onChange={(e) => {
        const next = { ...answers.cashbackSpending };
        if (e.target.value === '') delete next[id];
        else next[id] = Number(e.target.value);
        patch({ cashbackSpending: Object.keys(next).length ? next : undefined });
      }} data-testid={`input-cashback-${id}`} /><span className="input-unit">د.ك / شهر</span></div>
    </div>)}
    <button className="btn" type="button" onClick={() => patch({ cashbackSpending: undefined })} data-testid="button-clear-cashback">لا أعرف تفاصيل المصاريف</button>
  </details>;
}
