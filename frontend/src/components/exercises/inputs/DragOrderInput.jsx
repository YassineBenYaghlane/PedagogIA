import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Icon from "../../ui/Icon"

function Card({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-5 py-4 rounded-xl bg-surface-container-low border border-outline-variant font-headline text-2xl font-bold text-on-surface shadow-ambient cursor-grab active:cursor-grabbing touch-none select-none"
    >
      {label}
    </div>
  )
}

export default function DragOrderInput({ exercise, disabled, onSubmit }) {
  const initial = exercise?.params?.items ?? []
  const [items, setItems] = useState(() => initial.map(String))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIdx = prev.indexOf(String(active.id))
      const newIdx = prev.indexOf(String(over.id))
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  return (
    <div className="mt-4" data-testid="drag-order-input">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-3 justify-center">
            {items.map((it) => (
              <Card key={it} id={it} label={it} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(JSON.stringify(items))}
        className="gradient-soul text-on-primary font-headline font-bold text-xl w-full mt-5 py-4 rounded-xl shadow-[0_12px_24px_rgba(0,89,182,0.3)] spring-hover cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        Valider <Icon name="check" />
      </button>
    </div>
  )
}
