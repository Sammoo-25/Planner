import { PlayerStats as PlayerStatsType } from "@/types"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Zap, Trophy } from "lucide-react"

interface Props {
    stats: PlayerStatsType
}

export function PlayerStats({ stats }: Props) {
    return (
        <Card className="border-none bg-sand-200/50 shadow-none">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <span className="font-bold text-dark-900">Level {stats.level}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Experience Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-dark-500">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> EXP</span>
                        <span>{stats.currentExp} / {stats.maxExp}</span>
                    </div>
                    <Progress
                        value={stats.currentExp}
                        max={stats.maxExp}
                        indicatorColor="bg-exp"
                        className="h-2 bg-sand-300"
                    />
                </div>

                {/* Health Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-dark-500">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Health</span>
                        <span>{stats.health}%</span>
                    </div>
                    <Progress
                        value={stats.health}
                        max={100}
                        indicatorColor={stats.health < 30 ? "bg-health-low" : "bg-health-ok"}
                        className="h-2 bg-sand-300"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
