<template>
  <div class="environment-card translucent-white">
    <div class="env-icon">{{ envIcon }}</div>
    <p class="env-text">{{ envText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '../../stores/time'
import { useScenesStore } from '../../stores/scenes'

const timeStore = useTimeStore()
const scenesStore = useScenesStore()

// 场景、天气、时段、季节的氛围文案
// 格式：[sceneId, weather, period, season] → 多条文案可随机选一
const ENV_TEXTS: { scene: string; weather: string; period: string; season: string; texts: string[] }[] = [
  // 营地 base
  { scene: 'base', weather: 'SUNNY',     period: 'DAY',   season: 'SPRING', texts: [
    '阳光洒在营地，微风轻拂，空气中带着泥土的清香。',
    '春日暖阳照耀着营地，远处草地上偶尔能听见鸟鸣。',
    '篝火的灰烬尚温，新的一天又在阳光中开始了。',
  ]},
  { scene: 'base', weather: 'SUNNY',     period: 'DAY',   season: 'SUMMER', texts: [
    '骄阳似火，营地里连蝉鸣都显得有气无力。',
    '夏日正午，热浪扑面而来，荒野安静得有些出奇。',
    '蓝天万里无云，汗水浸透了衣衫，却也莫名踏实。',
  ]},
  { scene: 'base', weather: 'SUNNY',     period: 'DAY',   season: 'AUTUMN', texts: [
    '秋高气爽，落叶在营地周围悄悄堆积起来。',
    '阳光斜斜地打在地面上，空气里有一股淡淡的木叶香。',
    '天空湛蓝如洗，枯黄的野草随风摇曳，安静而萧瑟。',
  ]},
  { scene: 'base', weather: 'SUNNY',     period: 'DAY',   season: 'WINTER', texts: [
    '冬日阳光虽暖，却驱不散彻骨的寒意。',
    '雪地反光，营地四周白茫茫一片，只有脚印留着痕迹。',
    '冷风里带着霜气，篝火显得尤为珍贵。',
  ]},
  { scene: 'base', weather: 'RAINY',     period: 'DAY',   season: 'SPRING', texts: [
    '细雨绵绵，营地的土地变得湿软，雨声敲打着树叶。',
    '春雨如丝，空气格外清新，远处隐约有青蛙叫声。',
    '雨水将营地冲刷得干净，一切都透着生机。',
  ]},
  { scene: 'base', weather: 'RAINY',     period: 'NIGHT', season: 'SUMMER', texts: [
    '夏夜大雨倾盆，营地积水，唯有篝火顽强地燃烧着。',
    '雨声如鼓，夜空没有星光，只有远处偶尔的雷声。',
    '湿热的雨夜，衣衫贴在身上，令人难以入睡。',
  ]},
  { scene: 'base', weather: 'WINDY',     period: 'DAWN',  season: 'AUTUMN', texts: [
    '秋日黎明，营地四周枯叶乱飞，风声呼呼作响。',
    '凛冽的晨风吹散了雾气，天边泛起一丝微光。',
    '风中带着落叶的气息，崭新的一天又要开始了。',
  ]},
  { scene: 'base', weather: 'SNOWY',     period: 'NIGHT', season: 'WINTER', texts: [
    '大雪无声地落下，营地周围被白雪覆盖，寂静无声。',
    '雪夜漫漫，篝火的橙光在雪地上投下温暖的影子。',
    '四面白雪皑皑，冷到骨子里，却有一种奇异的平静。',
  ]},
  // 树林 forest
  { scene: 'forest', weather: 'SUNNY',   period: 'DAY',   season: 'SPRING', texts: [
    '林间阳光斑驳，树叶沙沙作响，空气湿润而清新。',
    '春天的树林生机勃勃，到处都是新发的嫩芽和鸟鸣。',
    '踩着松软的泥土，远处有松鼠在树梢跳跃。',
  ]},
  { scene: 'forest', weather: 'RAINY',   period: 'NIGHT', season: 'SUMMER', texts: [
    '夏夜的树林被雨水打得哗哗作响，远处偶有虫鸣。',
    '大雨中，树冠遮住了大半雨水，林间却依然湿漉漉的。',
    '雨夜的树林黑暗而潮湿，每一步踏出都发出噗嗤声。',
  ]},
  { scene: 'forest', weather: 'WINDY',   period: 'DUSK',  season: 'AUTUMN', texts: [
    '夕阳将树林染成金红色，秋风卷起一地落叶。',
    '黄昏的树林里，风声与落叶声交织，分外萧瑟。',
    '猎猎秋风中，枯枝折断的声音让人警觉。',
  ]},
  { scene: 'forest', weather: 'SNOWY',   period: 'DAY',   season: 'WINTER', texts: [
    '皑皑白雪覆盖了整片树林，万籁俱寂。',
    '雪后的树林宛如水墨画，每一步都留下深深的脚印。',
    '冬日的树林里，动物踪迹稀少，寒气刺骨。',
  ]},
  { scene: 'forest', weather: 'HAZE',    period: 'DAY',   season: 'AUTUMN', texts: [
    '深秋的树林笼罩在薄雾之中，能见度极低。',
    '迷雾中，树干轮廓模糊，方向感变得混乱。',
    '霾气弥漫，树林里沉寂得令人窒息。',
  ]},
  // 河边 river
  { scene: 'river', weather: 'SUNNY',    period: 'DAY',   season: 'SPRING', texts: [
    '河水清澈，阳光在水面上折射出粼粼波光。',
    '春日河岸，柳絮飘飞，鱼儿不时跃出水面。',
    '潺潺流水声令人心旷神怡，岸边野花盛开。',
  ]},
  { scene: 'river', weather: 'WINDY',    period: 'DAWN',  season: 'AUTUMN', texts: [
    '秋日黎明，河面上漂着薄雾，风一阵一阵地吹来。',
    '晨风拂过河面，水草轻摇，远处传来水鸟的叫声。',
    '薄雾笼罩的河边，黎明的光线将一切染成淡金色。',
  ]},
  { scene: 'river', weather: 'RAINY',    period: 'DAY',   season: 'SUMMER', texts: [
    '夏雨让河水暴涨，急流冲刷着石岸，声势浩大。',
    '雨水扰乱了河面，鱼儿变得难以捕捉。',
    '大雨哗哗，河岸泥泞，脚下格外湿滑。',
  ]},
  // 湖边 lakeside
  { scene: 'lakeside', weather: 'SUNNY', period: 'DAY',   season: 'SPRING', texts: [
    '湖面如镜，倒映着蓝天白云，令人心旷神怡。',
    '春日阳光下，湖边野花盛开，蝴蝶翩翩起舞。',
    '微风拂过湖面，漾起层层涟漪，远处水鸟低飞。',
  ]},
  { scene: 'lakeside', weather: 'WINDY', period: 'DUSK',  season: 'AUTUMN', texts: [
    '秋风将湖面吹皱，夕阳的倒影被打散成金色碎片。',
    '黄昏湖边，芦苇随风摇曳，一群候鸟掠水而过。',
    '湖边的秋风带着凉意，水面波光粼粼，美丽而寂寥。',
  ]},
  // 草地 grassland
  { scene: 'grassland', weather: 'SUNNY', period: 'DAY',  season: 'SPRING', texts: [
    '碧绿的草地延伸到天边，野花点缀其中，蜜蜂嗡嗡飞舞。',
    '春风吹来，草浪翻涌，仿佛绿色的海洋。',
    '开阔的草地上视野极好，阳光暖洋洋地晒在身上。',
  ]},
  { scene: 'grassland', weather: 'RAINY', period: 'NIGHT', season: 'SUMMER', texts: [
    '夜雨中的草地泥泞不堪，青草的气味分外浓烈。',
    '雨水冲刷着草地，远处闪电划破夜空。',
    '夏夜暴雨，草地上积水汪汪，只听雨声轰鸣。',
  ]},
  // 洞穴 cave
  { scene: 'cave', weather: 'SUNNY',    period: 'DAY',   season: 'SPRING', texts: [
    '洞穴外阳光明媚，但洞内依旧阴暗潮湿，滴水声回响。',
    '春日里洞外鸟语花香，洞内却是另一番清冷世界。',
    '洞穴深处一片寂静，偶尔有蝙蝠振翅的声音。',
  ]},
  { scene: 'cave', weather: 'RAINY',    period: 'NIGHT', season: 'AUTUMN', texts: [
    '秋雨夜里，洞外雨声阵阵，洞内倒是难得的干燥。',
    '洞穴深处，水滴声和外面的风雨声混在一起，令人发寒。',
    '黑暗潮湿的洞窟里，每一步都需格外小心。',
  ]},
  // 海边 seaside
  { scene: 'seaside', weather: 'SUNNY', period: 'DAY',   season: 'SUMMER', texts: [
    '海风咸湿，海浪拍打着礁石，泡沫在阳光下晶莹闪烁。',
    '夏日海滩，阳光刺眼，远处海鸥盘旋鸣叫。',
    '碧蓝的大海一望无际，浪声如鼓，令人心旷神怡。',
  ]},
  { scene: 'seaside', weather: 'WINDY', period: 'DUSK',  season: 'AUTUMN', texts: [
    '秋日黄昏，海风猎猎，夕阳将海面染成一片橙红。',
    '海浪在风中咆哮，海鸟低飞，预示着夜晚将有风雨。',
    '黄昏的海边，浪声与风声交织，感受到世界的广阔。',
  ]},
];

// 根据当前状态选取最匹配的文案
const envText = computed(() => {
  const scene = scenesStore.currentSceneId as string
  const weather = timeStore.weather as string
  const period = timeStore.currentPeriod as string
  const season = timeStore.season as string

  // 按优先级匹配：精确匹配 > 部分匹配 > 兜底
  let best = ENV_TEXTS.find(e =>
    e.scene === scene && e.weather === weather && e.period === period && e.season === season
  )

  // 依次放宽条件
  if (!best) best = ENV_TEXTS.find(e => e.scene === scene && e.weather === weather && e.season === season)
  if (!best) best = ENV_TEXTS.find(e => e.scene === scene && e.period === period && e.season === season)
  if (!best) best = ENV_TEXTS.find(e => e.scene === scene && e.season === season)
  if (!best) best = ENV_TEXTS.find(e => e.scene === scene)

  if (!best) {
    // 兜底文案
    return '四周一片沉寂，只有风声和自己的呼吸声。'
  }

  // 在匹配的文案列表中根据游戏时间戳随机选一条（固定，不抖动）
  const idx = Math.floor(timeStore.timestamp / 24) % best.texts.length
  return best.texts[idx]
})

// 场景图标
const envIcon = computed(() => {
  const icons: Record<string, string> = {
    base: '🏕️',
    forest: '🌲',
    river: '🏞️',
    lakeside: '🌊',
    grassland: '🌿',
    cave: '🕳️',
    seaside: '🌅',
  }
  return icons[scenesStore.currentSceneId as string] ?? '🌍'
})
</script>

<style scoped>
.environment-card {
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-height: 3rem;
}

.env-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  line-height: 1.4;
}

.env-text {
  font-size: 0.82rem;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}
</style>
