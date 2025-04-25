import { InsulationResistanceAnalyzer } from '@/components/insulation-resistance-analyzer';

export default function InsulationResistancePage() {
  return (
    // Remove centering and specific padding, let layout handle container
    <div className="flex flex-col items-center justify-center">
      <InsulationResistanceAnalyzer />
    </div>
  );
}
