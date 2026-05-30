"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import ResultScreen from "@/components/game/ResultScreen";

/**
 * Results Page — The Hackathon Simulator
 *
 * Displays the final results after the hackathon simulation is complete.
 * Shows score breakdown, judge feedback, and options to play again.
 *
 * TODO: Add social sharing functionality
 * TODO: Add leaderboard integration
 * TODO: Add detailed analytics breakdown
 */
export default function ResultsPage() {
  const { isGameStarted, isGameOver } = useGameStore();
  const router = useRouter();

  // If user navigates directly to results without playing,
  // show mock results anyway for demo purposes
  useEffect(() => {
    // TODO: Uncomment this guard when full game logic is implemented
    // if (!isGameStarted && !isGameOver) {
    //   router.push('/');
    // }
  }, [isGameStarted, isGameOver, router]);

  return <ResultScreen />;
}
