/**
 * Traffic Risk Assessment Component - Sleek Interface Theme
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { RiskLevel, VehicleTrajectory } from '../types';

interface TrafficRiskBadgeProps {
  riskLevel: RiskLevel;
  trajectory?: VehicleTrajectory;
}

export const TrafficRiskBadge: React.FC<TrafficRiskBadgeProps> = ({
  riskLevel,
  trajectory,
}) => {
  const getRiskDetails = () => {
    switch (riskLevel) {
      case 'HIGH':
        return {
          title: 'TRAFFIC RISK: HIGH',
          subtitle: trajectory?.hasImpossibleTravel
            ? 'Critical Anomaly Detected • Extreme Speed Corridor / Suspected Cloned Plate'
            : 'Severe Corridor Velocity Spike • High Crash Probability',
          bgClass: 'bg-red-500/10 border-red-500/30 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
          badgeClass: 'bg-red-500 text-white',
          textColor: 'text-red-400',
          icon: <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />,
          progressWidth: '92%',
          barColor: 'bg-red-500',
        };
      case 'MEDIUM':
        return {
          title: 'TRAFFIC RISK: MEDIUM',
          subtitle: 'Moderate Flow Variance • Approaching Urban Velocity Limit',
          bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-100',
          badgeClass: 'bg-amber-500 text-slate-950',
          textColor: 'text-amber-400',
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          progressWidth: '55%',
          barColor: 'bg-amber-500',
        };
      case 'LOW':
      default:
        return {
          title: 'TRAFFIC RISK: LOW',
          subtitle: 'Nominal Traffic Flow • Safe Inter-Camera Travel Times',
          bgClass: 'bg-[#0F1117] border-white/10 text-slate-200',
          badgeClass: 'bg-green-500 text-slate-950',
          textColor: 'text-green-400',
          icon: <ShieldCheck className="w-5 h-5 text-green-400" />,
          progressWidth: '18%',
          barColor: 'bg-green-500',
        };
    }
  };

  const details = getRiskDetails();

  return (
    <div
      id="traffic-risk-panel"
      className={`rounded-2xl border p-4.5 transition-all duration-300 ${details.bgClass}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            {details.icon}
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <span>{details.title}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">{details.subtitle}</p>
          </div>
        </div>

        <div className="text-right font-mono text-xs shrink-0 hidden sm:block">
          <span className="text-slate-400 text-[10px] block uppercase">Severity Score</span>
          <span className={`font-bold ${details.textColor}`}>
            {riskLevel === 'HIGH' ? '92 / 100' : riskLevel === 'MEDIUM' ? '55 / 100' : '18 / 100'}
          </span>
        </div>
      </div>

      {/* Risk Gauge Progress Bar */}
      <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10 mt-2.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${details.barColor}`}
          style={{ width: details.progressWidth }}
        />
      </div>
    </div>
  );
};
