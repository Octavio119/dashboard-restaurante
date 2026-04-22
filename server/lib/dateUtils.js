const toDate  = (dateStr) => new Date(dateStr + 'T00:00:00.000Z');
const fromFilter = (dateStr) => ({ gte: toDate(dateStr) });

module.exports = { toDate, fromFilter };
