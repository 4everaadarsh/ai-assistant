const settingsService = require('../services/settingsService');

class SettingsController {
    async getFullState(req, res, next) {
        try {
            const state = await settingsService.getFullState();
            res.json(state);
        } catch (e) {
            next(e);
        }
    }

    async updateSettings(req, res, next) {
        try {
            const result = await settingsService.updateSettings(req.body);
            res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async markAllNotificationsRead(req, res, next) {
        try {
            const result = await settingsService.markAllNotificationsRead();
            res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async addReceptionistLog(req, res, next) {
        try {
            const result = await settingsService.addReceptionistLog(req.body);
            res.status(201).json(result);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new SettingsController();
