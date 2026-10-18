import { useEffect, useRef, useState } from 'react';
import { useGetBankRecommendations, useHealthCheck, useListBankProducts } from '@workspace/api-client-react';
import type { QuizAnswers, RecommendationResponse } from '@workspace/api-client-react';
import { ArrowLeft, BadgeCheck, CircleHelp, Compass, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { ChoiceVisual } from '@/components/choice-visual';
import { MatchCard, currency } from '@/components/match-card';
import { QuizWizard } from '@/components/quiz-wizard';

const initialAnswers: QuizAnswers = {
  job: 'employee',
  monthlySpendKwd: 600,
  internationalMonthlySpendKwd: 100,
  tripsPerYear: 2,
  bankPreference: 'any',
  priorities: ['low_fees', 'travel'],
  productPreference: 'any',
};

const unknown = 'غير متاح';
type SavedQuiz = { answers: QuizAnswers; response: RecommendationResponse };
function readSavedQuiz(): SavedQuiz | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem('bank-match-quiz') ?? 'null') as SavedQuiz | null;
    return saved && Array.isArray(saved.answers?.priorities) && Array.isArray(saved.response?.recommendations) ? saved : null;
  } catch { return null; }
}

export default function HomePage() {
  const [saved, setSaved] = useState<SavedQuiz | null>(readSavedQuiz);
  const [answers, setAnswers] = useState<QuizAnswers>(() => readSavedQuiz()?.answers ?? initialAnswers);
  const [validationError, setValidationError] = useState('');
  const [travelMode, setTravelMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const resultRef = useRef<HTMLElement>(null);
  const recommendationMutation = useGetBankRecommendations();
  const health = useHealthCheck();
  const products = useListBankProducts();
  const response = recommendationMutation.data ?? saved?.response;
  const recs = response?.recommendations ?? [];
  const selected = recs.filter((item) => selectedIds.includes(item.product.id));

  const patchAnswers = (patch: Partial<QuizAnswers>) => setAnswers((current) => ({ ...current, ...patch }));
  useEffect(() => {
    document.title = 'Bank Match — قارن حسابات وبطاقات الكويت';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'اختبار شخصي لمقارنة الحسابات والبطاقات البنكية في الكويت مع رسوم موثقة وأسباب مطابقة واضحة.');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', 'قارن حسابات وبطاقات الكويت وفق احتياجاتك ومصاريفك، مع توضيح المعلومات غير المتاحة.');
  }, []);
  const requestMatches = (nextAnswers: QuizAnswers) => {
    if (nextAnswers.internationalMonthlySpendKwd > nextAnswers.monthlySpendKwd) {
      setValidationError('الإنفاق الدولي جزء من إجمالي الإنفاق الشهري، ويجب ألا يتجاوزه.');
      return;
    }
    setValidationError('');
    setAnswers(nextAnswers);
    recommendationMutation.mutate({ data: nextAnswers }, {
      onSuccess: (result) => {
        const nextSaved = { answers: nextAnswers, response: result };
        setSaved(nextSaved);
        setSelectedIds([]);
        try {
          window.sessionStorage.setItem('bank-match-quiz', JSON.stringify(nextSaved));
          window.sessionStorage.setItem('bank-match-fit-reasons', JSON.stringify(result.recommendations.map((item) => ({ id: item.product.id, reasons: item.reasons, text: item.recommendationText }))));
        } catch { /* Browsing can continue if storage is unavailable. */ }
        window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      },
    });
  };
  const toggleTravel = () => {
    const next = !travelMode;
    setTravelMode(next);
    setAnswers((current) => ({
      ...current,
      job: next ? 'traveler' : 'employee',
      tripsPerYear: next ? Math.max(current.tripsPerYear, 4) : 2,
      internationalMonthlySpendKwd: Math.min(current.monthlySpendKwd, current.internationalMonthlySpendKwd),
      priorities: next
        ? Array.from(new Set([...current.priorities, 'travel' as const]))
        : current.priorities.filter((priority) => priority !== 'travel'),
    }));
  };
  const toggleCompare = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  return (
    <div className="app-shell">
      <SiteHeader variant="home" />
      <main className="page-wrap" dir="rtl">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">مقارنة بنكية للكويت</span>
            <h1>بنك يناسب حياتك،<br />مو العكس.</h1>
            <p>اكتشف الحساب أو البطاقة الأنسب لك بناءً على مصروفاتك واحتياجاتك، وقارن الرسوم والمميزات بكل وضوح.</p>
            <a className="hero-cta" href="#quiz" data-testid="button-hero-cta">اكتشف خيارك المناسب <ArrowLeft size={20} /></a>
          </div>
          <div className="hero-visual"><ChoiceVisual /></div>
        </section>

        <div className="content-grid" id="quiz">
          <div>
            <QuizWizard answers={answers} patch={patchAnswers} travelMode={travelMode} onToggleTravel={toggleTravel} onSubmit={requestMatches} pending={recommendationMutation.isPending} failed={recommendationMutation.isError} />
            {validationError && <div className="form-error" role="alert">{validationError}</div>}
          </div>
          <aside className="panel aside-panel" dir="rtl">
            <div className="aside-icon"><ShieldCheck size={24} /></div>
            <h3>قرارك يبدأ بمعلومة واضحة</h3>
            <p>نرتّب المنتجات وفق احتياجك ونوضح لك ما نعرفه وما لم نتمكن من التحقق منه.</p>
            <ul className="trust-list">
              <li><BadgeCheck size={18} />نعرض بيانات المنتجات ومصادرها وتاريخ آخر تحقق.</li>
              <li><CircleHelp size={18} />الرسوم أو المزايا غير المتاحة تظهر بوضوح كغير متاحة.</li>
              <li><Compass size={18} />قارن الاستخدام الدولي والإنفاق المتوقع قبل الاختيار.</li>
            </ul>
            <div className="legal-note">التوصيات إرشادية فقط ولا تُعد نصيحة مالية. تحقّق من الشروط والرسوم النهائية مباشرةً مع البنك قبل التقديم.</div>
            <div className="status-line" style={{ marginTop: 16 }} data-testid="status-service">
              {health.isLoading ? 'نتحقق من حالة الخدمة' : health.isError ? 'الخدمة قد تكون غير متاحة مؤقتاً' : `المنتجات المسجلة: ${products.data?.length ?? '—'}`}
            </div>
          </aside>
        </div>

        {recommendationMutation.isPending && <section className="panel loading-card results" aria-live="polite" data-testid="status-loading"><div className="loading-mark" /><strong>نبحث عن المنتجات الأقرب لاحتياجك</strong><p>نعالج تفضيلاتك ونراجع المعلومات المتاحة.</p></section>}

        {response && <section className="results" ref={resultRef} aria-live="polite" data-testid="section-results">
          <div className="results-heading">
            <div><span className="eyebrow">النتائج حسب إجاباتك</span><h2>خيارات تستحق المقارنة</h2><p>الترتيب يعكس ملاءمة المنتج لإجاباتك، وليس ضماناً للقبول أو التوفير.</p></div>
            <span className="source-pill">مصدر التفسير: {response.explanationSource === 'openrouter' ? 'تحليل ذكي' : 'قواعد المطابقة'}</span>
          </div>
          {recs.length === 0 ? <div className="panel empty-card" data-testid="status-empty"><Sparkles size={28} /><h3>ما لقينا خيارات مطابقة حالياً</h3><p>جرّب تعديل تفضيلاتك أو نوع المنتج وأعد البحث.</p><button className="btn" type="button" onClick={() => requestMatches({ ...answers, bankPreference: 'any', productPreference: 'any' })} data-testid="button-retry-broad">جرّب كل الخيارات</button></div> :
            <>
              {recs.slice(0, 3).map((item, index) => <MatchCard key={item.product.id} recommendation={item} index={index} selected={selectedIds.includes(item.product.id)} onToggle={toggleCompare} />)}
              {selected.length > 0 && <section className="panel compare-panel" dir="rtl" data-testid="section-compare">
                <h3>مقارنة على طريقة سفرك</h3><p>الأرقام المعروفة مبنية على بيانات المصدر؛ المعلومات الناقصة لا تُحسب كأنها صفر.</p>
                <div className="compare-scroll"><table className="compare-table">
                  <thead><tr><th>المنتج</th>{selected.map((item) => <th key={item.product.id}>{item.product.bankNameAr}<br />{item.product.productNameAr}</th>)}</tr></thead>
                  <tbody>
                    <tr><td>الجزء المعلوم من الرسوم السنوية</td>{selected.map((item) => <td key={item.product.id}>{item.product.annualFeeKwd === null && item.annualCost.knownNetAnnualCostKwd === 0 ? 'غير متاح' : currency(item.annualCost.knownNetAnnualCostKwd)}{!item.annualCost.complete && ' — غير مكتمل'}</td>)}</tr>
                    <tr><td>رسوم المعاملات الأجنبية</td>{selected.map((item) => <td key={item.product.id} className={item.product.foreignTransactionFeePercent === null ? 'unknown' : ''}>{item.product.foreignTransactionFeePercent === null ? unknown : `${item.product.foreignTransactionFeePercent}٪`}</td>)}</tr>
                    <tr><td>الاسترداد النقدي</td>{selected.map((item) => <td key={item.product.id} className={item.product.cashbackPercent === null ? 'unknown' : ''}>{item.product.cashbackPercent === null ? unknown : `${item.product.cashbackPercent}٪`}</td>)}</tr>
                    <tr><td>مزايا السفر الموثقة</td>{selected.map((item) => <td key={item.product.id}>{item.product.features.filter((feature) => /سفر|مطار|عملات|أجنبية|قاعة|قاعات|زيارة|زيارات|تأمين/.test(feature)).join(' • ') || 'غير متاحة حاليًا'}</td>)}</tr>
                    <tr><td>اكتمال حساب التكلفة</td>{selected.map((item) => <td key={item.product.id} className={!item.annualCost.complete ? 'unknown' : ''}>{item.annualCost.complete ? 'مكتمل' : 'بيانات ناقصة'}</td>)}</tr>
                  </tbody>
                </table></div>
              </section>}
              <div className="method-panel"><strong>كيف نقرأ هذه النتائج؟</strong><p>{response.methodology}</p></div>
            </>}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0 35px' }}>
            <button className="btn" type="button" onClick={() => { setSelectedIds([]); setSaved(null); recommendationMutation.reset(); try { sessionStorage.removeItem('bank-match-quiz'); } catch {} window.scrollTo({ top: 0, behavior: 'smooth' }); }} data-testid="button-start-over"><RotateCcw size={18} /> عدّل إجاباتك</button>
          </div>
        </section>}
      </main>
      <footer className="footer" dir="rtl"><span><strong>بانك ماتش</strong> · أدوات تساعدك على المقارنة بوضوح.</span><span>الإرشاد لا يغني عن مراجعة الشروط مع البنك.</span></footer>
    </div>
  );
}
