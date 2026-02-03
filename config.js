// Конфигурация игры
const CONFIG = {
    // Начальные значения
    INITIAL_ENERGY: 1000,
    INITIAL_TAP_POWER: 1,
    ENERGY_REGEN_RATE: 1, // в секунду
    
    // Защита от читеров
    MAX_CLICKS_PER_SECOND: 15,
    CLICK_WINDOW_MS: 1000,
    
    // Система вывода
    MIN_WITHDRAW: 5000, // минимальная сумма вывода в тенге
    NK_TO_TENGE_RATE: 1, // курс конвертации
    
    // Улучшения
    upgrades: {
        multiTap: {
            name: 'Мульти-тап',
            icon: '👆',
            desc: 'Увеличивает монеты за клик',
            baseCost: 100,
            costMultiplier: 1.5,
            bonus: 1 // +1 к каждому клику
        },
        energyRegen: {
            name: 'Быстрая зарядка',
            icon: '⚡',
            desc: 'Энергия восполняется быстрее',
            baseCost: 500,
            costMultiplier: 1.6,
            bonus: 1 // +1 к регену в секунду
        },
        energyLimit: {
            name: 'Энергобак',
            icon: '🔋',
            desc: 'Увеличивает лимит энергии',
            baseCost: 300,
            costMultiplier: 1.4,
            bonus: 500 // +500 к максимуму
        },
        autoClicker: {
            name: 'Авто-бот',
            icon: '🤖',
            desc: 'Собирает монеты автоматически',
            baseCost: 2000,
            costMultiplier: 1.8,
            bonus: 100 // монет в час
        }
    },
    
    // Достижения
    achievements: {
        firstClick: {
            name: 'Первый клик',
            desc: 'Сделай свой первый клик',
            icon: '🎯',
            reward: 100,
            condition: (stats) => stats.totalClicks >= 1
        },
        clicks100: {
            name: 'Начинающий кликер',
            desc: 'Сделай 100 кликов',
            icon: '🏃',
            reward: 500,
            condition: (stats) => stats.totalClicks >= 100
        },
        clicks1000: {
            name: 'Опытный кликер',
            desc: 'Сделай 1000 кликов',
            icon: '💪',
            reward: 2000,
            condition: (stats) => stats.totalClicks >= 1000
        },
        coins10k: {
            name: 'Первые 10K',
            desc: 'Накопи 10 000 монет',
            icon: '💰',
            reward: 5000,
            condition: (stats) => stats.totalEarned >= 10000
        },
        coins100k: {
            name: 'Богач',
            desc: 'Накопи 100 000 монет',
            icon: '💎',
            reward: 20000,
            condition: (stats) => stats.totalEarned >= 100000
        },
        upgrade5: {
            name: 'Первые улучшения',
            desc: 'Купи 5 улучшений',
            icon: '🛍️',
            reward: 3000,
            condition: (stats) => stats.totalUpgrades >= 5
        },
        upgrade20: {
            name: 'Коллекционер',
            desc: 'Купи 20 улучшений',
            icon: '🎁',
            reward: 10000,
            condition: (stats) => stats.totalUpgrades >= 20
        }
    },
    
    // Ежедневные награды
    dailyRewards: [
        { day: 1, reward: 1000 },
        { day: 2, reward: 2000 },
        { day: 3, reward: 3000 },
        { day: 4, reward: 5000 },
        { day: 5, reward: 10000 },
        { day: 6, reward: 25000 },
        { day: 7, reward: 100000 }
    ],
    
    // Социальные задания
    socialQuests: {
        telegram: {
            name: 'Подпишись на Telegram',
            desc: 'Присоединись к нашему каналу',
            icon: '📱',
            reward: 5000,
            link: 'https://t.me/neoklin'
        },
        instagram: {
            name: 'Подпишись на Instagram',
            desc: 'Следи за новостями',
            icon: '📸',
            reward: 3000,
            link: 'https://instagram.com/neoklin'
        },
        share: {
            name: 'Поделись с друзьями',
            desc: 'Расскажи о Neo Klin',
            icon: '🔗',
            reward: 2000
        }
    },
    
    // Реферальная система
    REFERRAL_BONUS_PERCENT: 10, // 10% от кликов реферала
    REFERRAL_INVITE_BONUS: 5000 // бонус за приглашение
};