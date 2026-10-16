import { Draggable } from '@hello-pangea/dnd';

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

// Only allow normal web links (blocks javascript: and similar)
const isSafeUrl = (url) => /^https?:\/\//i.test(url || '');

export default function ApplicationCard({ application, index, dragDisabled, onOpen, onEdit, onDelete }) {
  const deadline = application.deadline ? new Date(application.deadline) : null;
  const overdue =
    deadline && deadline < new Date() && !['offer', 'rejected'].includes(application.status);

  return (
    <Draggable draggableId={application._id} index={index} isDragDisabled={dragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg bg-white p-3 ring-1 ring-gray-200 ${
            snapshot.isDragging ? 'shadow-lg ring-indigo-400' : 'shadow-sm'
          }`}
        >
          <p className="text-sm font-medium text-gray-900">{application.position}</p>
          <p className="text-sm text-gray-500">{application.company}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {application.salary && <span>{application.salary}</span>}
            {application.location && <span>{application.location}</span>}
            {deadline && (
              <span className={overdue ? 'font-medium text-red-600' : ''}>
                {overdue ? 'Overdue: ' : 'Due '}
                {formatDate(application.deadline)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            {isSafeUrl(application.jobUrl) && (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Posting
              </a>
            )}
                        <button
              type="button"
              onClick={() => onOpen(application)}
              className="text-gray-500 hover:text-gray-900"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onEdit(application)}
              className="text-gray-500 hover:text-gray-900"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(application)}
              className="text-gray-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
