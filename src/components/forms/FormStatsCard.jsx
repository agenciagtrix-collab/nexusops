import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Eye, CheckCircle2, TrendingUp, Clock, Target, Award,
} from 'lucide-react';

const StatIcon = {
  views: Eye,
  responses: CheckCircle2,
  conversion: TrendingUp,
  time: Clock,
  completion: Target,
  score: Award,
};

export default function FormStatsCard({
  label, value, icon, trend, format = 'text',
}) {
  const Icon = StatIcon[icon] || Eye;

  const formatValue = () => {
    if (format === 'percent') return `${value}%`;
    if (format === 'time') return `${value}min`;
    return value;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{formatValue()}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs. período anterior
              </p>
            )}
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}