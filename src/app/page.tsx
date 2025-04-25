import { InsulationResistanceAnalyzer } from '@/components/insulation-resistance-analyzer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-secondary">
      <InsulationResistanceAnalyzer />
    </main>
  );
}
