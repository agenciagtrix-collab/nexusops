import React from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const defaultStatuses = [
  { name: 'A Fazer', key: 'todo', color: '#94a3b8' },
  { name: 'Em Andamento', key: 'in_progress', color: '#6366f1' },
  { name: 'Em Revisão', key: 'review', color: '#f59e0b' },
  { name: 'Concluído', key: 'done', color: '#22c55e' },
];

export default function KanbanView({ tasks = [], statuses, onTaskClick, onAddTask, onTaskStatusChange, users = [] }) {
  const columns = statuses?.length > 0
    ? statuses.map(s => ({ name: s.name, key: s.name.toLowerCase().replace(/\s/g, '_'), color: s.color }))
    : defaultStatuses;

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);
    if (task && task.status !== newStatus) {
      onTaskStatusChange?.(task, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {columns.map((col) => {
          const columnTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-[280px] md:w-[300px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold">{col.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => onAddTask?.(col.key)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2.5 min-h-[200px] rounded-xl p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/30'
                    }`}
                  >
                    {columnTasks.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground/50">
                        Nenhuma tarefa
                      </div>
                    ) : (
                      columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                opacity: dragSnapshot.isDragging ? 0.85 : 1,
                              }}
                            >
                              <TaskCard task={task} onClick={onTaskClick} users={users} />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}