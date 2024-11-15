import InfiniteGrid from '../app/components/InifiniteGrid';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        {/* <h1 className="text-4xl font-bold mb-4">Infinite Grid</h1> */}
        <div className="h-[800px] w-full rounded-lg border">
          <InfiniteGrid />
        </div>
      </div>
    </main>
  );
}