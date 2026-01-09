import Link from 'next/link'
import { ArrowRight, Globe, Lock, ShieldCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      
      {/* LEFT COLUMN: Content */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="max-w-xl">
          
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase">
            <Zap className="h-3 w-3" />
            Next-Gen Due Diligence
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl xl:text-7xl leading-[1.1]">
            PRECISION <br />
            RISK <br />
            <span className="text-primary">INTELLIGENCE.</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
            Provisioning high-fidelity risk extraction and deep-scan assessment for individuals and entities globally. Professional due diligence matured for the digital age.
          </p>

          {/* Buttons */}
          <div className="mb-12 flex flex-col sm:flex-row gap-4">
            <Link 
              href="/register" 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              GET STARTED <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              href="/login" 
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-transparent px-8 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              SIGN IN
            </Link>
          </div>

          {/* Divider */}
          <div className="mb-12 h-px w-full bg-border" />

          {/* Features Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <div className="mb-2 flex items-center gap-2 font-bold text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm tracking-wide uppercase">Global Reach</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cross-jurisdiction data harvesting from over 190 nations.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 font-bold text-foreground">
                <Lock className="h-5 w-5 text-primary" />
                <span className="text-sm tracking-wide uppercase">Secure Protocol</span>
              </div>
              <p className="text-xs text-muted-foreground">
                AES-256 encrypted data pipelines for absolute confidentiality.
              </p>
            </div>
          </div>

          <div className="mt-12 flex gap-8 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            <span>Verified Integrity</span>
            <span>24/7 Monitoring</span>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Visuals */}
      <div className="relative hidden lg:block bg-muted overflow-hidden">
        {/* Background Image - Circuit/Tech Texture */}
        {/* Using a placeholder from Unsplash that matches the vibe. You can replace this URL. */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-multiply"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558494949-efc535b5c47c?q=80&w=2000&auto=format&fit=crop')` }}
        />
        
        {/* Gradient Overlay (Fade from white/background to transparent) */}
        {/* This creates the smooth blend effect seen in the screenshot */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent z-10" />
        
        {/* Blue Tint Overlay */}
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />

        {/* Floating Card Content */}
        <div className="absolute inset-0 flex items-end justify-center pb-24 pr-12 z-20">
          <div className="max-w-md w-full rounded-3xl bg-primary p-10 text-primary-foreground shadow-2xl relative overflow-hidden">
            
            {/* Decorative background circle on card */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold tracking-widest italic opacity-90">VERIFIED RESULT ARTIFACT</span>
              </div>

              {/* Quote */}
              <blockquote className="mb-8 text-xl font-medium leading-relaxed">
                "The accuracy of Diliguard's risk simulation has transformed our vendor onboarding protocol. Precision is non-negotiable."
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  MA
                </div>
                <div>
                  <div className="text-sm font-bold">MARCUS AURELIUS</div>
                  <div className="text-[10px] font-medium opacity-70 tracking-wider">HEAD OF OPERATIONS, GLOBAL CAPITAL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}