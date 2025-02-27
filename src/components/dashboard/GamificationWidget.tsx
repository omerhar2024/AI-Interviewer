import {
  useStreak,
  useBadges,
  useNextBadge,
} from "@/lib/hooks/use-gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Award, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function GamificationWidget() {
  const { data: streak = { currentStreak: 0, longestStreak: 0 } } = useStreak();
  const { data: badges = [] } = useBadges();
  const { data: nextBadge } = useNextBadge();
  const navigate = useNavigate();

  const unlockedBadges = badges.filter((badge) => badge.unlocked);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <div className="p-1.5 rounded-full bg-blue-100">
            <Trophy className="h-5 w-5 text-blue-600" />
          </div>
          Your Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Streak */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white shadow-md border border-orange-100">
            <div className="bg-orange-100 p-2.5 rounded-full">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">
                  Current Streak
                </span>
                <span className="text-lg font-bold text-orange-500">
                  {streak.currentStreak} days
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Longest streak: {streak.longestStreak} days
              </p>
            </div>
          </div>

          {/* Next Badge */}
          {nextBadge && (
            <div className="p-4 rounded-lg bg-white shadow-md border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2.5 rounded-full">
                  <Award className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      Next Badge
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {nextBadge.progress}/{nextBadge.requiredCount}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-blue-800">
                    {nextBadge.name}
                  </p>
                </div>
              </div>
              <Progress
                value={(nextBadge.progress / nextBadge.requiredCount) * 100}
                className="h-2 bg-blue-100"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {nextBadge.description}
              </p>
            </div>
          )}

          {/* Unlocked Badges */}
          {unlockedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Earned Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 shadow-sm hover:shadow transition-all duration-200"
                    title={badge.description}
                  >
                    <span className="text-base">{badge.icon}</span>
                    <span className="text-blue-700">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Button */}
          <Button
            onClick={() => navigate("/practice")}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white text-base font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            size="default"
          >
            <Star className="h-5 w-5 mr-2" /> Practice Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
