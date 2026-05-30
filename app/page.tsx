"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Zap,
  Clock,
  Trophy,
  Rocket,
  ChevronRight,
  Code2,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Stagger animation container variant */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

/** Fade-up animation for children */
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/** Feature card data */
const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real Problems",
    description:
      "Tackle authentic hackathon challenges spanning fintech, healthtech, edtech, and more.",
    color: "text-neon-cyan",
    glow: "glow-cyan",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Time Pressure",
    description:
      "Feel the clock ticking as you make critical decisions on tech stack, features, and strategy.",
    color: "text-neon-orange",
    glow: "glow-blue",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Live Judging",
    description:
      "Face a panel of judges with unique personalities and scoring criteria. Impress them all.",
    color: "text-neon-purple",
    glow: "glow-purple",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Compete & Learn",
    description:
      "Sharpen your hackathon instincts. Learn to prioritize, ship fast, and pitch with impact.",
    color: "text-neon-green",
    glow: "glow-green",
  },
];

/** Floating orb for background decoration */
function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
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
    }, 400);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div className="glass-card p-4 font-mono text-sm max-w-md mx-auto mb-8">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="text-xs text-muted-foreground ml-2">
          hackathon-sim — zsh
        </span>
      </div>
      <AnimatePresence>
        {lines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${
              i === lines.length - 1
                ? "text-neon-green font-bold"
                : "text-muted-foreground"
            } ${i === visibleLines - 1 ? "typewriter-cursor" : ""}`}
          >
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Landing Page — The Hackathon Simulator
 *
 * Premium, animated landing page with hero section, feature cards,
 * terminal animation, and CTA to start the game.
 */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background decorations */}
      <FloatingOrb
        className="w-96 h-96 bg-neon-blue top-20 -left-48"
        delay={0}
      />
      <FloatingOrb
        className="w-80 h-80 bg-neon-purple top-40 -right-40"
        delay={2}
      />
      <FloatingOrb
        className="w-72 h-72 bg-neon-cyan bottom-20 left-1/3"
        delay={4}
      />
      <div className="absolute inset-0 grid-pattern pointer-events-none" />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
            <Terminal className="w-5 h-5 text-neon-blue" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            HACKATHON<span className="text-neon-blue">SIM</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-muted-foreground font-mono">
            v1.0.0
          </span>
          <Link href="/game">
            <Button
              variant="outline"
              size="sm"
              className="border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all"
            >
              <Rocket className="w-4 h-4 mr-1" />
              Launch
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Eyebrow badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-neon-blue/10 border border-neon-blue/20 text-neon-blue">
              <Sparkles className="w-3 h-3" />
              Gamified Hackathon Experience
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            <span className="block">Build.</span>
            <span className="block text-neon-blue text-glow-blue">Ship.</span>
            <span className="block">Survive.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Experience the intensity of a real hackathon — from problem reveal
            to final judging. Make strategic decisions, manage your time, and
            build something extraordinary.
          </motion.p>

          {/* Terminal Animation */}
          <motion.div variants={itemVariants}>
            <TerminalText />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/game">
              <Button
                size="lg"
                className="relative group bg-neon-blue hover:bg-neon-blue/90 text-white font-semibold px-8 py-6 text-lg rounded-xl glow-blue transition-all duration-300 hover:scale-105"
              >
                <Code2 className="w-5 h-5 mr-2" />
                Start Hacking
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~10 min experience
            </span>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-20 w-full"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`glass-card p-6 group cursor-default hover:${feature.glow} transition-all duration-300`}
            >
              <div
                className={`${feature.color} mb-4 p-3 rounded-lg bg-white/5 inline-block group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="relative z-10 text-center py-6 text-sm text-muted-foreground border-t border-white/5"
      >
        <div className="flex items-center justify-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>
            The Hackathon Simulator — Built with{" "}
            <ChevronRight className="inline w-3 h-3" /> Next.js, Tailwind &
            Framer Motion
          </span>
        </div>
      </motion.footer>
    </div>
  );
}
