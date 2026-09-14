import { getOverview } from '@/lib/camara';
import Explorer from '@/components/Explorer';
export const dynamic = 'force-dynamic';
export default async function Home() { return <Explorer data={await getOverview()} />; }
