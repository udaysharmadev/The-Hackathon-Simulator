"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Zap,
  Clock,
  Trophy,
  Users,
  ArrowRight,
  Code2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Stagger animation container variant */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/** Fade-up animation for children */
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/** Reusable Feature Card Component */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="flex flex-col p-6 bg-card border border-border rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-neutral-400 transition-all duration-200"
    >
      <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-md border border-neutral-200/60 bg-neutral-50 text-neutral-700">
        {icon}
      </div>
      <h3 className="font-mono text-sm font-bold tracking-tight uppercase mb-1.5 text-foreground">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

/** Terminal-style typing text */
function TerminalText() {
  const lines = [
    "$ initializing hackathon_sim...",
    "$ loading problem_statements...",
    "$ assembling judge_panel...",
    "$ calibrating time_pressure...",
    "$ ready.",
  ];
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= lines.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div className="bg-card border border-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 font-mono text-xs max-w-sm sm:max-w-md w-full mx-auto mb-10 text-left">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <div className="w-2 h-2 rounded-full bg-neutral-300" />
          <span className="text-[10px] text-muted-foreground ml-1.5">
            ttyS001 — zsh
          </span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
      </div>
      
      {/* Terminal Content */}
      <div className="space-y-1.5 min-h-[90px]">
        <AnimatePresence>
          {lines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`${
                i === lines.length - 1
                  ? "text-neutral-900 font-bold"
                  : "text-muted-foreground"
              } ${i === visibleLines - 1 ? "typewriter-cursor" : ""}`}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Redesigned Landing Page — The Hackathon Simulator
 *
 * Premium "Paper Terminal" editorial aesthetic.
 * Minimalist layouts, tactile controls, and high-fidelity typography.
 */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background text-foreground dot-pattern">
      
      {/* Navigation Header */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border bg-card/45 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-neutral-100 border border-neutral-200">
            <Terminal className="w-4 h-4 text-neutral-800" />
          </div>
          <span className="font-mono text-xs font-bold tracking-widest uppercase">
            HACK_SIM // <span className="text-neutral-400">STAGE_01</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono tracking-wider">
            BUILD_VER_1.0.0
          </span>
          <Link href="/game">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs px-3.5 h-7.5"
            >
              LAUNCH_GAME.EXE
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20 max-w-5xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center w-full"
        >
          {/* Tagline / Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-neutral-100 border border-neutral-200 text-[10px] font-mono font-medium text-neutral-700 tracking-wider">
              <Sparkles className="w-3 h-3 text-neutral-600" />
              GAMIFIED HACKATHON SIMULATOR v1.0
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-6 text-neutral-900 uppercase font-sans max-w-3xl mx-auto"
          >
            Build. <span className="text-neutral-400">Ship.</span> <br /> Survive.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed font-light"
          >
            Experience the pressure of a real hackathon. Select your challenge, 
            assemble your tech stack, manage technical debt under a 10-minute global 
            clock, and face the live judges.
          </motion.p>

          {/* Terminal Animation */}
          <motion.div variants={itemVariants} className="w-full flex justify-center">
            <TerminalText />
          </motion.div>

          {/* CTA & Actions */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/game">
              <Button
                size="lg"
                className="group font-mono text-sm px-6 h-11 border border-neutral-900"
              >
                <Code2 className="w-4 h-4 mr-2" />
                START_HACKING.SH
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              [~10 MIN EXPERIENCE]
            </span>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-16 md:mt-24"
        >
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Real Problems"
            description="Tackle authentic startup challenges spanning fintech, healthtech, and edtech."
          />
          <FeatureCard
            icon={<Clock className="w-5 h-5" />}
            title="Time Pressure"
            description="Feel the global countdown as you prioritize feature pipelines under tight constraints."
          />
          <FeatureCard
            icon={<Trophy className="w-5 h-5" />}
            title="Live Judging"
            description="Face an opinionated panel of four judges with custom personalities and weights."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" />}
            title="Compete & Learn"
            description="Perfect your pacing, manage developer burnout, and pitch with technical clarity."
          />
        </motion.div>
      </main>

      {/* Editorial Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="relative z-10 text-center py-6 text-[10px] text-muted-foreground border-t border-border bg-card/30 font-mono tracking-wider"
      >
        <div className="flex items-center justify-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>
            THE HACKATHON SIMULATOR // BUILT ON NEXT.JS & TAILWIND v4
          </span>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
        </div>
      </motion.footer>
    </div>
  );
}
