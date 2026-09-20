import type { CollaboratorPresence } from "../types/collaboration.types"

interface RemoteCursorsLayerProps {
  collaborators: CollaboratorPresence[]
}

export function RemoteCursorsLayer({ collaborators }: RemoteCursorsLayerProps) {
  const activeCursors = collaborators.filter(
    (c) => c.cursor && (c.cursor.x > 0 || c.cursor.y > 0)
  )

  if (activeCursors.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {activeCursors.map((c) => (
        <div
          key={c.id}
          className="absolute pointer-events-none transition-all duration-200 ease-out will-change-[left,top]"
          style={{
            left: `${c.cursor.x}px`,
            top: `${c.cursor.y}px`,
          }}
        >
          <svg
            className="size-4.5 drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="0,0 0,19 5.5,14 10,23 13.5,21.5 9,12.5 15.5,12.5"
              fill={c.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          <div
            className="ml-3 -mt-1 w-max rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-md select-none tracking-tight"
            style={{ backgroundColor: c.color }}
          >
            {c.username}
          </div>
        </div>
      ))}
    </div>
  )
}
