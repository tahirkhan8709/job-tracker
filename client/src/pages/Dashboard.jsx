import { useEffect, useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import api, { getErrorMessage } from '../api/axios';
import { STATUSES } from '../constants';
import Column from '../components/Column';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationDetails from '../components/ApplicationDetails';

const byOrder = (a, b) => a.order - b.order;

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // null = closed, { application } = editing, { status } = adding to that column
  const [formState, setFormState] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const selected = applications.find((a) => a._id === detailsId);

  useEffect(() => {
    api
      .get('/applications')
      .then((res) => setApplications(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Group by status and sort each column by its saved order
  const columns = useMemo(() => {
    const grouped = Object.fromEntries(STATUSES.map((s) => [s, []]));
    applications.forEach((a) => grouped[a.status]?.push(a));
    STATUSES.forEach((s) => grouped[s].sort(byOrder));
    return grouped;
  }, [applications]);

  const term = search.trim().toLowerCase();
  const visible = (list) =>
    term
      ? list.filter(
          (a) =>
            a.company.toLowerCase().includes(term) || a.position.toLowerCase().includes(term)
        )
      : list;

  const total = applications.length;
  const stats = [
    { label: 'Total', value: total },
    { label: 'Applied', value: total - columns.wishlist.length },
    { label: 'Interviewing', value: columns.interview.length },
    { label: 'Offers', value: columns.offer.length },
  ];

  // Drag and drop: update the screen first, then tell the server (roll back if it fails)
  const handleDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || term) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const previous = applications;

    const lists = {};
    STATUSES.forEach((s) => {
      lists[s] = [...columns[s]];
    });
    const [moved] = lists[source.droppableId].splice(source.index, 1);
    lists[destination.droppableId].splice(destination.index, 0, {
      ...moved,
      status: destination.droppableId,
    });

    setError('');
    setApplications(STATUSES.flatMap((s) => lists[s].map((a, i) => ({ ...a, order: i }))));

    try {
      const { data: updated } = await api.patch(`/applications/${draggableId}/status`, {
        status: destination.droppableId,
        order: destination.index,
      });
      setApplications((list) => list.map((a) => (a._id === updated._id ? updated : a)));
    } catch (err) {
      setApplications(previous);
      setError(`Could not move the card: ${getErrorMessage(err)}`);
    }
  };

  const handleSave = async (data) => {
    if (formState?.application) {
      const { data: updated } = await api.put(`/applications/${formState.application._id}`, data);
      setApplications((list) => list.map((a) => (a._id === updated._id ? updated : a)));
    } else {
      const { data: created } = await api.post('/applications', data);
      setApplications((list) => [...list, created]);
    }
    setFormState(null);
  };

  const handleSaveNotes = async (id, notes) => {
    const { data: updated } = await api.put(`/applications/${id}`, { notes });
    setApplications((list) => list.map((a) => (a._id === updated._id ? updated : a)));
  };

  const handleDelete = async (application) => {
    if (!window.confirm(`Delete "${application.position}" at ${application.company}?`)) return;
    try {
      await api.delete(`/applications/${application._id}`);
      setApplications((list) => list.filter((a) => a._id !== application._id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-200">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or role"
            className="w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => setFormState({ status: 'wishlist' })}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add job
          </button>
        </div>
      </div>

      {term && (
        <p className="mt-3 text-xs text-gray-500">
          Dragging is paused while a search is active. Clear the search to move cards.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-gray-500">Loading...</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="mt-6 flex items-start gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                applications={visible(columns[status])}
                dragDisabled={Boolean(term)}
                onAdd={(s) => setFormState({ status: s })}
                onOpen={(application) => setDetailsId(application._id)}
                onEdit={(application) => setFormState({ application })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {!loading && total === 0 && !error && (
        <p className="mt-2 text-center text-sm text-gray-500">
          No applications yet. Click "+ Add job" to add your first one.
        </p>
      )}

      {selected && (
        <ApplicationDetails
          key={selected._id}
          application={selected}
          onClose={() => setDetailsId(null)}
          onSaveNotes={handleSaveNotes}
        />
      )}

      {formState && (
        <ApplicationForm
          initial={formState.application}
          defaultStatus={formState.status}
          onSubmit={handleSave}
          onClose={() => setFormState(null)}
        />
      )}
    </main>
  );
}