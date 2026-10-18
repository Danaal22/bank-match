import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useGetBankProduct, getGetBankProductQueryKey } from '@workspace/api-client-react';
import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { cashbackSummary } from '@/components/match-card';

const money = (value: number | null) => value === null ? 'غير متوفر حاليًا' : `${value.toLocaleString('en-US', { maximumFractionDigits: 3 })} د.ك`;
const percent = (value: number | null) => value === null ? 'غير متوفر حاليًا' : `${value}٪`;

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const [savedReasons] = useState<{ id: string; reasons: string[]; text?: string; source?: string }[]>(() => {
    try {
      const quiz = JSON.parse(sessionStorage.getItem('bank-match-quiz') ?? 'null');
      if (quiz?.response?.matchingVersion !== '2') return [];
      const fit = JSON.parse(sessionStorage.getItem('bank-match-fit-reasons') ?? '[]');
      return Array.isArray(fit) ? fit.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.reasons)) : [];
    }
    catch { return []; }
  });
  const reasons = savedReasons.find((item) => item.id === id)?.reasons;
  const { data: product, isLoading, isError, refetch } = useGetBankProduct(id, {
    query: { enabled: !!id, queryKey: getGetBankProductQueryKey(id) },
  });
  useEffect(() => {
    document.title = product ? `${product.productNameAr} — ${product.bankNameAr} | Bank Match` : 'تفاصيل المنتج | Bank Match';
    const description = product ? `تفاصيل ${product.productNameAr} من ${product.bankNameAr}: الرسوم والشروط والمزايا والمصادر الرسمية المتاحة للمقارنة.` : 'تفاصيل المنتج البنكي ومصادر معلوماته.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }, [product]);

  return (
    <div className="app-shell">
      <SiteHeader variant="product" />
      <main className="product-page" dir="rtl">
        <Link href="/" className="back-link" data-testid="link-back-results"><ArrowRight size={18} /> العودة إلى النتائج</Link>
        {isLoading && <div className="panel loading-card" data-testid="status-product-loading"><div className="loading-mark" /><strong>نحمّل معلومات المنتج</strong><p>نتأكد من تفاصيل المنتج والمصادر المتاحة.</p></div>}
        {isError && <div className="panel error-card" role="alert" data-testid="status-product-error"><ShieldCheck size={26} /><h2>تعذر تحميل تفاصيل المنتج</h2><p>قد تكون الخدمة غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.</p><button className="btn" type="button" onClick={() => refetch()} data-testid="button-retry-product">أعد المحاولة</button></div>}
        {!isLoading && !isError && !product && <div className="panel empty-card" data-testid="status-product-empty"><h2>المنتج غير موجود</h2><p>تحقق من الرابط أو ارجع إلى نتائج المطابقة.</p><Link href="/" className="text-link">العودة للرئيسية <ArrowRight size={14} /></Link></div>}
        {product && <>
          <section className="detail-hero" data-testid={`detail-product-${product.id}`}>
            <span className="detail-tag">{product.productType === 'card' ? 'بطاقة بنكية' : 'حساب بنكي'} · {product.category}</span>
            <div className="bank-top" >
              <span className="bank-badge">{product.bankInitials}</span><div><p style={{ margin: 0 }}>{product.bankNameAr}</p></div>
            </div>
            <h1>{product.productNameAr}</h1>
            <p>{product.shariaStatus === 'islamic' ? 'متوافق مع الصيرفة الإسلامية بحسب بيانات المنتج' : product.shariaStatus === 'conventional' ? 'منتج مصرفي تقليدي بحسب بيانات المنتج' : 'حالة التوافق الشرعي غير متاحة'}</p>
          </section>
          <div className="detail-grid">
            <section className="panel detail-section">
              <h2>الرسوم والتكاليف</h2>
              <div className="fact-row"><span>الرسوم السنوية</span><strong className={product.annualFeeKwd === null ? 'unknown' : ''}>{money(product.annualFeeKwd)}</strong></div>
              <div className="fact-row"><span>رسوم المعاملات الأجنبية</span><strong className={product.foreignTransactionFeePercent === null ? 'unknown' : ''}>{percent(product.foreignTransactionFeePercent)}</strong></div>
              <div className="fact-row"><span>الاسترداد النقدي</span><strong className={!product.cashbackProgram && product.cashbackPercent === null ? 'unknown' : ''}>{cashbackSummary(product)}</strong></div>
              <div className="fact-row"><span>الحد الأدنى للرصيد</span><strong className={product.minimumBalanceKwd === null ? 'unknown' : ''}>{money(product.minimumBalanceKwd)}</strong></div>
              {product.cashbackProgram && <details className="method-panel"><summary>الفئات والشرائح وشروط الكاش باك</summary><p>{product.cashbackProgram.conditionsAr}</p></details>}
              <p className="legal-note">{product.feeNotes || 'لم تتوفر ملاحظات إضافية عن الرسوم. تحقّق من جدول الرسوم لدى البنك.'}</p>
            </section>
            <section className="panel detail-section">
              <h2>مزايا المنتج</h2>
              {product.features.length ? <ul className="feature-list">{product.features.map((feature, index) => <li key={`${product.id}-feature-${index}`}>{feature}</li>)}</ul> : <p className="unknown">لم تُسجل مزايا موثقة لهذا المنتج.</p>}
              <div className="fact-row" ><span>الأهلية</span><strong>{product.eligibility || 'غير متاحة'}</strong></div>
            </section>
            <section className="panel detail-section">
              <h2>لماذا قد يناسبك؟</h2>
              {savedReasons.find((item) => item.id === id)?.source === 'openrouter' && <details className="method-panel"><summary>شرح إضافي بالذكاء الاصطناعي</summary><p>{savedReasons.find((item) => item.id === id)?.text}</p></details>}
              {reasons?.length ? <ul className="feature-list">{reasons.map((reason, index) => <li key={`${product.id}-fit-${index}`}>{reason}</li>)}</ul> : <p style={{ margin: 0 }}>تظهر ملاءمة هذا المنتج ضمن المطابقة بناءً على نوعه ومعلوماته المتاحة. طابق مزاياه ورسومه مع إنفاقك واحتياجك، ولا تعتبر النتيجة ضماناً للتوفير أو القبول.</p>}
              <p className="legal-note">التكلفة الفعلية تعتمد على استخدامك وشروط البنك. أي قيمة غير متاحة لم تُفترض صفراً ولم تُقدّر.</p>
            </section>
            <section className="panel detail-section">
              <h2>مصادر وتحقق</h2>
              {product.sources.length ? product.sources.map((source, index) => <a key={`${product.id}-source-${index}`} className="source-link" href={source.url} target="_blank" rel="noreferrer" data-testid={`link-source-${product.id}-${index}`}><span>{source.title}</span><ExternalLink size={14} /></a>) : <p className="unknown">لا توجد مصادر منشورة لهذا المنتج حالياً.</p>}
              <p className="verify-date">آخر تحقق من المعلومات: {product.lastVerified ? new Date(product.lastVerified).toLocaleDateString('ar-KW') : 'التاريخ غير متاح'}</p>
              <a className="text-link" href={product.bankWebsite} target="_blank" rel="noreferrer" data-testid="link-bank-website">موقع البنك الرسمي <ExternalLink size={14} /></a>
            </section>
          </div>
          <div className="legal-note">هذه المعلومات للتوجيه والمقارنة فقط ولا تُعد نصيحة مالية. تحقّق من الرسوم والشروط وأحدث التفاصيل مباشرةً مع البنك قبل اتخاذ القرار.</div>
        </>}
      </main>
    </div>
  );
}
