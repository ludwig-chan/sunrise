import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameLog, emitter } from '../utils/eventBus'

export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER'
export type Weather = 'SUNNY' | 'RAINY' | 'WINDY' | 'SNOWY' | 'HAIL' | 'SANDSTORM' | 'HAZE'
export type DayPeriod = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT'

export type TimePeriod = {
  start: number;
  end: number;
}

export type SeasonPeriods = {
  dawn: TimePeriod;
  day: TimePeriod;
  dusk: TimePeriod;
  night: TimePeriod;
}

export type SeasonalPeriods = Record<Season, SeasonPeriods>

// 判断当前小时是否在指定时段内
function isInPeriod(hour: number, period: TimePeriod) {
  if (period.start < period.end) {
    return hour >= period.start && hour < period.end
  } else {
    // 处理跨日的情况（比如夜晚的20点到第二天5点）
    return hour >= period.start || hour < period.end
  }
}

// 定义各个季节的时段分布
const seasonalPeriods: SeasonalPeriods = {
  'SPRING': {
    dawn: { start: 5, end: 7 },    // 春季黎明：5-7点
    day: { start: 7, end: 18 },    // 春季白天：7-18点
    dusk: { start: 18, end: 20 },  // 春季黄昏：18-20点
    night: { start: 20, end: 5 }   // 春季夜晚：20-5点
  },
  'SUMMER': {
    dawn: { start: 4, end: 6 },    // 夏季黎明：4-6点
    day: { start: 6, end: 19 },    // 夏季白天：6-19点
    dusk: { start: 19, end: 21 },  // 夏季黄昏：19-21点
    night: { start: 21, end: 4 }   // 夏季夜晚：21-4点
  },
  'AUTUMN': {
    dawn: { start: 6, end: 8 },    // 秋季黎明：6-8点
    day: { start: 8, end: 17 },    // 秋季白天：8-17点
    dusk: { start: 17, end: 19 },  // 秋季黄昏：17-19点
    night: { start: 19, end: 6 }   // 秋季夜晚：19-6点
  },
  'WINTER': {
    dawn: { start: 7, end: 9 },    // 冬季黎明：7-9点
    day: { start: 9, end: 16 },    // 冬季白天：9-16点
    dusk: { start: 16, end: 18 },  // 冬季黄昏：16-18点
    night: { start: 18, end: 7 }   // 冬季夜晚：18-7点
  }
}

export const useTimeStore = defineStore('time', {
  state: () => ({
    timestamp: 0, // 游戏总小时数
    weather: 'SUNNY' as Weather,
    paused: true, // 游戏是否暂停
    timeInterval: null as ReturnType<typeof setInterval> | null,
    timeSpeed: 10000, // 每小时的实际毫秒数,默认10秒
  }),

  getters: {
    hour: state => state.timestamp % 24,
    day: state => Math.floor(state.timestamp / 24) % 30 + 1,
    month: state => Math.floor(state.timestamp / 24 / 30) % 4,
    year: state => Math.floor(state.timestamp / 24 / 30 / 4) + 1,
    season: state => {
      const seasonIndex = Math.floor((state.timestamp / 24 / 30) % 4)
      const seasons: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
      return seasons[seasonIndex]
    },
    currentPeriod(): DayPeriod {
      const periods = seasonalPeriods[this.season]
      if (isInPeriod(this.hour, periods.dawn)) return 'DAWN'
      if (isInPeriod(this.hour, periods.day)) return 'DAY'
      if (isInPeriod(this.hour, periods.dusk)) return 'DUSK'
      return 'NIGHT'
    }
  },

  actions: {
    startTime() {
      if (this.timeInterval) return
      
      this.timeInterval = setInterval(() => {
        if (this.paused) return
        
        // 更新时间戳
        this.timestamp++

        // 触发每小时事件
        emitter.emit('hour-passed')

        // 检查季节变化 
        this.checkSeasonChange()

        // 处理天气变化
        this.updateWeatherByChance()
      }, this.timeSpeed)
    },

    stopTime() {
      if (this.timeInterval) {
        clearInterval(this.timeInterval)
        this.timeInterval = null
      }
    },

    pauseGame() {
      this.paused = true
    },

    resumeGame() {
      this.paused = false 
    },

    // 更新时间速度(毫秒)
    setTimeSpeed(speed: number) {
      this.timeSpeed = speed
      // 重启定时器以应用新速度
      this.stopTime()
      this.startTime()
    },

    // 检查季节变化并发送通知
    checkSeasonChange() {
      const prevMonth = Math.floor(((this.timestamp - 1) / 24 / 30) % 4)
      const currentMonth = Math.floor((this.timestamp / 24 / 30) % 4)

      if (prevMonth !== currentMonth) {
        const seasons = ['春', '夏', '秋', '冬']
        gameLog({
          text: `${seasons[currentMonth]}天来了...`,
          type: 'SYSTEM'
        })
        
        // 触发季节变化事件
        emitter.emit('season-changed', this.season)
      }
    },
    
    // 更新天气
    updateWeather(weather: Weather) {
      this.weather = weather
    },

    // 随机改变天气(20%概率)
    updateWeatherByChance() {
      if (Math.random() < 0.2) {
        const newWeather = this.generateWeather(this.season)
        if (newWeather !== this.weather) {
          this.updateWeather(newWeather)
          
          // 生成天气变化提示
          let weatherMessage = ''
          switch (newWeather) {
            case 'SUNNY': weatherMessage = '天晴了'; break
            case 'RAINY': weatherMessage = '下雨了'; break
            case 'WINDY': weatherMessage = '起风了'; break
            case 'SNOWY': weatherMessage = '下雪了'; break
            case 'HAIL': weatherMessage = '下冰雹了'; break
            case 'SANDSTORM': weatherMessage = '沙尘暴来了'; break
            case 'HAZE': weatherMessage = '起雾了'; break
          }

          gameLog({
            text: weatherMessage,
            type: 'SYSTEM'
          })
        }
      }
    },

    // 根据季节生成天气
    generateWeather(currentSeason: Season): Weather {
      const probabilities = seasonalWeatherProbabilities[currentSeason]
      const random = Math.random()
      let cumulativeProbability = 0

      for (const [weatherType, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability
        if (random < cumulativeProbability) {
          return weatherType as Weather
        }
      }

      return 'SUNNY'
    }
  },

  persist: true
})

// 每个季节的天气概率配置
const seasonalWeatherProbabilities: Record<Season, Record<Weather, number>> = {
  'SPRING': {
    'SUNNY': 0.3,
    'RAINY': 0.3,
    'WINDY': 0.2,
    'SNOWY': 0.05,
    'HAIL': 0.05,
    'SANDSTORM': 0.05,
    'HAZE': 0.05
  },
  'SUMMER': {
    'SUNNY': 0.4,
    'RAINY': 0.3,
    'WINDY': 0.1,
    'SNOWY': 0,
    'HAIL': 0.1,
    'SANDSTORM': 0.05,
    'HAZE': 0.05
  },
  'AUTUMN': {
    'SUNNY': 0.4,
    'RAINY': 0.2,
    'WINDY': 0.2,
    'SNOWY': 0.05,
    'HAIL': 0.05,
    'SANDSTORM': 0.05,
    'HAZE': 0.05
  },
  'WINTER': {
    'SUNNY': 0.2,
    'RAINY': 0.1,
    'WINDY': 0.2,
    'SNOWY': 0.3,
    'HAIL': 0.1,
    'SANDSTORM': 0.05,
    'HAZE': 0.05
  }
}
