import Link from 'next/link'
import { ArrowRight, Globe, Lock, ShieldCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="h-full w-full grid lg:grid-cols-2">
      
      {/* LEFT COLUMN: Content */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 bg-background">
        
        {/* INNER WRAPPER: Responsive spacing for the content block */}
        <div className="max-w-xl py-24 lg:py-32 my-auto">
          
          {/* BADGE: Added specific mb-10 for more breathing room */}
          <div className="mb-10 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
            <Zap className="h-3.5 w-3.5" />
            Next-Gen Due Diligence
          </div>

          {/* Headline */}
          <h1 className="mb-8 text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl xl:text-7xl leading-[1.05] uppercase">
            PRECISION <br />
            RISK <br />
            <span className="text-primary">INTELLIGENCE.</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-muted-foreground leading-relaxed font-medium">
            Provisioning high-fidelity risk extraction and deep-scan assessment for individuals and entities globally. Professional due diligence matured for the digital age.
          </p>

          {/* Buttons */}
          <div className="mb-14 flex flex-col sm:flex-row gap-4">
            <Link 
              href="/register" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-10 text-xs font-bold text-primary-foreground tracking-widest uppercase transition-all hover:brightness-110 shadow-lg shadow-primary/20"
            >
              GET STARTED <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/login" 
              className="inline-flex h-14 items-center justify-center rounded-lg border border-border bg-transparent px-10 text-xs font-bold text-foreground tracking-widest uppercase transition-colors hover:bg-muted"
            >
              SIGN IN
            </Link>
          </div>

          {/* Divider */}
          <div className="mb-12 h-px w-full bg-border/60" />

          {/* Features Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-[10px] tracking-widest uppercase">Global Reach</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cross-jurisdiction data harvesting from over 190 nations.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Lock className="h-5 w-5 text-primary" />
                <span className="text-[10px] tracking-widest uppercase">Secure Protocol</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AES-256 encrypted data pipelines for absolute confidentiality.
              </p>
            </div>
          </div>

          {/* Bottom Tags */}
          <div className="mt-16 flex gap-8 text-[9px] font-black tracking-[0.3em] text-muted-foreground/50 uppercase">
            <span>Verified Integrity</span>
            <span>24/7 Monitoring</span>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Visuals */}
      <div className="relative hidden lg:block bg-[#0B1120] overflow-hidden">
        {/* Background Image - Tech Texture */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70 mix-blend-screen"
          style={{ backgroundImage: `url('https://images.pexels.com/photos/10809862/pexels-photo-10809862.jpeg?q=80&w=2000&auto=format&fit=crop')` }}
        />
        
        {/* Gradient Overlay for the split-screen blend */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10 w-1/3" />
        
        {/* Subtle Blue Tint Overlay */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />

        {/* Floating Card */}
        <div className="absolute inset-0 flex items-end justify-center pb-24 pr-12 z-20">
          <div className="max-w-md w-full rounded-3xl bg-primary p-10 text-primary-foreground shadow-2xl relative overflow-hidden ring-1 ring-white/10">
            
            {/* Decorative background circle */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.2em] italic opacity-90 uppercase">VERIFIED RESULT ARTIFACT</span>
              </div>

              {/* Quote */}
              <blockquote className="mb-8 text-xl font-medium leading-relaxed tracking-tight italic">
                "The accuracy of Diliguard's risk simulation has transformed our vendor onboarding protocol. Precision is non-negotiable."
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold border border-white/10">
                  MA
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">MARCUS AURELIUS</div>
                  <div className="text-[9px] font-bold opacity-60 tracking-[0.1em] uppercase">HEAD OF OPERATIONS, GLOBAL CAPITAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}