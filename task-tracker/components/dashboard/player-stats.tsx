import { PlayerStats as PlayerStatsType } from "@/types"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Zap, Trophy } from "lucide-react"

interface Props {
    stats: PlayerStatsType
}

export function PlayerStats({ stats }: Props) {
    return (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">Level {stats.level}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> XP</span>
                        <span>{stats.currentExp} / {stats.maxExp}</span>
                    </div>
                    <Progress
                        value={stats.currentExp}
                        max={stats.maxExp}
                        indicatorColor="bg-indigo-500"
                        className="h-2 bg-slate-100 dark:bg-slate-800"
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Health</span>
                        <span>{stats.health}%</span>
                    </div>
                    <Progress
                        value={stats.health}
                        max={100}
                        indicatorColor={stats.health < 30 ? "bg-rose-500" : "bg-emerald-500"}
                        className="h-2 bg-slate-100 dark:bg-slate-800"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
