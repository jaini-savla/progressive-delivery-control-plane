const AUDIT_KEY = "progressiveDeliveryAuditLogs";

export function addAuditLog(
  action,
  resource,
  result = "Success",
  user = "System"
) {
  const savedLogs =
    localStorage.getItem(AUDIT_KEY);

  const logs = savedLogs
    ? JSON.parse(savedLogs)
    : [];

  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const newLog = {
    id: Date.now(),
    time,
    user,
    action,
    resource,
    result,
  };

  const updatedLogs = [
    newLog,
    ...logs,
  ];

  localStorage.setItem(
    AUDIT_KEY,
    JSON.stringify(updatedLogs)
  );
}