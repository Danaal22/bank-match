import { useState, type KeyboardEvent } from 'react';
import type { QuizAnswers } from '@workspace/api-client-react';
import { ArrowRight, ArrowLeft, Check, Plane } from 'lucide-react';

type Props = {
  answers: QuizAnswers;
  patch: (p: Partial<QuizAnswers>) => void;
  travelMode: boolean;
  onToggleTravel: () => void;
  onSubmit: (a: QuizAnswers) => void;
  pending: boolean;
  failed: boolean;
};

const stepTitles = ['وضعك', 'إنفاقك', 'تفضيلاتك', 'أولوياتك'];
const jobs = [
  { value: 'employee', label: 'موظف', d: 'دخل شهري ثابت' },
  { value: 'student', label: 'طالب', d: 'مصروف محدود ومتطلبات بسيطة' },
  { value: 'traveler', label: 'كثير السفر', d: 'استخدام متكرر خارج الكويت' },
] as const;
const banks = [
  { value: 'any', label: 'ما عندي تفضيل', d: 'اعرض كل الخيارات' },
  { value: 'islamic', label: 'إسلامي', d: 'منتجات الصيرفة الإسلامية' },
  { value: 'conventional', label: 'تقليدي', d: 'منتجات الصيرفة التقليدية' },
] as const;
const priorityOptions: { value: QuizAnswers['priorities'][number]; label: string }[] = [
  { value: 'cashback', label: 'استرداد نقدي' }, { value: 'travel', label: 'السفر' },
  { value: 'low_fees', label: 'رسوم أقل' }, { value: 'sharia', label: 'توافق شرعي' },
  { value: 'account', label: 'حساب' }, { value: 'card', label: 'بطاقة' },
];

function validate(step: number, a: QuizAnswers): string {
  if (step === 2) {
    if (![a.monthlySpendKwd, a.internationalMonthlySpendKwd, a.tripsPerYear].every(Number.isFinite)) return 'أدخل أرقامًا صحيحة في جميع الحقول.';
    if (a.monthlySpendKwd < 0 || a.internationalMonthlySpendKwd < 0) return 'يجب ألا تكون المبالغ أقل من صفر.';
    if (a.internationalMonthlySpendKwd > a.monthlySpendKwd) return 'الإنفاق الدولي جزء من إجمالي الإنفاق الشهري، ويجب ألا يتجاوزه.';
    if (a.tripsPerYear < 0 || a.tripsPerYear > 30) return 'عدد الرحلات يجب أن يكون بين 0 و30.';
  }
  if (step === 4 && a.priorities.length === 0) return 'اختر أولوية واحدة على الأقل لنرتّب لك الخيارات.';
  return '';
}

export function QuizWizard({ answers, patch, travelMode, onToggleTravel, onSubmit, pending, failed }: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const total = stepTitles.length;

  const next = () => {
    const e = validate(step, answers);
    setError(e);
    if (!e && step < total) setStep(step + 1);
  };
  const back = () => { setError(''); setStep((s) => Math.max(1, s - 1)); };
  const finish = () => {
    for (let s = 1; s <= total; s++) {
      const e = validate(s, answers);
      if (e) { setStep(s); setError(e); return; }
    }
    setError('');
    onSubmit(answers);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON') return;
    event.preventDefault();
    if (step < total) next();
  };
  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <form className="panel wizard" dir="rtl" noValidate onSubmit={(e) => e.preventDefault()} onKeyDown={onKeyDown} data-testid="form-bank-quiz">
      <div className="wizard-top">
        <ol className="wizard-steps" aria-label="خطوات الاختبار">
          {stepTitles.map((title, i) => {
            const n = i + 1;
            return (
              <li key={title} className={n === step ? 'on' : n < step ? 'done' : ''} aria-current={n === step ? 'step' : undefined} data-testid={`wizard-step-${n}`}>
                <span className="n">{n < step ? <Check size={16} /> : n}</span><span className="t">{title}</span>
              </li>
            );
          })}
        </ol>
        <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`الخطوة ${step} من ${total}`} data-testid="wizard-progress">
          <div className="progress-bar" style={{ transform: `scaleX(${step / total})` }} />
        </div>
      </div>

      {step === 1 && <div>
        <h2>أقرب وصف لوضعك</h2><p className="sub">إجاباتك تساعدنا نرتّب الخيارات، وما نشاركها مع أي بنك.</p>
        <div className="choice-grid" role="group" aria-label="وضعك">
          {jobs.map((o) => { const on = answers.job === o.value; return (
            <button type="button" key={o.value} className={`choice-card ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => patch({ job: o.value })} data-testid={`button-job-${o.value}`}>
              {on && <span className="tick"><Check size={14} /></span>}<b>{o.label}</b><span>{o.d}</span>
            </button>); })}
        </div>
        <div className="travel-switch">
          <Plane size={24} />
          <div><strong>وضع مقارنة السفر</strong><small>أبرز رسوم الاستخدام الدولي وملاءمة السفر</small></div>
          <button type="button" className={`toggle ${travelMode ? 'on' : ''}`} aria-pressed={travelMode} aria-label="تفعيل وضع مقارنة السفر" onClick={onToggleTravel} data-testid="toggle-travel-mode"><i /></button>
        </div>
      </div>}

      {step === 2 && <div>
        <h2>كم تنفق تقريبًا؟</h2><p className="sub">أرقام تقريبية تكفي، والإنفاق الدولي جزء من الإجمالي وليس مبلغًا إضافيًا.</p>
        <div className="field">
          <label className="field-label" htmlFor="spend">إجمالي إنفاقك الشهري</label>
          <div className="input-wrap"><input id="spend" type="number" inputMode="decimal" min="0" step="25" value={answers.monthlySpendKwd} onChange={(e) => patch({ monthlySpendKwd: num(e.target.value) })} data-testid="input-monthly-spend" /><span className="input-unit">د.ك / شهر</span></div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="intl">منه: الإنفاق خارج الكويت</label>
          <div className="input-wrap"><input id="intl" type="number" inputMode="decimal" min="0" step="25" value={answers.internationalMonthlySpendKwd} onChange={(e) => patch({ internationalMonthlySpendKwd: num(e.target.value) })} data-testid="input-international-spend" /><span className="input-unit">د.ك / شهر</span></div>
          <small className="hint">يجب ألا يزيد عن إجمالي الإنفاق أعلاه.</small>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="trips">كم رحلة خارجية تخطط لها بالسنة؟</label>
          <div className="input-wrap"><input id="trips" type="number" inputMode="numeric" min="0" max="30" value={answers.tripsPerYear} onChange={(e) => patch({ tripsPerYear: Math.min(30, Math.max(0, num(e.target.value))) })} data-testid="input-trips-per-year" /><span className="input-unit">رحلة</span></div>
        </div>
      </div>}

      {step === 3 && <div>
        <h2>ما الذي تفضّله؟</h2><p className="sub">اختر نوع الصيرفة ونوع المنتج.</p>
        <div className="field">
          <span className="field-label">تفضيلك للمعاملات المصرفية</span>
          <div className="choice-grid" role="group" aria-label="تفضيل المعاملات المصرفية">
            {banks.map((o) => { const on = answers.bankPreference === o.value; return (
              <button type="button" key={o.value} className={`choice-card ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => patch({ bankPreference: o.value })} data-testid={`button-bank-${o.value}`}>
                {on && <span className="tick"><Check size={14} /></span>}<b>{o.label}</b><span>{o.d}</span>
              </button>); })}
          </div>
        </div>
        <div className="field">
          <label htmlFor="product-type" className="field-label">وش نوع المنتج اللي تبحث عنه؟</label>
          <select id="product-type" value={answers.productPreference} onChange={(e) => patch({ productPreference: e.target.value as QuizAnswers['productPreference'] })} data-testid="select-product-type">
            <option value="any">بطاقة أو حساب</option><option value="card">بطاقة</option><option value="account">حساب</option>
          </select>
        </div>
      </div>}

      {step === 4 && <div>
        <h2>وش يهمك أكثر؟</h2><p className="sub">اختر أولوية واحدة أو أكثر.</p>
        <div className="choice-grid" role="group" aria-label="الأولويات">
          {priorityOptions.map((o) => { const on = answers.priorities.includes(o.value); return (
            <button type="button" key={o.value} className={`choice-card ${on ? 'active' : ''}`} aria-pressed={on} onClick={() => patch({ priorities: on ? answers.priorities.filter((p) => p !== o.value) : [...answers.priorities, o.value] })} data-testid={`button-priority-${o.value}`}>
              {on && <span className="tick"><Check size={14} /></span>}<b>{o.label}</b>
            </button>); })}
        </div>
      </div>}

      {error && <div className="form-error" role="alert" data-testid="wizard-error">{error}</div>}
      {failed && <div className="form-error" role="alert">تعذر حساب المطابقة. راجع القيم المدخلة واتصالك وحاول مرة أخرى.</div>}

      <div className="wizard-nav">
        {step > 1 ? <button type="button" className="btn" onClick={back} data-testid="wizard-back"><ArrowRight size={20} /> السابق</button> : <span />}
        {step < total
          ? <button type="button" className="btn primary" onClick={next} data-testid="wizard-next">التالي <ArrowLeft size={20} /></button>
          : <button type="button" className="btn primary" onClick={finish} disabled={pending} data-testid="button-find-matches">{pending ? 'نرتّب الخيارات...' : 'اعرض أفضل الخيارات'}{!pending && <ArrowLeft size={20} />}</button>}
      </div>
    </form>
  );
}
