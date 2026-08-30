<template>
  <section class="view active">
    <div class="page-header">
      <div>
        <div class="page-title">邮件中心</div>
        <div class="page-subtitle">查看验证邮件与提取 2FA 验证码，支持自动中文翻译</div>
      </div>
    </div>

    <div class="mail-layout">
      <!-- 邮件列表侧边栏 -->
      <div class="glass-card mail-list-panel">
        <div class="mail-list-header">
          <select v-model="currentEmailId" @change="refreshMails"
            style="flex:1;margin-right:8px;padding:6px 8px;border:1px solid rgba(0,0,0,0.08);border-radius:6px;background:rgba(255,255,255,0.7);font-size:12px;font-family:inherit;outline:none">
            <option v-for="e in (store.emails || [])" :key="e.id" :value="e.id">{{ e.address }}</option>
          </select>
          <button class="mail-list-refresh" @click="refreshMails" :disabled="isLoading">
            <svg :class="{ 'spin-anim': isLoading }" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>

        <ul class="mail-list">
          <li v-for="m in currentMails" :key="m.id" class="mail-item"
            :class="{ active: m.id === selectedMailId, unread: m.unread }" @click="selectMail(m.id)">
            <div class="mail-item-from">
              {{ m && m.from ? m.from.split(' <')[0] : '未知发件人' }}
              <span v-if="m && m.verified" class="mail-verified-tag">验证</span>
            </div>
            <div class="mail-item-subject">{{ m && m.subject ? m.subject : '无主题' }}</div>
            <div class="mail-item-time">{{ m && m.time ? m.time : '' }}</div>
          </li>
          <div v-if="currentMails.length === 0" class="empty-state" style="padding:40px 20px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              style="width:40px;height:40px;margin-bottom:10px;opacity:0.4">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <p style="font-size:12px;color:var(--text-tertiary)">{{ isLoading ? '正在收取邮件...' : '该邮箱暂无邮件' }}</p>
          </div>
        </ul>
      </div>

      <!-- 邮件详情面板 -->
      <div class="glass-card mail-detail-panel" v-if="activeMail">
        <div class="mail-detail-header">
          <div class="mail-detail-subject">{{ activeMail.subject || '无主题' }}</div>
          <div class="mail-detail-meta" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="mail-detail-from">来自：<strong>{{ activeMail.from || '未知发件人' }}</strong> ·
              {{ activeMail.time || '' }}</div>
            <!-- 新增：三种翻译模式切换选项卡 -->
            <div class="trans-toggle-group">
              <button class="trans-btn" :class="{ active: transMode === 'original' }"
                @click="transMode = 'original'">原文</button>
              <button class="trans-btn" :class="{ active: transMode === 'translated' }"
                @click="transMode = 'translated'">翻译后</button>
              <button class="trans-btn" :class="{ active: transMode === 'bilingual' }"
                @click="transMode = 'bilingual'">双语对比</button>
            </div>
          </div>
        </div>

        <!-- 拦截邮件正文中链接的点击事件 -->
        <div class="mail-body" @click="handleMailLinkClick">

          <!-- 正在翻译的友好提示 -->
          <div v-if="isTranslating && transMode !== 'original'" class="translating-hint">
            <svg class="spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="width:16px;height:16px;">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            正在为您自动翻译内容...
          </div>

          <template v-else>
            <!-- 模式一：原文 -->
            <div v-if="transMode === 'original'" v-html="activeMail.body || '无正文内容'"></div>

            <!-- 模式二：翻译后 -->
            <div v-else-if="transMode === 'translated'" class="translated-content" v-html="translatedBody"></div>

            <!-- 模式三：双语对比 -->
            <div v-else-if="transMode === 'bilingual'" class="bilingual-content">
              <div class="bilingual-part">
                <div class="bilingual-label">原文内容</div>
                <div v-html="activeMail.body || '无正文内容'"></div>
              </div>
              <div class="bilingual-divider"></div>
              <div class="bilingual-part">
                <div class="bilingual-label">中文翻译</div>
                <div v-html="translatedBody"></div>
              </div>
            </div>
          </template>

        </div>
      </div>
      <div v-else class="glass-card mail-detail-panel" style="align-items:center;justify-content:center">
        <div class="empty-state" style="padding:60px 20px">
          <p>请选择一封邮件查看详情</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../store';

const route = useRoute();
const store = useAppStore();

const currentEmailId = ref<number | null>(null);
const selectedMailId = ref<number | null>(null);
const isLoading = ref(false);

const currentMails = computed(() => {
  try {
    if (!store.mails || !Array.isArray(store.mails)) return [];
    return store.mails.filter(m => m && m.emailId === currentEmailId.value);
  } catch (e) {
    return [];
  }
});

const activeMail = computed(() => {
  try {
    if (!currentMails.value) return null;
    return currentMails.value.find(m => m && m.id === selectedMailId.value) || null;
  } catch (e) {
    return null;
  }
});

// ==== 新增：自动翻译功能状态与逻辑 ====
const transMode = ref<'original' | 'translated' | 'bilingual'>('bilingual');
const translatedBody = ref('');
const isTranslating = ref(false);
const translationCache = ref<Record<number, string>>({}); // 缓存翻译以降低 API 负担

watch(activeMail, async (newMail) => {
  if (!newMail || !newMail.body) {
    translatedBody.value = '';
    return;
  }

  // 若已缓存，直接读取跳过请求
  if (translationCache.value[newMail.id]) {
    translatedBody.value = translationCache.value[newMail.id];
    return;
  }

  isTranslating.value = true;
  try {
    // 粗略剥离原文 HTML 获取纯文本
    const tmp = document.createElement('div');
    tmp.innerHTML = newMail.body;
    const textToTranslate = tmp.innerText || tmp.textContent || '';

    if (!textToTranslate.trim()) {
      translatedBody.value = '无正文内容';
      return;
    }

    // 调用公开的免费 Google Translate 端点
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    const res = await fetch(url);
    const data = await res.json();

    let resultText = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) resultText += item[0];
      });
    }

    // 按分行重构回清晰易读的段落样式
    translatedBody.value = resultText.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '<br/>').join('');
    translationCache.value[newMail.id] = translatedBody.value;
  } catch (e) {
    console.error('翻译服务连接失败:', e);
    translatedBody.value = '<p style="color:var(--danger)">[翻译服务暂时不可用，请检查网络]</p>';
  } finally {
    isTranslating.value = false;
  }
}, { immediate: true });

onMounted(async () => {
  try {
    if (!store.emails || store.emails.length === 0) {
      if (store.fetchRealData) await store.fetchRealData();
    }
    if (store.emails && store.emails.length > 0) {
      const qId = route.query?.emailId ? Number(route.query.emailId) : null;
      const target = store.emails.find(e => e.id === qId) || store.emails[0];
      if (target) {
        currentEmailId.value = target.id;
        await refreshMails();
      }
    }
  } catch (err) {
    console.error('Mail 页面初始化异常:', err);
  }
});

watch(() => store.emails, (newEmails) => {
  if (newEmails && Array.isArray(newEmails) && newEmails.length > 0 && !currentEmailId.value) {
    currentEmailId.value = route.query?.emailId ? Number(route.query.emailId) : newEmails[0].id;
    refreshMails();
  }
}, { deep: true });

watch(() => route.query?.emailId, (newId) => {
  if (newId) {
    currentEmailId.value = Number(newId);
    refreshMails();
  }
});

const refreshMails = async () => {
  if (!currentEmailId.value) return;

  const emailObj = (store.emails || []).find(e => e.id === currentEmailId.value);
  if (emailObj && emailObj.address) {
    isLoading.value = true;
    try {
      if (store.fetchMailsForCurrent) {
        await store.fetchMailsForCurrent(emailObj.address, emailObj.id);
      }
    } catch (e) {
      console.error('[前端页面] 获取邮件发生异常:', e);
    } finally {
      isLoading.value = false;
    }

    if (currentMails.value.length > 0) {
      selectedMailId.value = currentMails.value[0].id;
    } else {
      selectedMailId.value = null;
    }
  }
};

const selectMail = (id: number) => {
  selectedMailId.value = id;
  if (store.mails && Array.isArray(store.mails)) {
    const mail = store.mails.find(m => m && m.id === id);
    if (mail) mail.unread = false;
  }
};

// 强制拦截标签点击，并调用原生系统浏览器外跳打开
const handleMailLinkClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const link = target.closest('a');
  if (link && link.href) {
    event.preventDefault(); // 阻止内部跳转
    if (window.electronAPI && window.electronAPI.openUrl) {
      window.electronAPI.openUrl(link.href);
    } else {
      window.open(link.href, '_blank');
    }
  }
};
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

/* ==== 新增翻译按钮组及双语排版样式 ==== */
.trans-toggle-group {
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.trans-btn {
  border: none;
  background: transparent;
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.trans-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 2px 4px rgba(79, 142, 247, 0.2);
}

.trans-btn:hover:not(.active) {
  background: rgba(0, 0, 0, 0.06);
}

.translating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 20px 0;
}

.bilingual-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bilingual-part {
  flex: 1;
}

.bilingual-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(79, 142, 247, 0.2);
  padding-bottom: 4px;
}

.bilingual-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 12px 0;
}
</style>