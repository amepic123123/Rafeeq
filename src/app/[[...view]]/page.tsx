import RafeeqApp from '@/components/RafeeqApp';

export function generateStaticParams() {
  return [
    { view: [] },
    { view: ['dashboard'] },
    { view: ['chat'] },
    { view: ['labs'] },
    { view: ['family'] },
    { view: ['doctor'] },
  ];
}

export default function Page() {
  return <RafeeqApp />;
}
