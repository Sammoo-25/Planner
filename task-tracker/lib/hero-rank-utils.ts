import { Shield, Sword, Crown, Star, Medal, Trophy } from "lucide-react"

export interface HeroRank {
    title: string
    color: string
    icon: any
}

export function getHeroRank(level: number): HeroRank {
    if (level < 5) return { title: "Novice", color: "text-slate-400", icon: Shield }
    if (level < 10) return { title: "Squire", color: "text-blue-400", icon: Sword }
    if (level < 20) return { title: "Knight", color: "text-emerald-400", icon: Medal }
    if (level < 35) return { title: "Champion", color: "text-purple-400", icon: Star }
    if (level < 50) return { title: "Hero", color: "text-orange-400", icon: Trophy }
    return { title: "Legend", color: "text-yellow-400", icon: Crown }
}
