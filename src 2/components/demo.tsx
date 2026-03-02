import { DottedSurface } from "@/components/ui/dotted-surface";
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';

export default function DemoOne() {
 return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
		<DottedSurface className="size-full" />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-4 gap-8">
            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full h-[600px] w-[600px]',
                    'bg-[radial-gradient(circle_at_center,rgba(0,120,255,0.08),transparent_70%)]',
                    'blur-[40px]',
                )}
            />
            
            <div className="flex bg-muted/30 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/10 dark:border-white/5">
                <Target className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center space-y-4">
                <h1 className="font-sans tracking-tight text-5xl md:text-7xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent transform transition-all duration-700">
                    Dotted Surface
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-[600px] mx-auto font-light">
                    A beautiful, interactive Three.js particle wave background.
                </p>
            </div>

            <div className="relative mt-12 rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-w-4xl w-full aspect-video group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80" 
                    alt="Cyberpunk workspace" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6">
                    <p className="font-mono text-sm uppercase tracking-widest text-primary font-semibold mb-2">Workspace</p>
                    <h3 className="text-2xl font-semibold text-white">Cyberpunk Setup</h3>
                </div>
            </div>
        </div>
	</div>
	);
}
