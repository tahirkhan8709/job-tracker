import { useState } from 'react';
import { STATUS_META } from '../constants';
import { getErrorMessage } from '../api/axios';

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function ApplicationDetails({ application, onClose, onSaveNotes }) {
  const [notes, setNotes] = useState(application.notes || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const meta = STATUS_META[application.status];
  const changed = notes !== (application.notes || '');

  // Newest first, with the creation date as the oldest entry
  const events = [
    ...(application.timeline || []).map((t) => ({ text: t.event, date: t.date })),
    { text: 'Added to board', date: application.createdAt },
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await onSaveNotes(application._id, notes);
      setMessage('Saved');
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{application.position}</h2>
            <p className="text-sm text-gray-500">{application.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 text-xl leading-none text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>

        <h3 className="mt-6 text-sm font-semibold text-gray-800">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setMessage('');
          }}
          maxLength={5000}
          rows={6}
          placeholder="Interview prep, contacts, salary talk..."
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!changed || saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save notes'}
          </button>
          {message && <span className="text-sm text-gray-600">{message}</span>}
        </div>

        <h3 className="mt-8 text-sm font-semibold text-gray-800">Timeline</h3>
        <ul className="mt-3 space-y-3 border-l border-gray-200 pl-4">
          {events.map((e, i) => (
            <li key={i} className="text-sm">
              <p className="text-gray-900">{e.text}</p>
              <p className="text-xs text-gray-500">{formatDateTime(e.date)}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}