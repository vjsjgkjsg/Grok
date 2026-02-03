// Управление интерфейсом
class UI {
    constructor() {
        this.currentScreen = 'tap';
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.startUpdateLoop();
        this.setupEventListeners();
    }
    
    updateDisplay() {
        this.updateBalance();
        this.updateEnergy();
        this.updateStats();
        this.updateUpgrades();
        this.updateLevel();
    }
    
    updateBalance() {
        const balance = storage.get('balance');
        document.getElementById('balance').textContent = formatNumber(Math.floor(balance));
    }
    
    updateEnergy() {
        const energy = storage.get('energy');
        const maxEnergy = game.getMaxEnergy();
        const percent = (energy / maxEnergy) * 100;
        
        document.getElementById('energyBar').style.width = percent + '%';
        document.getElementById('energyText').textContent = `${Math.floor(energy)}/${maxEnergy}`;
    }
    
    updateStats() {
        const tapPower = game.getTapPower();
        const totalClicks = storage.get('totalClicks');
        const autoIncome = storage.get('autoIncomePerHour');
        
        document.getElementById('tapPower').textContent = tapPower;
        document.getElementById('totalClicks').textContent = formatNumber(totalClicks);
        document.getElementById('autoIncome').textContent = formatNumber(Math.floor(autoIncome));
    }
    
    updateLevel() {
        const level = storage.get('level');
        document.getElementById('userLevel').textContent = level;
    }
    
    updateUpgrades() {
        const container = document.getElementById('upgradesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.keys(CONFIG.upgrades).forEach(key => {
            const config = CONFIG.upgrades[key];
            const level = storage.get('upgrades')[key];
            const cost = game.getUpgradeCost(config, level);
            const balance = storage.get('balance');
            const canAfford = balance >= cost;
            
            const card = document.createElement('div');
            card.className = `upgrade-card ${!canAfford ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="upgrade-icon">${config.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${config.name}</div>
                    <div class="upgrade-desc">${config.desc}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Уровень: ${level}</span>
                        <span class="upgrade-cost ${canAfford ? 'affordable' : ''}">
                            ${formatNumber(cost)} NK
                        </span>
                    </div>
                </div>
            `;
            
            if (canAfford) {
                card.onclick = () => {
                    if (game.buyUpgrade(key)) {
                        this.updateDisplay();
                    }
                };
            }
            
            container.appendChild(card);
        });
    }
    
    renderDailyRewards() {
        const container = document.getElementById('dailyGrid');
        if (!container) return;
        
        container.innerHTML = '';
        const dailyData = storage.get('dailyRewards');
        const currentDay = dailyData.currentDay;
        const claimed = dailyData.claimed;
        
        CONFIG.dailyRewards.forEach((reward, index) => {
            const day = index + 1;
            const isClaimed = claimed.includes(day);
            const isToday = day === currentDay + 1;
            
            const item = document.createElement('div');
            item.className = `daily-item ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}`;
            item.innerHTML = `
                <div class="daily-day">День ${day}</div>
                <div class="daily-reward">${formatNumber(reward.reward)}</div>
            `;
            
            if (isToday && !isClaimed) {
                item.onclick = () => {
                    if (game.claimDailyReward(day)) {
                        this.renderDailyRewards();
                        this.updateDisplay();
                    }
                };
                item.style.cursor = 'pointer';
            }
            
            container.appendChild(item);
        });
    }
    
    renderAchievements() {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        container.innerHTML = '';
        const achievements = storage.get('achievements');
        const stats = {
            totalClicks: storage.get('totalClicks'),
            totalEarned: storage.get('totalEarned'),
            totalUpgrades: storage.get('totalUpgrades')
        };
        
        Object.keys(CONFIG.achievements).forEach(key => {
            const achievement = CONFIG.achievements[key];
            const unlocked = achievements[key];
            
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
                <div class="achievement-reward">
                    ${unlocked ? '✅' : `+${formatNumber(achievement.reward)}`}
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    renderSocialQuests() {
        const container = document.getElementById('socialList');
        if (!container) return;
        
        container.innerHTML = '';
        const quests = storage.get('socialQuests');
        
        Object.keys(CONFIG.socialQuests).forEach(key => {
            const quest = CONFIG.socialQuests[key];
            const completed = quests[key];
            
            const item = document.createElement('div');
            item.className = `social-item ${completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="social-icon">${quest.icon}</div>
                <div class="social-info">
                    <div class="social-name">${quest.name}</div>
                    <div class="social-desc">${quest.desc}</div>
                </div>
                <div class="social-reward">
                    ${completed ? '✅' : `+${formatNumber(quest.reward)}`}
                </div>
            `;
            
            if (!completed) {
                item.onclick = () => {
                    game.completeSocialQuest(key);
                    setTimeout(() => {
                        this.renderSocialQuests();
                        this.updateDisplay();
                    }, 2100);
                };
            }
            
            container.appendChild(item);
        });
    }
    
    updateWallet() {
        const balance = storage.get('balance');
        const tenge = Math.floor(balance * CONFIG.NK_TO_TENGE_RATE);
        
        document.getElementById('withdrawBalance').textContent = `${formatNumber(tenge)} ₸`;
        document.getElementById('withdrawCurrent').textContent = formatNumber(tenge);
        
        const progress = Math.min((tenge / CONFIG.MIN_WITHDRAW) * 100, 100);
        document.getElementById('withdrawProgress').style.width = progress + '%';
        
        const btn = document.getElementById('withdrawBtn');
        btn.disabled = tenge < CONFIG.MIN_WITHDRAW;
        
        this.renderWithdrawHistory();
    }
    
    renderWithdrawHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        const history = storage.get('withdrawHistory');
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <p>Пока нет заявок на вывод</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div class="history-date">${item.date}</div>
                    <div class="history-amount">${formatNumber(item.amount)} ₸</div>
                </div>
                <div class="history-status ${item.status}">
                    ${item.status === 'pending' ? 'В обработке' : 'Выплачено'}
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    updateReferrals() {
        const refData = storage.get('referrals');
        
        document.getElementById('refCount').textContent = refData.count;
        document.getElementById('refEarnings').textContent = formatNumber(refData.earnings);
        document.getElementById('refLink').value = `https://neoklin.kz/ref/${refData.code}`;
        
        this.renderReferralList();
    }
    
    renderReferralList() {
        const container = document.getElementById('refListContainer');
        if (!container) return;
        
        const refData = storage.get('referrals');
        
        if (refData.list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <p>Пригласи первого друга!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        refData.list.forEach(ref => {
            const div = document.createElement('div');
            div.className = 'ref-item';
            div.innerHTML = `
                <div class="ref-name">${ref.name}</div>
                <div class="ref-earnings">+${formatNumber(ref.earnings)}</div>
            `;
            container.appendChild(div);
        });
    }
    
    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(`${screenName}-screen`).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');
        
        this.currentScreen = screenName;
        
        if (screenName === 'quests') {
            this.renderDailyRewards();
            this.renderAchievements();
            this.renderSocialQuests();
        } else if (screenName === 'wallet') {
            this.updateWallet();
        } else if (screenName === 'referrals') {
            this.updateReferrals();
        } else if (screenName === 'shop') {
            this.updateUpgrades();
        }
    }
    
    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScreen(btn.dataset.screen);
            });
        });
        
        const coinBtn = document.getElementById('coinBtn');
        coinBtn.addEventListener('click', (e) => {
            game.handleClick(e);
            this.updateDisplay();
            
            coinBtn.classList.add('clicked');
            setTimeout(() => coinBtn.classList.remove('clicked'), 600);
        });
        
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => {
                const amount = parseInt(document.getElementById('withdrawAmount').value);
                const method = document.getElementById('withdrawMethod').value;
                const number = document.getElementById('withdrawNumber').value;
                
                if (!number) {
                    showToast('Укажите номер для вывода!');
                    return;
                }
                
                if (game.submitWithdraw(amount, method, number)) {
                    this.updateDisplay();
                    this.updateWallet();
                    
                    document.getElementById('withdrawAmount').value = '';
                    document.getElementById('withdrawNumber').value = '';
                }
            });
        }
        
        const copyBtn = document.getElementById('copyRefBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const link = document.getElementById('refLink');
                link.select();
                document.execCommand('copy');
                showToast('✅ Ссылка скопирована!');
            });
        }
        
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const link = document.getElementById('refLink').value;
                const text = `Присоединяйся к Neo Klin и зарабатывай реальные деньги! ${link}`;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'Neo Klin',
                        text: text
                    });
                } else {
                    navigator.clipboard.writeText(text);
                    showToast('✅ Текст скопирован!');
                }
            });
        }
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.updateBalance();
            this.updateEnergy();
            this.updateStats();
        }, 100);
    }
}

const ui = new UI();