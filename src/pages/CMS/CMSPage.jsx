import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { getUserById, formatDate, timeAgo } from "../../utils/helpers";
import styles from "./CMS.module.css";

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
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>{children}</div>
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
      <div className={styles.modalHeader}>
        <h2 className={styles.modalTitle}>Create Notice</h2>
        <button
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
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

      <form onSubmit={handleSubmit} className={styles.modalBody}>
        <div className={styles.formField}>
          <label className={styles.label}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notice title"
            className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
          />
          {errors.title && <p className={styles.fieldError}>{errors.title}</p>}
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Write the notice content here…"
            className={`${styles.input} ${styles.textarea} ${errors.body ? styles.inputError : ""}`}
          />
          {errors.body && <p className={styles.fieldError}>{errors.body}</p>}
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={styles.select}
          >
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Publish Date</label>
          <input
            type="date"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className={styles.input}
          />
        </div>

        <label
          className={styles.checkboxRow}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
          />
          <span className={styles.checkboxLabel}>Requires acknowledgement</span>
        </label>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Publish Notice
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReadReceiptsPanel({ notice, noticeReads, allDrivers }) {
  const receipts = noticeReads.filter((r) => r.notice_id === notice.id);
  const readMap = Object.fromEntries(
    receipts.map((r) => [r.user_id, r.read_at]),
  );

  return (
    <div className={styles.receiptsPanel}>
      <p className={styles.receiptsLabel}>Read Receipts</p>
      <div className="overflow-x-auto">
        <table className={styles.receiptsTable}>
          <thead>
            <tr>
              <th className={styles.receiptsTh}>Driver</th>
              <th className={styles.receiptsTh}>Status</th>
              <th className={styles.receiptsTh}>Read At</th>
            </tr>
          </thead>
          <tbody>
            {allDrivers.map((driver) => {
              const readAt = readMap[driver.id];
              return (
                <tr key={driver.id}>
                  <td className={styles.receiptsTd}>{driver.full_name}</td>
                  <td className={styles.receiptsTd}>
                    {readAt ? (
                      <span className={`${styles.badge} ${styles.badgeRead}`}>
                        <svg
                          width="10"
                          height="10"
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
                      <span className={`${styles.badge} ${styles.badgeUnread}`}>
                        Not read
                      </span>
                    )}
                  </td>
                  <td className={styles.receiptsTdMuted}>
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
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Notices</h1>
          <p className={styles.pageSubtitle}>
            Create and manage driver communications.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <svg
            width="14"
            height="14"
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

      <div className={styles.card}>
        {sorted.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No notices yet.</p>
            <p>Create your first notice above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Title</th>
                  <th className={styles.th}>Audience</th>
                  <th className={styles.th}>Publish Date</th>
                  <th className={styles.th}>Reads</th>
                  <th className={styles.th}>Created By</th>
                  <th className={styles.th}>Ack?</th>
                  <th className={styles.th} />
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
                        className={`${styles.tr} ${isExpanded ? styles.trExpanded : ""}`}
                        onClick={() => toggleExpand(notice.id)}
                      >
                        <td className={styles.td} style={{ maxWidth: "260px" }}>
                          <span
                            style={{
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notice.title}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span
                            className={`${styles.badge} ${styles.badgeAudience}`}
                          >
                            {audienceLabel(notice.audience)}
                          </span>
                        </td>
                        <td
                          className={styles.td}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {formatDate(notice.publish_at)}
                        </td>
                        <td
                          className={styles.td}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {readCount}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>
                            {" "}
                            / {audienceDrivers.length}
                          </span>
                        </td>
                        <td className={styles.td}>
                          {creatorName(notice.created_by)}
                        </td>
                        <td className={styles.td}>
                          {notice.requires_ack ? (
                            <span
                              className={`${styles.badge} ${styles.badgeAck}`}
                            >
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                              —
                            </span>
                          )}
                        </td>
                        <td
                          className={styles.td}
                          style={{ textAlign: "right" }}
                        >
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color: "var(--text-muted)",
                              display: "inline",
                              transition: "transform 0.18s ease",
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
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
                        <tr key={`${notice.id}-receipts`}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <ReadReceiptsPanel
                              notice={notice}
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
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Notices</h1>
          <p className={styles.pageSubtitle}>
            Important updates from your depot and operations team.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              color: "var(--text-muted)",
              display: "block",
              margin: "0 auto var(--sp-3)",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p>No notices for you yet.</p>
        </div>
      ) : (
        <div className={styles.noticeList}>
          {sorted.map((notice) => {
            const read = isRead(notice.id);
            return (
              <div
                key={notice.id}
                onClick={() => handleClick(notice)}
                className={`${styles.noticeCard} ${read ? styles.noticeCardRead : styles.noticeCardUnread}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className={styles.noticeTitle}>{notice.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {notice.requires_ack && read && (
                      <span className={`${styles.badge} ${styles.badgeRead}`}>
                        <svg
                          width="10"
                          height="10"
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
                    {!read && <span className={styles.unreadDot} />}
                  </div>
                </div>
                <p className={styles.noticeBody}>{notice.body}</p>
                <div className={styles.noticeMeta}>
                  <span>{formatDate(notice.publish_at)}</span>
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
