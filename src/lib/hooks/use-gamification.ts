import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { useAuth } from "../auth";
import { useResponses } from "./use-responses";

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  requiredCount: number;
};

export function useStreak() {
  const { user } = useAuth();
  const { data: responses = [] } = useResponses(100);

  return useQuery({
    queryKey: ["streak", user?.id],
    queryFn: async () => {
      if (!user) return { currentStreak: 0, longestStreak: 0 };
      if (!responses || responses.length === 0)
        return { currentStreak: 0, longestStreak: 0 };

      // Sort responses by date
      const sortedResponses = [...responses].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      // Group responses by day
      const responseDays = new Set<string>();
      sortedResponses.forEach((response) => {
        if (response && response.created_at) {
          const date = new Date(response.created_at)
            .toISOString()
            .split("T")[0];
          responseDays.add(date);
        }
      });

      const days = Array.from(responseDays);

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Check if practiced today or yesterday to maintain streak
      const hasPracticedRecently =
        days.includes(today) || days.includes(yesterday);

      if (hasPracticedRecently) {
        currentStreak = 1; // Start with 1 for today/yesterday

        // Count backwards from yesterday
        let checkDate = new Date(Date.now() - 86400000);

        while (true) {
          checkDate = new Date(checkDate.getTime() - 86400000);
          const dateStr = checkDate.toISOString().split("T")[0];

          if (days.includes(dateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 0; i < days.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const currentDate = new Date(days[i]);
          const prevDate = new Date(days[i - 1]);

          // Check if dates are consecutive
          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, tempStreak);
      }

      return { currentStreak, longestStreak };
    },
    enabled: !!user && responses.length > 0,
  });
}

export function useBadges() {
  const { user } = useAuth();
  const { data: responses = [] } = useResponses(100);
  const { data: streak } = useStreak();

  return useQuery({
    queryKey: ["badges", user?.id, responses.length, streak],
    queryFn: async () => {
      if (!user) return [];

      // Define badges
      const badges: Badge[] = [
        {
          id: "first_practice",
          name: "First Practice",
          description: "Complete your first practice session",
          icon: "🎯",
          unlocked: responses.length >= 1,
          progress: Math.min(responses.length, 1),
          requiredCount: 1,
        },
        {
          id: "consistent_learner",
          name: "Consistent Learner",
          description: "Practice for 5 consecutive days",
          icon: "🔥",
          unlocked: (streak?.currentStreak || 0) >= 5,
          progress: Math.min(streak?.currentStreak || 0, 5),
          requiredCount: 5,
        },
        {
          id: "score_master",
          name: "Score Master",
          description: "Achieve a score of 8+ in 3 practices",
          icon: "🏆",
          unlocked:
            responses.filter((r) => (r.feedback?.score || 0) >= 8).length >= 3,
          progress: Math.min(
            responses.filter((r) => (r.feedback?.score || 0) >= 8).length,
            3,
          ),
          requiredCount: 3,
        },
        {
          id: "practice_pro",
          name: "Practice Pro",
          description: "Complete 10 practice sessions",
          icon: "⭐",
          unlocked: responses.length >= 10,
          progress: Math.min(responses.length, 10),
          requiredCount: 10,
        },
        {
          id: "versatile_practitioner",
          name: "Versatile Practitioner",
          description:
            "Complete practices in both Product Sense and Behavioral questions",
          icon: "🧠",
          unlocked: new Set(responses.map((r) => r.questions?.type)).size >= 2,
          progress: new Set(responses.map((r) => r.questions?.type)).size,
          requiredCount: 2,
        },
      ];

      return badges;
    },
    enabled: !!user,
  });
}

export function useNextBadge() {
  const { data: badges = [] } = useBadges();

  return useQuery({
    queryKey: ["nextBadge", badges],
    queryFn: async () => {
      // Find the first badge that's not unlocked yet
      const nextBadge = badges.find((badge) => !badge.unlocked);
      return nextBadge || null;
    },
    enabled: badges.length > 0,
  });
}
