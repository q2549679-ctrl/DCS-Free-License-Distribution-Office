<template>
  <section class="view active">
    <div class="page-header">
      <div>
        <div class="page-title">总览仪表盘</div>
        <div class="page-subtitle">全局数据概览与时效监控</div>
      </div>
      <button class="btn btn-primary" @click="addTestActivity">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        模拟自动任务
      </button>
    </div>

    <div class="stats-grid">
      <div class="glass-card stat-card">
        <div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg></div>
        <div class="stat-info">
          <div class="stat-value">{{ store.emails.length }}</div>
          <div class="stat-label">注册邮箱总数</div>
        </div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg></div>
        <div class="stat-info">
          <!-- 直接绑定 store 的 getter，确保响应式更新 -->
          <div class="stat-value">
            {{ store.currentActiveAssetsCount }}
          </div>
          <div class="stat-label">绑定试用资产</div>
        </div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg></div>
        <div class="stat-info">
          <div class="stat-value">{{store.emails.filter(e => e.twofaCode).length}}</div>
          <div class="stat-label">活跃 2FA 邮箱</div>
        </div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg></div>
        <div class="stat-info">
          <div class="stat-value">{{ store.expiringItems?.length || 0 }}</div>
          <div class="stat-label">近期到期提醒</div>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="glass-card" style="display: flex; flex-direction: column;">
        <div class="panel-header">
          <div class="panel-title">时效提醒</div>
          <button class="btn btn-ghost btn-sm" @click="showExpiringModal = true">查看全部</button>
        </div>
        <div class="panel-body" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
          <ul class="expiring-list" style="max-height: 220px; overflow-y: auto; padding-right: 6px;">
            <li class="expiring-item" v-for="item in store.expiringItems" :key="item.id" @click="jumpTo(item)">
              <div class="expiring-icon" style="background:rgba(255,154,46,0.1);color:var(--warning)">{{ item.icon }}
              </div>
              <div class="expiring-info">
                <div class="expiring-name">{{ item.name }}</div>
                <div class="expiring-type">{{ item.type }}</div>
              </div>
              <div class="expiring-time" :class="item.urgent ? 'urgent' : 'warning'">{{ item.days }}天</div>
            </li>
          </ul>
        </div>
      </div>

      <div class="glass-card" style="display: flex; flex-direction: column;">
        <div class="panel-header">
          <div class="panel-title">最近自动化操作</div>
          <button class="btn btn-ghost btn-sm" @click="showActivityModal = true">查看全部</button>
        </div>
        <div class="panel-body" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
          <ul class="activity-list" ref="activityListRef"
            style="max-height: 220px; overflow-y: auto; padding-right: 6px;">
            <li class="activity-item" v-for="a in store.activities" :key="a.id">
              <div class="activity-dot" :class="a.status"></div>
              <div class="activity-content">
                <div class="activity-text" :class="{ fail: a.status === 'danger' }">{{ a.text }}</div>
                <div class="activity-time">{{ a.time }}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 查看全部：时效提醒 弹窗 -->
    <div class="modal-overlay" :class="{ show: showExpiringModal }" @click="showExpiringModal = false">
      <div class="modal" style="width: 500px" @click.stop>
        <div class="modal-header">
          <div class="modal-title">全部时效提醒</div>
          <button class="modal-close" @click="showExpiringModal = false"><svg viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg></button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto">
          <ul class="expiring-list">
            <li class="expiring-item" v-for="item in store.expiringItems" :key="item.id"
              @click="jumpTo(item); showExpiringModal = false">
              <div class="expiring-icon" style="background:rgba(255,154,46,0.1);color:var(--warning)">{{ item.icon }}
              </div>
              <div class="expiring-info">
                <div class="expiring-name">{{ item.name }}</div>
                <div class="expiring-type">{{ item.type }}</div>
              </div>
              <div class="expiring-time" :class="item.urgent ? 'urgent' : 'warning'">{{ item.days }}天</div>
            </li>
            <div v-if="!store.expiringItems || store.expiringItems.length === 0"
              style="text-align:center; padding: 20px; color: var(--text-tertiary)">暂无提醒</div>
          </ul>
        </div>
      </div>
    </div>

    <!-- 查看全部：自动化操作 弹窗 -->
    <div class="modal-overlay" :class="{ show: showActivityModal }" @click="showActivityModal = false">
      <div class="modal" style="width: 500px" @click.stop>
        <div class="modal-header">
          <div class="modal-title">全部自动化操作记录</div>
          <button class="modal-close" @click="showActivityModal = false"><svg viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg></button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto">
          <ul class="activity-list">
            <li class="activity-item" v-for="a in store.activities.slice().reverse()" :key="a.id">
              <div class="activity-dot" :class="a.status"></div>
              <div class="activity-content">
                <div class="activity-text" :class="{ fail: a.status === 'danger' }">{{ a.text }}</div>
                <div class="activity-time">{{ a.time }}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../store';

const router = useRouter();
const store = useAppStore();

const showExpiringModal = ref(false);
const showActivityModal = ref(false);
const activityListRef = ref<HTMLElement | null>(null);

function jumpTo(item: any) {
  router.push({ path: item.route, query: { emailId: item.emailId } });
}

function addTestActivity() {
  if (store.addActivity) store.addActivity('系统自动执行了全量资产状态检查', 'success');
}

watch(() => store.activities?.length, () => {
  nextTick(() => {
    if (activityListRef.value) {
      activityListRef.value.scrollTop = activityListRef.value.scrollHeight;
    }
  });
}, { immediate: true });
</script>