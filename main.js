// Главный файл с вспомогательными функциями

// Форматирование чисел
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return Math.floor(num).toString();
}

// Показать тост-уведомление
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Закрыть модальное окно
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Вибрация (для мобильных)
function vibrate(duration = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Проверка на мобильное устройство
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Neo Klin загружен!');
    console.log('Версия:', storage.get('version'));
    
    // Показываем приветствие для новых игроков
    if (storage.get('totalClicks') === 0) {
        setTimeout(() => {
            showToast('👋 Добро пожаловать в Neo Klin! Начни кликать!');
        }, 1000);
    }
    
    // Уведомление о полной энергии
    setInterval(() => {
        const energy = storage.get('energy');
        const maxEnergy = game.getMaxEnergy();
        
        if (energy === maxEnergy && document.hidden) {
            if (Notification.permission === 'granted') {
                new Notification('Neo Klin', {
                    body: '⚡ Энергия полная! Пора тапать!',
                    icon: 'images/logo.png'
                });
            }
        }
    }, 60000); // Проверка каждую минуту
    
    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission();
        }, 5000);
    }
    
    // Сохранение при выходе
    window.addEventListener('beforeunload', () => {
        storage.set('lastOnline', Date.now());
        storage.save();
    });
    
    // Скрытие/показ страницы
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            storage.set('lastOnline', Date.now());
        } else {
            game.calculateOfflineIncome();
            ui.updateDisplay();
        }
    });
});

// Вспомогательные команды для разработки (можно удалить в продакшене)
window.debugCommands = {
    addCoins: (amount) => {
        storage.increment('balance', amount);
        ui.updateDisplay();
        console.log(`Добавлено ${amount} монет`);
    },
    
    fillEnergy: () => {
        storage.set('energy', game.getMaxEnergy());
        ui.updateDisplay();
        console.log('Энергия восстановлена');
    },
    
    unlockAll: () => {
        const achievements = {};
        Object.keys(CONFIG.achievements).forEach(key => {
            achievements[key] = true;
        });
        storage.set('achievements', achievements);
        ui.renderAchievements();
        console.log('Все достижения разблокированы');
    },
    
    reset: () => {
        storage.reset();
    },
    
    showStats: () => {
        console.log('=== СТАТИСТИКА ===');
        console.log('Баланс:', storage.get('balance'));
        console.log('Всего заработано:', storage.get('totalEarned'));
        console.log('Всего кликов:', storage.get('totalClicks'));
        console.log('Уровень:', storage.get('level'));
        console.log('Улучшения:', storage.get('upgrades'));
        console.log('Авто-доход/час:', storage.get('autoIncomePerHour'));
    }
};

console.log('💎 Neo Klin v1.0');
console.log('Команды разработчика доступны через window.debugCommands');
console.log('Пример: debugCommands.addCoins(10000)');