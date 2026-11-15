"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { renameTrailAction, saveTrailLayoutAction, type TrailColumnInput } from "@/app/admin/trails/actions";
import type { Trail, Winery } from "@/lib/types";
import type { TrailAssignment } from "@/lib/admin";

const UNASSIGNED = "unassigned";

function buildInitialColumns(
  trails: Trail[],
  wineries: Winery[],
  assignments: TrailAssignment[]
): Record<string, string[]> {
  const columns: Record<string, string[]> = { [UNASSIGNED]: [] };
  trails.forEach((t) => (columns[t.id] = []));

  const assigned = new Set<string>();
  [...assignments]
    .sort((a, b) => a.display_order - b.display_order)
    .forEach((a) => {
      if (!columns[a.trail_id]) return; // trail_id no longer exists — ignore stale row
      columns[a.trail_id].push(a.winery_id);
      assigned.add(a.winery_id);
    });

  wineries.forEach((w) => {
    if (!assigned.has(w.id)) columns[UNASSIGNED].push(w.id);
  });

  return columns;
}

function findColumnOf(columns: Record<string, string[]>, wineryId: string): string | null {
  return Object.keys(columns).find((key) => columns[key].includes(wineryId)) ?? null;
}

function WineryCard({ winery }: { winery: Winery }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: winery.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-[var(--color-charcoal)]/30 active:cursor-grabbing"
        aria-label={`Drag ${winery.name}`}
      >
        <GripVertical size={15} />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--color-charcoal)]">{winery.name}</p>
        <p className="truncate text-xs text-[var(--color-charcoal)]/50">
          {winery.city}, {winery.state} {!winery.active && "· Inactive"}
        </p>
      </div>
    </div>
  );
}

function TrailName({ trail }: { trail: Trail }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(trail.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Resync local state when the trail prop changes (e.g. the page
  // refetches fresh data after a save) — setting state during render,
  // rather than in an effect, is the React-recommended way to do this.
  const [syncedName, setSyncedName] = useState(trail.name);
  if (trail.name !== syncedName) {
    setSyncedName(trail.name);
    setValue(trail.name);
  }

  function save() {
    setEditing(false);
    setError(null);
    const trimmed = value.trim();
    if (!trimmed || trimmed === trail.name) {
      setValue(trail.name);
      return;
    }
    startTransition(async () => {
      const result = await renameTrailAction(trail.id, trimmed);
      if (result?.error) {
        setError(result.error);
        setValue(trail.name);
      }
    });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(trail.name);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-[var(--color-gold)] bg-white px-2 py-1 text-sm font-medium text-[var(--color-charcoal)] outline-none"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={pending}
        className="truncate text-left text-sm font-medium text-[var(--color-charcoal)] hover:text-[var(--color-burgundy)]"
        title="Click to rename"
      >
        {pending ? "Saving…" : value}
      </button>
      {error && <p className="text-xs text-[var(--color-burgundy)]">{error}</p>}
    </div>
  );
}

function Column({
  id,
  title,
  badge,
  wineryIds,
  wineriesById,
}: {
  id: string;
  title: React.ReactNode;
  badge?: React.ReactNode;
  wineryIds: string[];
  wineriesById: Map<string, Winery>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[10rem] w-72 shrink-0 flex-col gap-2 rounded-2xl border p-3 transition-colors ${
        isOver ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]/30" : "border-[var(--color-line)] bg-black/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">{title}</div>
        {badge}
      </div>
      <SortableContext id={id} items={wineryIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {wineryIds.map((wineryId) => {
            const winery = wineriesById.get(wineryId);
            return winery ? <WineryCard key={wineryId} winery={winery} /> : null;
          })}
          {wineryIds.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-xs text-[var(--color-charcoal)]/40">
              Drop here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TrailBoard({
  trails,
  wineries,
  assignments,
}: {
  trails: Trail[];
  wineries: Winery[];
  assignments: TrailAssignment[];
}) {
  const [columns, setColumns] = useState<Record<string, string[]>>(() =>
    buildInitialColumns(trails, wineries, assignments)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const wineriesById = useMemo(() => new Map(wineries.map((w) => [w.id, w])), [wineries]);
  const sortedTrails = useMemo(() => [...trails].sort((a, b) => a.sort_order - b.sort_order), [trails]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeWineryId = String(active.id);
    const overId = String(over.id);

    const fromColumn = findColumnOf(columns, activeWineryId);
    const toColumn = columns[overId] ? overId : findColumnOf(columns, overId);
    if (!fromColumn || !toColumn || fromColumn === toColumn) return;

    setColumns((prev) => {
      const next = { ...prev };
      next[fromColumn] = next[fromColumn].filter((id) => id !== activeWineryId);
      const overIndex = next[toColumn].indexOf(overId);
      const insertAt = overIndex >= 0 ? overIndex : next[toColumn].length;
      next[toColumn] = [
        ...next[toColumn].slice(0, insertAt),
        activeWineryId,
        ...next[toColumn].slice(insertAt),
      ];
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeWineryId = String(active.id);
    const overId = String(over.id);
    const column = findColumnOf(columns, activeWineryId);
    if (!column) return;

    // Reads the latest `columns` from this render's closure rather than a
    // setColumns functional updater — startTransition (inside persist) is
    // a side effect, and side effects inside a state updater function are
    // not allowed (React calls updaters during render/reconciliation).
    const items = columns[column];
    const oldIndex = items.indexOf(activeWineryId);
    const overIndex = items.indexOf(overId);

    if (oldIndex < 0 || overIndex < 0 || oldIndex === overIndex) {
      // Nothing to reorder within this column, but a prior onDragOver may
      // have already moved the card across columns — persist as-is.
      persist(columns);
      return;
    }

    const reordered = [...items];
    reordered.splice(oldIndex, 1);
    reordered.splice(overIndex, 0, activeWineryId);
    const next = { ...columns, [column]: reordered };
    setColumns(next);
    persist(next);
  }

  function persist(snapshot: Record<string, string[]>) {
    const layout: TrailColumnInput[] = Object.entries(snapshot).map(([key, wineryIds]) => ({
      trailId: key === UNASSIGNED ? null : key,
      wineryIds,
    }));
    startTransition(async () => {
      await saveTrailLayoutAction(layout);
    });
  }

  const activeWinery = activeId ? wineriesById.get(activeId) : null;

  return (
    <DndContext
      id="trail-board"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        <Column
          id={UNASSIGNED}
          title={<p className="text-sm font-medium text-[var(--color-charcoal)]/60">Unassigned</p>}
          wineryIds={columns[UNASSIGNED] ?? []}
          wineriesById={wineriesById}
        />
        {sortedTrails.map((trail) => (
          <Column
            key={trail.id}
            id={trail.id}
            title={<TrailName trail={trail} />}
            badge={
              trail.coming_soon && (
                <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-charcoal)]/50">
                  Coming Soon
                </span>
              )
            }
            wineryIds={columns[trail.id] ?? []}
            wineriesById={wineriesById}
          />
        ))}
      </div>

      <DragOverlay>
        {activeWinery && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-gold)] bg-white px-3 py-2.5 shadow-lg">
            <GripVertical size={15} className="text-[var(--color-charcoal)]/30" />
            <div>
              <p className="text-sm font-medium text-[var(--color-charcoal)]">{activeWinery.name}</p>
              <p className="text-xs text-[var(--color-charcoal)]/50">
                {activeWinery.city}, {activeWinery.state}
              </p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
