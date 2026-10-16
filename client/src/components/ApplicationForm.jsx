import { useState } from 'react';
import { getErrorMessage } from '../api/axios';
import { STATUSES, STATUS_META } from '../constants';

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function ApplicationForm({ initial, defaultStatus = 'wishlist', onSubmit, onClose }) {
  const isEdit = Boolean(initial);

  const [form, setForm] = useState({
    company: initial?.company || '',
    position: initial?.position || '',
    location: initial?.location || '',
    jobUrl: initial?.jobUrl || '',
    salary: initial?.salary || '',
    status: initial?.status || defaultStatus,
    deadline: toDateInput(initial?.deadline),
    notes: initial?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, deadline: form.deadline || null };
      // Editing never changes the column; dragging the card does that
      if (isEdit) delete payload.status;
      await onSubmit(payload);
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit application' : 'Add application'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company *</label>
              <input
                name="company"
                required
                value={form.company}
                onChange={update}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position *</label>
              <input
                name="position"
                required
                value={form.position}
                onChange={update}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input name="location" value={form.location} onChange={update} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary</label>
              <input
                name="salary"
                value={form.salary}
                onChange={update}
                placeholder="e.g. $90k"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={update}
                className={inputClass}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Column</label>
                <select name="status" value={form.status} onChange={update} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Job posting link</label>
            <input
              name="jobUrl"
              value={form.jobUrl}
              onChange={update}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={update}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
