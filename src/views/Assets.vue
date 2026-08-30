<template>
  <section class="view active">
    <div class="page-header">
      <div>
        <div class="page-title">试用资产管理</div>
        <div class="page-subtitle">按 DCS 官网分类查看所有试用资产及到期状态</div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <select v-model="currentEmailId"
          style="padding: 8px 12px; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 6px; background: var(--glass-bg-strong); font-size: 13px; outline: none; cursor: pointer; min-width: 200px;">
          <option v-for="e in store.emails" :key="e.id" :value="e.id">{{ e.address }}</option>
        </select>

        <button class="btn btn-secondary" @click="handleRefreshLocal" :disabled="isSyncing">
          <svg :class="{ 'spin-anim': isSyncing }" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          刷新本地状态
        </button>
      </div>
    </div>

    <!-- 资产分类 Tabs -->
    <div class="category-tabs">
      <button class="category-tab" :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">全部<span
          class="category-count">{{ assetsWithStatus.length }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'jet' }" @click="currentTab = 'jet'">喷气式飞机<span
          class="category-count">{{ getCount('jet') }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'helicopter' }"
        @click="currentTab = 'helicopter'">直升机<span class="category-count">{{ getCount('helicopter') }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'propeller' }"
        @click="currentTab = 'propeller'">螺旋桨飞机<span class="category-count">{{ getCount('propeller') }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'map' }" @click="currentTab = 'map'">地图<span
          class="category-count">{{ getCount('map') }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'pack' }" @click="currentTab = 'pack'">装备包<span
          class="category-count">{{ getCount('pack') }}</span></button>
      <button class="category-tab" :class="{ active: currentTab === 'navigation' }"
        @click="currentTab = 'navigation'">导航系统<span class="category-count">{{ getCount('navigation') }}</span></button>
    </div>

    <div class="asset-grid">
      <!-- 【修改点】：动态绑定 used-asset 类名，用于反转已激活资产的颜色 -->
      <div v-for="a in filteredAssets" :key="a.id" class="glass-card asset-card"
        :class="{ 'used-asset': a.status !== 'available' }">
        <div class="asset-header">
          <div class="asset-name" :title="a.name">{{ a.name }}</div>
          <span class="asset-category-tag">{{ catNames[a.category] }}</span>
        </div>

        <div class="asset-timeline" v-if="a.status !== 'available'">{{ a.startDate }} ~ {{ a.endDate }}</div>
        <div class="asset-timeline" v-else>未激活 · 随时可申请试用</div>

        <div class="asset-progress-row">
          <div class="circular-progress">
            <svg viewBox="0 0 48 48">
              <circle class="bg" cx="24" cy="24" r="20" />
              <circle class="fg"
                :class="a.status === 'available' ? 'normal' : (a.status === 'cooling' ? 'warning' : (a.daysLeft <= 3 ? 'danger' : 'normal'))"
                cx="24" cy="24" r="20" stroke-dasharray="125.66"
                :stroke-dashoffset="125.66 * (1 - getProgressPct(a))" />
            </svg>
            <div class="circular-progress-text">
              {{ a.status === 'available' ? '100%' : Math.round(getProgressPct(a) * 100) + '%' }}
            </div>
          </div>

          <div class="asset-remaining">
            <div class="asset-remaining-days" v-if="a.status === 'available'">随时可用</div>
            <div class="asset-remaining-days" v-else>{{ a.daysLeft }} 天</div>

            <div class="asset-remaining-label">
              {{ a.status === 'available' ? '标准试用期 14 天' : (a.status === 'cooling' ? '冷却剩余时间' : '剩余试用时间') }}
            </div>

            <span class="badge"
              :class="a.status === 'available' ? 'badge-success' : (a.status === 'cooling' ? 'badge-warning' : (a.daysLeft <= 3 ? 'badge-danger' : 'badge-info'))">
              {{ a.status === 'available' ? '可试用' : (a.status === 'cooling' ? '冷却中' : (a.daysLeft <= 3 ? '即将到期' : '试用中')) }}
            </span>
          </div>
        </div>

        <div class="asset-card-footer">
          <button class="btn btn-secondary btn-sm" @click="openUrl(a.url)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            前往官网
          </button>

          <button v-if="a.status === 'available'" class="btn btn-primary btn-sm" @click="manualActivate(a)">
            标记为试用中
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast-container">
      <div class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg v-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../store';

const store = useAppStore();
const route = useRoute();
const currentTab = ref('all');

const initialEmailId = route.query.emailId ? Number(route.query.emailId) : (store.emails.length > 0 ? store.emails[0].id : 1);
const currentEmailId = ref(initialEmailId);

watch(() => route.query.emailId, (newId) => {
  if (newId) currentEmailId.value = Number(newId);
});

const catNames: Record<string, string> = {
  jet: '喷气式飞机',
  helicopter: '直升机',
  propeller: '螺旋桨飞机',
  map: '地图',
  pack: '装备包',
  navigation: '导航系统'
};

const ALL_MODULES = [
  // 喷气式飞机 (Jet) - 23
  { id: 101, name: 'DCS: F-5E', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/tiger_remastered/' },
  { id: 102, name: 'F-86F怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/f-86f_flaming_cliffs/' },
  { id: 103, name: 'MiG-15bis怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mig-15bis_flaming_cliffs/' },
  { id: 104, name: 'F-5E怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/' },
  { id: 105, name: 'DCS: MB-339', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mb-339/' },
  { id: 106, name: 'DCS: 幻影F1', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mirage/' },
  { id: 107, name: 'DCS: A-10C II "坦克杀手"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/tank_killer/' },
  { id: 108, name: 'DCS: JF-17 "枭龙"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/thunder/' },
  { id: 109, name: 'DCS: F-16C "蝰蛇"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/viper/' },
  { id: 110, name: 'MiG-29怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mig-29_flaming_cliffs/' },
  { id: 111, name: 'DCS: F-14 "雄猫"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/tomcat/' },
  { id: 112, name: 'DCS: F/A-18C', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/hornet/' },
  { id: 113, name: 'Su-33怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/su-33_flaming_cliffs/' },
  { id: 114, name: 'DCS: AJS-37 "雷"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/viggen/' },
  { id: 115, name: 'DCS: L-39 "信天翁"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/albatros/' },
  { id: 116, name: 'A-10A 怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/a-10a_flaming_cliffs/' },
  { id: 117, name: 'Su-25 怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/su-25_flaming_cliffs/' },
  { id: 118, name: 'F-15C 怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/f-15c_flaming_cliffs/' },
  { id: 119, name: 'Su-27 怒火危崖', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/su-27_flaming_cliffs/' },
  { id: 120, name: 'DCS: F-86F "佩刀"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/sabre/' },
  { id: 121, name: 'DCS: MiG-21bis', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mig21bis/' },
  { id: 122, name: 'DCS: MiG-15bis', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mig15bis/' },
  { id: 123, name: 'DCS: C-101 "Aviojet"', category: 'jet', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/aviojet/' },

  // 直升机 (Helicopter) - 7
  { id: 201, name: 'DCS: CH-47F', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/ch-47f/' },
  { id: 202, name: 'DCS: "黑鲨" 3', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/black_shark_3/' },
  { id: 203, name: 'DCS: AH-64D', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/ah-64d/' },
  { id: 204, name: 'DCS: Mi-24P "雌鹿"', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/hind/' },
  { id: 205, name: 'DCS: SA342 "小羚羊"', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/gazelle/' },
  { id: 206, name: 'DCS: UH-1H "休伊"', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/dcs_uh1h_huey/' },
  { id: 207, name: 'DCS: Mi-8MTV2', category: 'helicopter', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/dcs_mi8mtv2_magnificent_eight/' },

  // 螺旋桨飞机 (Propeller) - 10
  { id: 301, name: 'DCS: "蚊"式FB VI', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/mosquito/' },
  { id: 302, name: 'DCS: P-47D "雷电"', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/thunderbolt/' },
  { id: 303, name: 'DCS: Fw 190 A-8', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/anton/' },
  { id: 304, name: 'DCS: I-16', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/i-16/' },
  { id: 305, name: 'DCS: 克里斯滕鹰II', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/christen_eagle/' },
  { id: 306, name: 'DCS: Yak-52', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/yak52/' },
  { id: 307, name: 'DCS: 喷火LF Mk. IX', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/spitfire/' },
  { id: 308, name: 'DCS: P-51D "野马"', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/dcs_p51d_mustang/' },
  { id: 309, name: 'DCS: Fw 190 D-9 "多拉"', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/dora/' },
  { id: 310, name: 'DCS: Bf 109 K-4 "选帝侯"', category: 'propeller', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/kurfurst/' },

  // 导航系统 (Navigation) - 1
  { id: 401, name: 'DCS: NS430导航系统', category: 'navigation', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/ns430/' },

  // 装备包 (Pack) - 3
  { id: 501, name: 'DCS: 超级航母', category: 'pack', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/supercarrier/' },
  { id: 502, name: 'DCS: 二战武器装备包', category: 'pack', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/wwii_assets_pack/' },
  { id: 503, name: 'DCS: 联合武装', category: 'pack', url: 'https://www.digitalcombatsimulator.com/cn/shop/modules/dcs_combined_arms/' },

  // 地图 (Map) - 11
  { id: 601, name: 'DCS: 英吉利海峡地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/the_channel_terrain/' },
  { id: 602, name: 'DCS: 波斯湾地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/persiangulf_terrain/' },
  { id: 603, name: 'DCS: 内华达-试验和训练靶场地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/nttr_terrain/' },
  { id: 604, name: 'DCS: 阿富汗东部地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/east_afghanistan_terrain/' },
  { id: 605, name: 'DCS: 科拉半岛地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/kola_terrain/' },
  { id: 606, name: 'DCS: 阿富汗地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/afghanistan_terrain/' },
  { id: 607, name: 'DCS: 阿富汗西南部地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/southwest_afghanistan_terrain/' },
  { id: 608, name: 'DCS: 西奈半岛地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/sinai_terrain/' },
  { id: 609, name: 'DCS: 诺曼底2.0地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/normandy_2.0_terrain/' },
  { id: 610, name: 'DCS: 南大西洋地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/south_atlantic_terrain/' },
  { id: 611, name: 'DCS: 叙利亚地图', category: 'map', url: 'https://www.digitalcombatsimulator.com/cn/shop/terrains/syria_terrain/' },
];

const assetsWithStatus = computed(() => {
  const boundAssets = store.assets.filter(a => a.emailId === currentEmailId.value);

  return ALL_MODULES.map(mod => {
    const boundRecord = boundAssets.find(ba => ba.name === mod.name);
    if (boundRecord) {
      return { ...mod, ...boundRecord };
    } else {
      return {
        ...mod,
        status: 'available',
        daysLeft: 14,
        totalDays: 14,
        startDate: '-',
        endDate: '-'
      };
    }
  });
});

const getCount = (cat: string) => assetsWithStatus.value.filter(a => a.category === cat).length;

const filteredAssets = computed(() => {
  if (currentTab.value === 'all') return assetsWithStatus.value;
  return assetsWithStatus.value.filter(a => a.category === currentTab.value);
});

const getProgressPct = (a: any) => {
  if (a.status === 'available') return 1;
  if (a.status === 'cooling') return (a.totalDays - a.daysLeft) / a.totalDays;
  return a.daysLeft / a.totalDays;
};

const openUrl = (url: string) => {
  if (window.electronAPI) window.electronAPI.openUrl(url);
};

const toast = ref({ show: false, message: '', type: 'success' });
let toastTimer: any = null;
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.value.show = false, 3000);
}

const isSyncing = ref(false);

async function manualActivate(mod: any) {
  if (!currentEmailId.value) return;
  await store.markAssetActive(currentEmailId.value, mod);
  showToast(`✅ 成功将 ${mod.name} 写入试用库`, 'success');
}

async function handleRefreshLocal() {
  isSyncing.value = true;
  try {
    if (store.fetchRealData) {
      await store.fetchRealData();
    }
    showToast('✅ 本地资产状态已刷新', 'success');
  } catch (e) {
    showToast('刷新状态失败', 'error');
  } finally {
    isSyncing.value = false;
  }
}
</script>

<style scoped>
.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.asset-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 75%;
}

/* ===== 【新增】：已试用资产深色背景反转样式 ===== */
.asset-card.used-asset {
  background: rgba(28, 35, 45, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  /* 覆盖内部元素的文字颜色 */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  color: var(--text-primary);
}

.asset-card.used-asset .asset-name {
  color: var(--text-primary);
}

.asset-card.used-asset .asset-timeline {
  color: var(--text-secondary);
}

.asset-card.used-asset .asset-remaining-days {
  color: var(--text-primary);
}

.asset-card.used-asset .asset-remaining-label {
  color: var(--text-secondary);
}

.asset-card.used-asset .circular-progress .bg {
  stroke: rgba(255, 255, 255, 0.1);
}

.asset-card.used-asset .circular-progress-text {
  color: var(--text-primary);
}

.asset-card.used-asset .asset-category-tag {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}
</style>