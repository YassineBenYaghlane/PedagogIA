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
import Button from "../../ui/Button"

function DragCard({ id, label }) {
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
      className="specimen px-5 py-4 bg-bone hover:bg-mist text-bark font-mono text-2xl font-semibold tabular-nums cursor-grab active:cursor-grabbing touch-none select-none"
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
              <DragCard key={it} id={it} label={it} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button
        size="lg"
        disabled={disabled}
        onClick={() => onSubmit(JSON.stringify(items))}
        className="w-full mt-5"
      >
        Valider <Icon name="check" />
      </Button>
    </div>
  )
}
