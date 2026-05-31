import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { getUserById, formatDate, timeAgo } from "../../utils/helpers";

const AUDIENCE_OPTIONS = [
  { value: "all_drivers", label: "All Drivers" },
  { value: "depot:D1", label: "Depot: Noida Sec-37" },
  { value: "depot:D2", label: "Depot: Anand Vihar" },
  { value: "depot:D3", label: "Depot: Ghaziabad" },
  { value: "depot:D4", label: "Depot: Sahibabad" },
];

function audienceLabel(value) {
  return AUDIENCE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function CreateNoticeModal({ onClose, onSave, createdBy }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_drivers");
  const [requiresAck, setRequiresAck] = useState(false);
  const [publishAt, setPublishAt] = useState(todayIso());
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!body.trim()) e.body = "Body is required";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    onSave({
      id: `N${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience,
      requires_ack: requiresAck,
      publish_at: new Date(publishAt).toISOString(),
      created_by: createdBy,
    });
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">
          Create Notice
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notice title"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write the notice content here…"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.body ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.body && (
            <p className="text-xs text-red-500 mt-1">{errors.body}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Audience
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Publish Date
          </label>
          <input
            type="date"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            Requires acknowledgement
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Publish Notice
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReadReceiptsPanel({ notice, users, noticeReads, allDrivers }) {
  const receipts = noticeReads.filter((r) => r.notice_id === notice.id);
  const readMap = Object.fromEntries(
    receipts.map((r) => [r.user_id, r.read_at]),
  );

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-4 py-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Read Receipts
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left pb-2 text-xs font-semibold text-slate-500">
                Driver
              </th>
              <th className="text-left pb-2 text-xs font-semibold text-slate-500">
                Status
              </th>
              <th className="text-left pb-2 text-xs font-semibold text-slate-500">
                Read At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allDrivers.map((driver) => {
              const readAt = readMap[driver.id];
              return (
                <tr key={driver.id}>
                  <td className="py-2 text-slate-700">{driver.full_name}</td>
                  <td className="py-2">
                    {readAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                        Not read
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-slate-400 text-xs">
                    {readAt ? timeAgo(readAt) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminView({ user, notices, noticeReads, users, addNotice }) {
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const allDrivers = users.filter((u) => u.role === "driver");
  const sorted = [...notices].sort(
    (a, b) => new Date(b.publish_at) - new Date(a.publish_at),
  );

  function getAudienceDrivers(notice) {
    if (notice.audience === "all_drivers") return allDrivers;
    if (notice.audience.startsWith("depot:")) {
      const depotId = notice.audience.split(":")[1];
      return allDrivers.filter((u) => u.depot_id === depotId);
    }
    return [];
  }

  function getReadCount(notice) {
    const audienceDrivers = getAudienceDrivers(notice);
    const audienceIds = new Set(audienceDrivers.map((u) => u.id));
    return noticeReads.filter(
      (r) => r.notice_id === notice.id && audienceIds.has(r.user_id),
    ).length;
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const creatorName = (id) => {
    const u = getUserById(users, id);
    return u ? u.full_name : id;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and manage driver communications.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Notice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-600">No notices yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first notice above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Audience
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Publish Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Reads
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Created By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Ack?
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((notice) => {
                  const audienceDrivers = getAudienceDrivers(notice);
                  const readCount = getReadCount(notice);
                  const isExpanded = expandedId === notice.id;

                  return (
                    <>
                      <tr
                        key={notice.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? "bg-blue-50/40" : ""}`}
                        onClick={() => toggleExpand(notice.id)}
                      >
                        <td className="px-4 py-3 text-slate-800 font-medium max-w-xs truncate">
                          {notice.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {audienceLabel(notice.audience)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {formatDate(notice.publish_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-slate-700 font-medium">
                            {readCount}
                          </span>
                          <span className="text-slate-400">
                            {" "}
                            / {audienceDrivers.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {creatorName(notice.created_by)}
                        </td>
                        <td className="px-4 py-3">
                          {notice.requires_ack ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <svg
                            className={`w-4 h-4 text-slate-400 inline transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr
                          key={`${notice.id}-receipts`}
                          className="border-b border-slate-100"
                        >
                          <td colSpan={7} className="p-0">
                            <ReadReceiptsPanel
                              notice={notice}
                              users={users}
                              noticeReads={noticeReads}
                              allDrivers={audienceDrivers}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateNoticeModal
          onClose={() => setShowModal(false)}
          onSave={addNotice}
          createdBy={user.id}
        />
      )}
    </div>
  );
}

function DriverView({ user, notices, noticeReads, markNoticeRead }) {
  const myNotices = notices.filter(
    (n) =>
      n.audience === "all_drivers" || n.audience === `depot:${user.depot_id}`,
  );
  const sorted = [...myNotices].sort(
    (a, b) => new Date(b.publish_at) - new Date(a.publish_at),
  );

  function isRead(noticeId) {
    return noticeReads.some(
      (r) => r.notice_id === noticeId && r.user_id === user.id,
    );
  }

  function handleClick(notice) {
    if (!isRead(notice.id)) {
      markNoticeRead(notice.id, user.id);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Notices</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Important updates from your depot and operations team.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">
            No notices for you yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((notice) => {
            const read = isRead(notice.id);
            return (
              <div
                key={notice.id}
                onClick={() => handleClick(notice)}
                className={`bg-white rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  read
                    ? "border-slate-200"
                    : "border-blue-200 border-l-4 border-l-blue-500"
                }`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                      className={`text-sm font-semibold leading-snug ${read ? "text-slate-700" : "text-slate-900"}`}
                    >
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notice.requires_ack && read && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Acknowledged
                        </span>
                      )}
                      {!read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {notice.body}
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    {formatDate(notice.publish_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CMSPage() {
  const { user } = useAuth();
  const { notices, noticeReads, users, addNotice, markNoticeRead } = useData();

  if (!user) return null;

  if (user.role === "driver") {
    return (
      <DriverView
        user={user}
        notices={notices}
        noticeReads={noticeReads}
        markNoticeRead={markNoticeRead}
      />
    );
  }

  return (
    <AdminView
      user={user}
      notices={notices}
      noticeReads={noticeReads}
      users={users}
      addNotice={addNotice}
    />
  );
}
