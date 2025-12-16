import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function MetricCard({ title, value, icon: Icon, trend, trendUp }: MetricCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-gray-50 text-gray-900 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <Icon className="h-5 w-5" />
                </div>
               {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {trendUp ? '+' : ''}{trend}
                    </span>
               )}
            </div>
            
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{value}</h3>
            <p className="text-sm font-medium text-gray-500">{title}</p>
        </div>
    );
}
