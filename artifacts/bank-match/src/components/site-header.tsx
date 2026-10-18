import { Link } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

export function SiteHeader({ variant }: { variant: 'home' | 'product' }) {
  return (
    <header className="site-header" dir="rtl">
      <Link href="/" className="brand" data-testid="link-home-brand"><BrandLogo /></Link>
      {variant === 'home'
        ? <a className="nav-link" href="#quiz" data-testid="link-start-quiz">ابدأ المطابقة <ArrowLeft size={18} /></a>
        : <Link href="/" className="nav-link" data-testid="link-back-home">العودة للمقارنة <ArrowRight size={18} /></Link>}
    </header>
  );
}
