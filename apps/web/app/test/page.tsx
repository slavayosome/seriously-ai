export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>This is a simple test page to check if Next.js is working properly.</p>
      <div className="mt-4">
        <p>Current time: {new Date().toISOString()}</p>
      </div>
    </div>
  )
} 