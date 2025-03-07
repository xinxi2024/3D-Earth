export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div
          className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">Loading 3D Earth Model...</h2>
        <p className="mt-2 text-gray-300">Please wait while we prepare your interactive experience</p>
      </div>
    </div>
  )
}

