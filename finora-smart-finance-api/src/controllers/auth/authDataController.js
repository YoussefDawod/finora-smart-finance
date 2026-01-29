const dataService = require('../../services/dataService');
const { isMockFn } = require('./sharedAuthUtils');

async function exportData(req, res) {
  try {
    if (isMockFn(dataService.exportUserData)) {
      const result = await dataService.exportUserData(req.user?.id || req.user?._id, req.user);
      if (!result || result.exported === false) {
        return res.status(500).json(result || { error: 'Export fehlgeschlagen' });
      }
      return res.status(200).json(result);
    }

    const result = await dataService.exportUserData(req.user._id, req.user);
    return res.status(200).json({ success: true, data: { message: result.message, export: result.export }, exported: true });
  } catch (err) {
    return res.status(500).json({ error: 'Datenexport fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

async function deleteTransactions(req, res) {
  try {
    const { password } = req.body || {};
    const result = await dataService.deleteAllTransactions(req.user._id, password, req.user);

    if (!result.deleted) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    return res.status(200).json({
      success: true,
      data: { message: result.message, deletedCount: result.deletedCount },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Transaktionenlöschung fehlgeschlagen', code: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = {
  exportData,
  deleteTransactions,
};
