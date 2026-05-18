const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export const getCreatedDate = (created?: string) => {
  if (!created) {
    return new Date();
  }

  if (/^\d+$/.test(created)) {
    const numeric = Number(created);
    if (numeric > 1e12) {
      return new Date(numeric);
    }
    return new Date(numeric * 1000);
  }

  const parsed = new Date(created);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

export const minutesSince = (created?: string) => {
  const createdAt = getCreatedDate(created);
  const diff = Date.now() - createdAt.getTime();
  return Math.floor(diff / MINUTE);
};

export const timeAgoVi = (created?: string) => {
  const createdAt = getCreatedDate(created);
  const diff = Date.now() - createdAt.getTime();

  if (diff < MINUTE) {
    return 'vừa xong';
  }

  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE);
    return `${mins} phút trước`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} giờ trước`;
  }

  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days} ngày trước`;
  }

  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return `${weeks} tuần trước`;
  }

  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return `${months} tháng trước`;
  }

  const years = Math.floor(diff / YEAR);
  return `${years} năm trước`;
};
