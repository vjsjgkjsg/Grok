// Система хранения данных
class Storage {
    constructor() {
        this.SAVE_KEY = 'neoklin_save';
        this.initializeData();
    }
    
    initializeData() {
        const saved = this.load();
        if (!saved) {
            this.data = this.getDefaultData();
            this.save();
        } else {
            this.data = saved;
            this.migrateData();
        }
    }
    
    getDefaultData() {
        return {
            balance: 0,
            energy: CONFIG.INITIAL_ENERGY,
            maxEnergy: CONFIG.INITIAL_ENERGY,
            tapPower: CONFIG.INITIAL_TAP_POWER,
            energyRegen: CONFIG.ENERGY_REGEN_RATE,
            totalClicks: 0,
            totalEarned: 0,
            totalUpgrades: 0,
            level: 1,
            autoIncomePerHour: 0,
            lastOnline: Date.now(),
            upgrades: {
                multiTap: 0,
                energyRegen: 0,
                energyLimit: 0,
                autoClicker: 0
            },
            achievements: {},
            dailyRewards: {
                lastClaim: 0,
                currentDay: 0,
                claimed: []
            },
            socialQuests: {
                telegram: false,
                instagram: false,
                share: false
            },
            referrals: {
                code: this.generateReferralCode(),
                invitedBy: null,
                count: 0,
                earnings: 0,
                list: []
            },
            withdrawHistory: [],
            antiCheat: {
                clicks: [],
                suspicious: false
            },
            createdAt: Date.now(),
            version: 1
        };
    }
    
    migrateData() {
        const defaults = this.getDefaultData();
        Object.keys(defaults).forEach(key => {
            if (!(key in this.data)) {
                this.data[key] = defaults[key];
            }
        });
        this.save();
    }
    
    generateReferralCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    save() {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения:', e);
            return false;
        }
    }
    
    load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            return null;
        }
    }
    
    get(key) {
        return this.data[key];
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save();
    }
    
    increment(key, amount = 1) {
        this.data[key] = (this.data[key] || 0) + amount;
        this.save();
    }
    
    reset() {
        if (confirm('Вы уверены? Весь прогресс будет удалён!')) {
            localStorage.removeItem(this.SAVE_KEY);
            this.initializeData();
            window.location.reload();
        }
    }
}

const storage = new Storage();