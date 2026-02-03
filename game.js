// Основная игровая логика
class Game {
    constructor() {
        this.clickTimes = [];
        this.lastEnergyUpdate = Date.now();
        this.init();
    }
    
    init() {
        this.calculateOfflineIncome();
        this.startEnergyRegen();
        this.startAutoIncome();
        this.updateLevel();
    }
    
    // Подсчёт офлайн дохода
    calculateOfflineIncome() {
        const now = Date.now();
        const lastOnline = storage.get('lastOnline');
        const autoIncome = storage.get('autoIncomePerHour');
        
        if (autoIncome > 0) {
            const offlineTime = Math.min(now - lastOnline, 3 * 60 * 60 * 1000); // макс 3 часа
            const earned = Math.floor((offlineTime / 1000 / 60 / 60) * autoIncome);
            
            if (earned > 0) {
                storage.increment('balance', earned);
                showToast(`Пока вас не было, заработано: ${formatNumber(earned)} NK!`);
            }
        }
        
        storage.set('lastOnline', now);
    }
    
    // Обработка клика
    handleClick(e) {
        // Защита от читеров
        if (!this.checkAntiCheat()) {
            showToast('⚠️ Обнаружена подозрительная активность!');
            storage.set('antiCheat', {
                ...storage.get('antiCheat'),
                suspicious: true
            });
            return;
        }
        
        // Проверка энергии
        const energy = storage.get('energy');
        if (energy <= 0) {
            showToast('Энергия закончилась! Подожди восстановления.');
            return;
        }
        
        // Получаем силу клика
        const tapPower = this.getTapPower();
        
        // Добавляем монеты
        storage.increment('balance', tapPower);
        storage.increment('totalEarned', tapPower);
        storage.increment('totalClicks', 1);
        storage.set('energy', energy - 1);
        
        // Визуальный эффект
        this.showFloatingNumber(e.clientX, e.clientY, `+${tapPower}`);
        
        // Проверка достижений
        this.checkAchievements();
        
        // Обновление уровня
        this.updateLevel();
    }
    
    // Получение силы клика
    getTapPower() {
        const basePower = storage.get('tapPower');
        const multiTap = storage.get('upgrades').multiTap;
        return basePower + (multiTap * CONFIG.upgrades.multiTap.bonus);
    }
    
    // Античит система
    checkAntiCheat() {
        const now = Date.now();
        this.clickTimes.push(now);
        
        // Удаляем старые клики
        this.clickTimes = this.clickTimes.filter(
            time => now - time < CONFIG.CLICK_WINDOW_MS
        );
        
        // Проверка лимита
        return this.clickTimes.length <= CONFIG.MAX_CLICKS_PER_SECOND;
    }
    
    // Восстановление энергии
    startEnergyRegen() {
        setInterval(() => {
            const energy = storage.get('energy');
            const maxEnergy = this.getMaxEnergy();
            const regenRate = this.getEnergyRegen();
            
            if (energy < maxEnergy) {
                storage.set('energy', Math.min(energy + regenRate, maxEnergy));
            }
        }, 1000);
    }
    
    // Получение макс энергии
    getMaxEnergy() {
        const base = CONFIG.INITIAL_ENERGY;
        const energyLimit = storage.get('upgrades').energyLimit;
        return base + (energyLimit * CONFIG.upgrades.energyLimit.bonus);
    }
    
    // Получение скорости регена
    getEnergyRegen() {
        const base = CONFIG.ENERGY_REGEN_RATE;
        const energyRegen = storage.get('upgrades').energyRegen;
        return base + (energyRegen * CONFIG.upgrades.energyRegen.bonus);
    }
    
    // Авто-доход
    startAutoIncome() {
        setInterval(() => {
            const autoIncome = storage.get('autoIncomePerHour');
            if (autoIncome > 0) {
                const perSecond = autoIncome / 3600;
                storage.increment('balance', perSecond);
                storage.increment('totalEarned', perSecond);
            }
        }, 1000);
    }
    
    // Покупка улучшения
    buyUpgrade(upgradeKey) {
        const config = CONFIG.upgrades[upgradeKey];
        const currentLevel = storage.get('upgrades')[upgradeKey];
        const cost = this.getUpgradeCost(config, currentLevel);
        const balance = storage.get('balance');
        
        if (balance < cost) {
            showToast('Недостаточно монет!');
            return false;
        }
        
        // Покупка
        storage.set('balance', balance - cost);
        const upgrades = storage.get('upgrades');
        upgrades[upgradeKey] = currentLevel + 1;
        storage.set('upgrades', upgrades);
        storage.increment('totalUpgrades', 1);
        
        // Обновляем параметры
        this.updateGameStats(upgradeKey);
        
        showToast(`✨ Куплено: ${config.name} (Ур. ${currentLevel + 1})`);
        this.checkAchievements();
        
        return true;
    }
    
    // Расчёт стоимости улучшения
    getUpgradeCost(config, level) {
        return Math.floor(config.baseCost * Math.pow(config.costMultiplier, level));
    }
    
    // Обновление игровых параметров
    updateGameStats(upgradeKey) {
        if (upgradeKey === 'autoClicker') {
            const level = storage.get('upgrades').autoClicker;
            const perHour = level * CONFIG.upgrades.autoClicker.bonus;
            storage.set('autoIncomePerHour', perHour);
        }
        
        storage.set('maxEnergy', this.getMaxEnergy());
    }
    
    // Проверка достижений
    checkAchievements() {
        const stats = {
            totalClicks: storage.get('totalClicks'),
            totalEarned: storage.get('totalEarned'),
            totalUpgrades: storage.get('totalUpgrades')
        };
        
        const achievements = storage.get('achievements');
        
        Object.keys(CONFIG.achievements).forEach(key => {
            if (!achievements[key]) {
                const achievement = CONFIG.achievements[key];
                if (achievement.condition(stats)) {
                    achievements[key] = true;
                    storage.set('achievements', achievements);
                    storage.increment('balance', achievement.reward);
                    this.showAchievement(achievement);
                }
            }
        });
    }
    
    // Показать достижение
    showAchievement(achievement) {
        const modal = document.getElementById('achievementModal');
        document.getElementById('achievementTitle').textContent = achievement.icon + ' ' + achievement.name;
        document.getElementById('achievementDesc').textContent = achievement.desc;
        document.getElementById('achievementReward').textContent = `+${formatNumber(achievement.reward)} NK`;
        modal.classList.add('show');
        
        // Звук (если добавим)
        // playSound('achievement');
    }
    
    // Обновление уровня
    updateLevel() {
        const totalEarned = storage.get('totalEarned');
        const newLevel = Math.floor(Math.sqrt(totalEarned / 1000)) + 1;
        storage.set('level', newLevel);
    }
    
    // Показать плавающее число
    showFloatingNumber(x, y, text) {
        const floatingNum = document.createElement('div');
        floatingNum.className = 'floating-number';
        floatingNum.textContent = text;
        floatingNum.style.left = x + 'px';
        floatingNum.style.top = y + 'px';
        document.body.appendChild(floatingNum);
        
        setTimeout(() => floatingNum.remove(), 1000);
    }
    
    // Сбор ежедневной награды
    claimDailyReward(day) {
        const dailyData = storage.get('dailyRewards');
        const now = Date.now();
        const lastClaim = dailyData.lastClaim;
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Проверка: прошло ли 24 часа
        if (now - lastClaim < oneDayMs && dailyData.currentDay !== 0) {
            showToast('Приходи завтра за наградой!');
            return false;
        }
        
        // Проверка: сброс при пропуске дня
        if (now - lastClaim > 2 * oneDayMs && dailyData.currentDay !== 0) {
            dailyData.currentDay = 0;
            dailyData.claimed = [];
        }
        
        // Сбор награды
        const reward = CONFIG.dailyRewards[day - 1].reward;
        storage.increment('balance', reward);
        
        dailyData.claimed.push(day);
        dailyData.currentDay = day;
        dailyData.lastClaim = now;
        storage.set('dailyRewards', dailyData);
        
        showToast(`🎁 Получено: ${formatNumber(reward)} NK!`);
        return true;
    }
    
    // Выполнение социального задания
    completeSocialQuest(questKey) {
        const quests = storage.get('socialQuests');
        
        if (quests[questKey]) {
            showToast('Задание уже выполнено!');
            return false;
        }
        
        const quest = CONFIG.socialQuests[questKey];
        
        // Открываем ссылку (если есть)
        if (quest.link) {
            window.open(quest.link, '_blank');
        }
        
        // Для подтверждения (в реальном приложении нужна проверка на сервере)
        setTimeout(() => {
            quests[questKey] = true;
            storage.set('socialQuests', quests);
            storage.increment('balance', quest.reward);
            showToast(`✅ ${quest.name}: +${formatNumber(quest.reward)} NK!`);
        }, 2000);
        
        return true;
    }
    
    // Подать заявку на вывод
    submitWithdraw(amount, method, number) {
        const balance = storage.get('balance');
        
        if (amount < CONFIG.MIN_WITHDRAW) {
            showToast(`Минимальная сумма: ${CONFIG.MIN_WITHDRAW} ₸`);
            return false;
        }
        
        const nkAmount = amount / CONFIG.NK_TO_TENGE_RATE;
        
        if (balance < nkAmount) {
            showToast('Недостаточно средств!');
            return false;
        }
        
        // Создаём заявку
        const withdraw = {
            id: Date.now(),
            amount: amount,
            method: method,
            number: number,
            status: 'pending',
            date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Списываем с баланса
        storage.set('balance', balance - nkAmount);
        
        // Добавляем в историю
        const history = storage.get('withdrawHistory');
        history.unshift(withdraw);
        storage.set('withdrawHistory', history);
        
        showToast('✅ Заявка отправлена! Ожидайте обработки.');
        return true;
    }
}

// Создаём экземпляр игры
const game = new Game();