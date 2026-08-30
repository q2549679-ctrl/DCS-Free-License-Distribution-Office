<template>
  <div class="titlebar">
    <div class="titlebar-left">
      <div class="titlebar-icon"
        style="background: transparent !important; box-shadow: none !important; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
        <img :src="appIcon" alt="logo" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
    </div>
    <span class="titlebar-title">DCS 白嫖许可证发放处</span>
  </div>
  <div class="titlebar-right">
    <button class="titlebar-btn" :class="{ 'pin-active': isPinned }" @click="togglePin" title="窗口置顶">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path
          d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 2 2 0 000-4H8a2 2 0 000 4 1 1 0 011 1z" />
      </svg>
    </button>
    <button class="titlebar-btn" @click="windowMin" title="最小化">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button class="titlebar-btn" @click="windowMax" title="最大化">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    </button>
    <button class="titlebar-btn close" @click="windowClose" title="关闭">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
  </div>

  <div class="app-layout">
    <nav class="sidebar">
      <div class="sidebar-user">
        <!-- ===== 修改点 1：支持双击上传图片作为头像 ===== -->
        <div class="sidebar-avatar" @dblclick="triggerAvatarUpload" title="双击更换头像">
          <!-- 隐藏的文件选择器 -->
          <input type="file" ref="avatarFileInput" accept="image/*" style="display: none;"
            @change="handleAvatarChange" />

          <!-- 如果是图片 Base64，则渲染 img 标签 -->
          <img v-if="isImageAvatar" :src="store.settings?.userAvatar" alt="avatar" class="avatar-image" />
          <!-- 否则兜底渲染文字 -->
          <span v-else>{{ store.settings?.userAvatar || 'P' }}</span>
        </div>

        <div class="sidebar-user-info">
          <div class="sidebar-user-name" @click="editName" title="点击修改姓名" style="cursor: pointer;">
            <input v-if="isEditingName" type="text" v-model="store.settings.userName" @blur="isEditingName = false"
              @keyup.enter="isEditingName = false" ref="nameInput" class="name-edit-input" />
            <span v-else>{{ store.settings?.userName || 'Pilot' }}</span>
          </div>
        </div>
      </div>
      <!-- ============================================== -->

      <ul class="nav-list">
        <li class="nav-item" :class="{ active: route.name === 'Dashboard' }" @click="router.push('/dashboard')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          总览仪表盘
        </li>
        <li class="nav-item" :class="{ active: route.name === 'Emails' }" @click="router.push('/emails')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          试用邮箱
          <span class="nav-badge" v-if="store.emails.length">{{ store.emails.length }}</span>
        </li>
        <li class="nav-item" :class="{ active: route.name === 'Assets' }" @click="router.push('/assets')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          试用资产
        </li>
        <li class="nav-item" :class="{ active: route.name === 'Mail' }" @click="router.push('/mail')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          邮件中心
        </li>
        <li class="nav-item" :class="{ active: route.name === 'Settings' }" @click="router.push('/settings')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          系统设置
        </li>
      </ul>
      <div class="sidebar-footer">
        <span>v1.0.0</span>
        <a>检查更新</a>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <aside class="countdown-panel">
      <div class="countdown-panel-title">当前管理账号</div>

      <div v-if="currentGlobalEmail" class="countdown-card"
        :class="{ urgent: (currentGlobalEmail.twofaSeconds || 30) <= 10 }" @click="router.push('/emails')">
        <div class="countdown-card-header">
          <div class="countdown-card-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <span class="countdown-card-name">{{ currentGlobalEmail.address }}</span>
        </div>

        <div class="countdown-card-value" :class="{ warning: currentGlobalEmail.status === 'cooling' }">
          {{ currentGlobalEmail.status === 'available' ? '账号可用' : '冷却中' }}
        </div>

        <div v-if="currentGlobalEmail.twofaCode"
          style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:10px;color:var(--primary);font-weight:600;display:flex;align-items:center;gap:3px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                style="width:10px;height:10px">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              2FA 验证码
            </span>
            <span class="email-2fa-timer" :class="{ urgent: currentGlobalEmail.twofaSeconds <= 10 }"
              style="font-size:10px;padding:1px 6px">
              {{ currentGlobalEmail.twofaSeconds }}s
            </span>
          </div>
          <div
            style="font-size:16px;font-weight:700;letter-spacing:2px;color:var(--primary);font-family:Consolas,monospace">
            {{ currentGlobalEmail.twofaCode }}
          </div>
          <div class="email-2fa-bar" style="margin-top:4px">
            <div class="email-2fa-bar-fill" :class="{ urgent: currentGlobalEmail.twofaSeconds <= 10 }"
              :style="{ width: (currentGlobalEmail.twofaSeconds / 30 * 100) + '%' }"></div>
          </div>
        </div>
        <div v-else
          style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.06); font-size: 11px; color: var(--text-tertiary); text-align: center;">
          未绑定 2FA 验证
        </div>
      </div>

      <div v-else style="text-align:center; padding: 40px 10px; color: var(--text-tertiary); font-size: 12px;">
        暂无管理的邮箱
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watchEffect, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from './store';
import appIcon from '../ico/DCS-FlDO.ico';

const router = useRouter();
const route = useRoute();
const store = useAppStore();

const isPinned = ref(false);
const togglePin = () => {
  isPinned.value = !isPinned.value;
  window.electronAPI.windowPin(isPinned.value);
};

const windowMin = () => window.electronAPI.windowMin();
const windowMax = () => window.electronAPI.windowMax();
const windowClose = () => window.electronAPI.windowClose();

const currentGlobalEmail = computed(() => {
  if (!store.emails || store.emails.length === 0) return null;
  return store.emails.find(e => e.id === store.globalSelectedEmailId) || store.emails[0];
});

// ==== 修改点 2：头像与姓名编辑逻辑 ====
const isEditingName = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);

const avatarFileInput = ref<HTMLInputElement | null>(null);

const editName = () => {
  isEditingName.value = true;
  if (store.settings && !store.settings.userName) store.settings.userName = 'Pilot  ';
  nextTick(() => nameInput.value?.focus());
};

// 判定当前头像是否为 Base64 图片
const isImageAvatar = computed(() => {
  return store.settings?.userAvatar?.startsWith('data:image/');
});

// 触发隐藏的 input file
const triggerAvatarUpload = () => {
  avatarFileInput.value?.click();
};

// 读取文件并转换为 Base64
const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (store.settings && e.target?.result) {
        store.settings.userAvatar = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
  // 清空 value 允许重复选择相同的图片
  if (target) target.value = '';
};
// ======================================

watchEffect(() => {
  const s = store.settings;
  const selId = store.globalSelectedEmailId;
  store.savePersist();
  const doc = document.documentElement;
  if (!store.settings) return;

  doc.style.setProperty('--primary', store.settings.primaryColor);

  const opacities = [
    { bg: '0.85', strong: '0.95', blur: '8px' },
    { bg: '0.65', strong: '0.82', blur: '16px' },
    { bg: '0.45', strong: '0.60', blur: '24px' }
  ];
  const conf = opacities[store.settings.glassStrength - 1] || opacities[1];
  doc.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${conf.bg})`);
  doc.style.setProperty('--glass-bg-strong', `rgba(255, 255, 255, ${conf.strong})`);
  doc.style.setProperty('--glass-blur', conf.blur);

  if (store.settings.theme === 'dark' || (store.settings.theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    doc.setAttribute('data-theme', 'dark');
  } else {
    doc.setAttribute('data-theme', 'light');
  }
});


onMounted(async () => {
  await store.fetchRealData();
  store.startTOTPInterval();
});
</script>

<style src="./assets/style.css"></style>
<style>
:root {
  --glass-blur: 16px;
}

.glass-card,
.sidebar,
.countdown-panel {
  backdrop-filter: blur(var(--glass-blur)) saturate(160%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%) !important;
  background: var(--glass-bg) !important;
}

.titlebar,
.modal,
.toast {
  backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(180%) !important;
  -webkit-backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(180%) !important;
  background: var(--glass-bg-strong) !important;
}

html[data-theme="dark"] {
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --glass-border: rgba(255, 255, 255, 0.1);
}

html[data-theme="dark"] body {
  background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%) !important;
}

html[data-theme="dark"] .glass-card,
html[data-theme="dark"] .sidebar,
html[data-theme="dark"] .countdown-panel,
html[data-theme="dark"] .titlebar,
html[data-theme="dark"] .modal {
  background: rgba(31, 41, 55, 0.65) !important;
}

html[data-theme="dark"] input:not(.name-edit-input),
html[data-theme="dark"] select,
html[data-theme="dark"] textarea {
  background: rgba(0, 0, 0, 0.3) !important;
  color: white;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

/* ==== 修改点 3：图片头像与内联输入框样式 ==== */
.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.name-edit-input {
  width: 100px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid var(--primary);
  color: var(--text-primary);
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 13px;
  font-weight: 600;
  outline: none;
}

/* ================================== */
</style>