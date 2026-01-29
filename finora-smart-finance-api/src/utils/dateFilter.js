function buildDateRangeFilter({ startDate, endDate } = {}, field = 'date') {
  const range = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      range.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (!isNaN(end.getTime())) {
      range.$lte = end;
    }
  }

  if (Object.keys(range).length === 0) {
    return {};
  }

  return { [field]: range };
}

module.exports = {
  buildDateRangeFilter,
};
