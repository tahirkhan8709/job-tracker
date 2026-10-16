import { Droppable } from '@hello-pangea/dnd';
import ApplicationCard from './ApplicationCard';
import { STATUS_META } from '../constants';

export default function Column({ status, applications, dragDisabled, onAdd, onOpen, onEdit, onDelete }) {
  const meta = STATUS_META[status];

  return (
    <div className="min-w-44 flex-1 rounded-xl bg-gray-200/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <h2 className="text-sm font-semibold text-gray-800">{meta.label}</h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">
            {applications.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAdd(status)}
          className="rounded-md px-2 text-lg leading-none text-gray-500 hover:bg-white hover:text-gray-900"
          aria-label={`Add application to ${meta.label}`}
        >
          +
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-24 space-y-2 rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-100/70' : ''
            }`}
          >
            {applications.map((application, index) => (
              <ApplicationCard
                key={application._id}
                application={application}
                index={index}
                dragDisabled={dragDisabled}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
                        {applications.length === 0 && !snapshot.isDraggingOver && (
              <p className="py-4 text-center text-xs text-gray-400">No jobs here</p>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
