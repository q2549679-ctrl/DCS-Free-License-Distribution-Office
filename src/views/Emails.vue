<template>
  <section class="view active">
    <div class="page-header">
      <div>
        <div class="page-title">长期邮箱管理</div>
        <div class="page-subtitle">创建、监控和管理长期使用的 DCS 邮箱账号与密码</div>
      </div>
      <button class="btn btn-primary" @click="showNewEmailModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        添加/注册长期邮箱
      </button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="搜索邮箱地址..." v-model="searchQuery">
      </div>
      <div class="filter-tabs">
        <button class="filter-tab" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
        <button class="filter-tab" :class="{ active: filter === 'available' }" @click="filter = 'available'">可用</button>
        <button class="filter-tab" :class="{ active: filter === 'inuse' }" @click="filter = 'inuse'">使用中</button>
        <button class="filter-tab" :class="{ active: filter === 'cooling' }" @click="filter = 'cooling'">冷却中</button>
      </div>
    </div>

    <div class="email-grid">
      <div v-for="e in filteredEmails" :key="e.id" class="glass-card email-card" :class="{
        'warning-border': e.status === 'cooling' && e.cooldownLeft <= 7,
        'selected-global-email': store.globalSelectedEmailId === e.id
      }" @dblclick="store.globalSelectedEmailId = e.id">

        <div class="email-card-header">
          <div class="email-address">{{ e.address }}</div>
          <button class="copy-btn" @click.stop="copyText(e.address)" title="复制邮箱">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>

        <div class="email-meta">
          <div class="email-meta-row">
            <span class="email-meta-label">DCS 密码</span>
            <span class="email-meta-value pwd-container">
              <template v-if="!getUiState(e.id).isEditing">
                <span class="pwd-text" :class="{ 'is-empty': !e.password }">
                  <template v-if="e.password">
                    {{ getUiState(e.id).showPwd ? e.password : '••••••••' }}
                  </template>
                  <template v-else>
                    未设置
                  </template>
                </span>
                <button class="pwd-action-btn" @click.stop="togglePwd(e.id)" title="显示/隐藏" v-if="e.password">
                  <svg v-if="getUiState(e.id).showPwd" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button class="pwd-action-btn" @click.stop="editPwd(e.id, e.password)" title="修改密码">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button v-if="e.password && getUiState(e.id).showPwd" class="pwd-action-btn"
                  @click.stop="copyText(e.password)" title="复制密码">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </template>

              <template v-else>
                <input type="text" class="pwd-input" v-model="getUiState(e.id).tempPwd" placeholder="留空则清空密码"
                  @click.stop @keyup.enter="savePwd(e.id)">
                <button class="pwd-action-btn success" @click.stop="savePwd(e.id)" title="保存">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button class="pwd-action-btn danger" @click.stop="cancelEditPwd(e.id)" title="取消">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </template>
            </span>
          </div>

          <div class="email-meta-row">
            <span class="email-meta-label">状态</span>
            <span class="badge"
              :class="statusMap[e.status]?.class || 'badge-info'">{{ statusMap[e.status]?.label || e.status }}</span>
          </div>
          <div class="email-meta-row">
            <span class="email-meta-label">试用冷却</span>
            <span
              class="email-meta-value">{{ e.status === 'available' ? '已就绪，可立即试用' : `${e.cooldownLeft} 天后可再次试用` }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"
              :class="e.status === 'available' ? 'normal' : e.cooldownLeft <= 7 ? 'danger' : e.cooldownLeft <= 30 ? 'warning' : 'normal'"
              :style="{ width: e.status === 'available' ? '100%' : Math.round(((e.cooldownTotal - e.cooldownLeft) / e.cooldownTotal) * 100) + '%' }">
            </div>
          </div>
        </div>

        <div v-if="e.twofaSecret" class="email-2fa-section" @click.stop>
          <div class="email-2fa-header">
            <span class="email-2fa-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              2FA 验证码
            </span>
            <span class="email-2fa-timer" :class="{ urgent: e.twofaSeconds <= 10 }">{{ e.twofaSeconds }}s</span>
          </div>
          <div class="email-2fa-row">
            <span class="email-2fa-code">{{ e.twofaCode || '------' }}</span>
            <div class="email-2fa-actions">
              <button class="email-2fa-btn" title="复制验证码" @click.stop="copyText(e.twofaCode)"><svg viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg></button>
              <button class="email-2fa-btn" title="强制刷新验证码" @click.stop="store.updateTOTP()"><svg viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg></button>
              <button class="email-2fa-btn" title="解除绑定" style="color:var(--danger)"
                @click.stop="promptUnbind2FA(e.id)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg></button>
            </div>
          </div>
          <div class="email-2fa-bar">
            <div class="email-2fa-bar-fill" :class="{ urgent: e.twofaSeconds <= 10 }"
              :style="{ width: (e.twofaSeconds / 30 * 100) + '%' }"></div>
          </div>
        </div>

        <div v-else class="email-2fa-section" style="background:rgba(0,0,0,0.02);border:1px dashed rgba(0,0,0,0.15)"
          @click.stop>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:8px">
              <div
                style="width:28px;height:28px;border-radius:6px;background:rgba(79,142,247,0.1);display:flex;align-items:center;justify-content:center;color:var(--primary)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  style="width:14px;height:14px">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <div style="font-size:12px;font-weight:600;color:var(--text-primary)">未绑定 2FA</div>
                <div style="font-size:10px;color:var(--text-tertiary)">输入 DCS 确认码完成绑定</div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" @click.stop="openBindModal(e.id)">绑定</button>
          </div>
        </div>

        <div class="email-card-footer">
          <button class="btn btn-secondary btn-sm"
            @click.stop="router.push({ path: '/mail', query: { emailId: e.id } })">查看邮件</button>
          <button v-if="e.status === 'cooling'" class="btn btn-ghost btn-sm" @click.stop>标记刷新</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger)" @click.stop="confirmDelete(e)">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加长期邮箱弹窗 -->
    <div class="modal-overlay" :class="{ show: showNewEmailModal }" @click="showNewEmailModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">添加长期邮箱</div>
          <button class="modal-close" @click="showNewEmailModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>1. 配置邮箱前缀</label>
            <div style="display:flex; gap:8px; margin-bottom:16px;">
              <input type="text" v-model="newEmailPrefix" placeholder="输入邮箱前缀" style="flex:1">
              <button class="btn btn-secondary" @click="autoGenerateEmail" title="系统随机生成一个前缀">一键随机前缀</button>
            </div>

            <label>2. 选择公共邮箱后缀</label>
            <div class="domain-grid">
              <div v-for="domain in domainList" :key="domain" class="domain-tag"
                :class="{ active: newEmailDomain === domain }" @click="newEmailDomain = domain">
                {{ domain }}
              </div>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:10px;">
              选择上述后缀并保存后，应用将自动验证连通性。
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showNewEmailModal = false" :disabled="isRegistering">取消</button>
          <button class="btn btn-primary" @click="handleCreateEmail" :disabled="isRegistering">
            <span v-if="isRegistering" style="display:flex;align-items:center;gap:6px;">
              <svg class="spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                style="width:14px;height:14px;">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
              正在验证连接...
            </span>
            <span v-else>保存/注册</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 绑定 2FA 弹窗 -->
    <div class="modal-overlay" :class="{ show: showBindModal }" @click="closeBindModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">绑定 2FA 验证码</div>
          <button class="modal-close" @click="closeBindModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div
            style="margin-bottom:14px;padding:12px;background:rgba(79,142,247,0.06);border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.6">
            <strong style="color:var(--text-primary)">{{ currentBindEmail?.address }}</strong><br>
            请在 DCS World 官网安全设置中选择「<strong>手动输入代码</strong>」方式，将官网「说明」字段提供的验证密钥粘贴到下方。
          </div>
          <div class="form-group">
            <label>验证密钥（DCS 官网「说明」字段）</label>
            <input type="text" v-model="bindSecret" placeholder="例如：4JC2 CW3S YMUH 4FFV DKGR MEAI MMOK AWPS"
              style="font-family:Consolas,monospace;letter-spacing:1px;font-size:13px">
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">支持空格分隔格式，去除空格后不少于 16 位</div>
          </div>
          <div
            style="margin-top:16px;padding:14px;background:linear-gradient(135deg,rgba(79,142,247,0.08),rgba(54,207,201,0.06));border:1px solid rgba(79,142,247,0.2);border-radius:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span
                style="font-size:11px;font-weight:600;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px">动态码预览</span>
              <span class="email-2fa-timer" :class="{ urgent: previewSeconds <= 10 }"
                style="font-size:11px">{{ previewSeconds }}s</span>
            </div>
            <div
              style="font-size:28px;font-weight:700;letter-spacing:6px;color:var(--text-tertiary);font-family:Consolas,monospace;text-align:center;margin-bottom:8px">
              {{ previewCode }}
            </div>
            <div class="email-2fa-bar" style="margin-top:0">
              <div class="email-2fa-bar-fill" :class="{ urgent: previewSeconds <= 10 }"
                :style="{ width: (previewSeconds / 30 * 100) + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeBindModal">取消</button>
          <button class="btn btn-primary" @click="confirmBind2FA">确认绑定</button>
        </div>
      </div>
    </div>

    <!-- 解除 2FA 确认弹窗 -->
    <div class="modal-overlay" :class="{ show: showUnbindModal }" @click="showUnbindModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">解除绑定确认</div>
          <button class="modal-close" @click="showUnbindModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 8px; color: var(--text-primary);">
            确定要解除绑定该邮箱的 2FA 吗？
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUnbindModal = false">取消</button>
          <button class="btn btn-primary" style="background: #ef4444; border-color: #ef4444;"
            @click="executeUnbind2FA">解除绑定</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" :class="{ show: showDeleteModal }" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">删除确认</div>
          <button class="modal-close" @click="showDeleteModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 8px; color: var(--text-primary);">
            确定要永久删除长期邮箱 <strong style="font-family: Consolas, monospace;">{{ emailToDelete?.address }}</strong> 吗？
          </p>
          <p style="color: #ef4444; font-size: 12.5px; line-height: 1.5;">
            警告：相关的密码和 2FA 密钥将一并丢失，且不可恢复！
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-primary" style="background: #ef4444; border-color: #ef4444;"
            @click="executeDelete">确定删除</button>
        </div>
      </div>
    </div>

    <!-- 全局 Toast 提示 -->
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
import { useRouter } from 'vue-router';
import { useAppStore } from '../store';

const router = useRouter();
const store = useAppStore();
const searchQuery = ref('');
const filter = ref('all');

const statusMap: Record<string, any> = {
  available: { label: '可用', class: 'badge-success' },
  inuse: { label: '使用中', class: 'badge-info' },
  cooling: { label: '冷却中', class: 'badge-warning' },
};

const filteredEmails = computed(() => {
  return store.emails.filter(e => {
    const matchSearch = e.address.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchFilter = filter.value === 'all' || e.status === filter.value;
    return matchSearch && matchFilter;
  });
});

function copyText(text: string | null) {
  if (text) navigator.clipboard.writeText(text);
}

const pwdUiStates = ref<Record<number, { showPwd: boolean, isEditing: boolean, tempPwd: string }>>({});

function getUiState(id: number) {
  if (!pwdUiStates.value[id]) {
    pwdUiStates.value[id] = { showPwd: false, isEditing: false, tempPwd: '' };
  }
  return pwdUiStates.value[id];
}

function togglePwd(id: number) {
  const state = getUiState(id);
  state.showPwd = !state.showPwd;
}

function editPwd(id: number, currentPwd: string) {
  const state = getUiState(id);
  state.tempPwd = currentPwd || '';
  state.isEditing = true;
}

async function savePwd(id: number) {
  const state = getUiState(id);
  try {
    if (window.electronAPI) {
      await window.electronAPI.updatePassword(id, state.tempPwd);
      await store.fetchRealData();
    }
    state.isEditing = false;
  } catch (error) {
    showToast('保存密码失败', 'error');
    console.error(error);
  }
}

function cancelEditPwd(id: number) {
  getUiState(id).isEditing = false;
}

const toast = ref({ show: false, message: '', type: 'success' });
let toastTimer: any = null;

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}

const showUnbindModal = ref(false);
const emailToUnbind = ref<number | null>(null);

function promptUnbind2FA(id: number) {
  emailToUnbind.value = id;
  showUnbindModal.value = true;
}

async function executeUnbind2FA() {
  if (emailToUnbind.value === null) return;
  try {
    if (window.electronAPI) {
      await window.electronAPI.update2FA(emailToUnbind.value, null);
      await store.fetchRealData();
      showToast('已解除 2FA 绑定', 'success');
    }
  } catch (error) {
    showToast('解除绑定失败', 'error');
  } finally {
    showUnbindModal.value = false;
    emailToUnbind.value = null;
  }
}

const showDeleteModal = ref(false);
const emailToDelete = ref<any>(null);

function confirmDelete(email: any) {
  emailToDelete.value = email;
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!emailToDelete.value) return;

  try {
    if (window.electronAPI) {
      await window.electronAPI.deleteEmail(emailToDelete.value.id);
    }
    if (store.globalSelectedEmailId === emailToDelete.value.id) {
      store.globalSelectedEmailId = null;
    }
    await store.fetchRealData();
    showToast(`🗑️ 成功删除邮箱：${emailToDelete.value.address}`, 'success');
  } catch (error) {
    console.error(error);
    showToast('删除失败，请稍后重试', 'error');
  } finally {
    showDeleteModal.value = false;
    emailToDelete.value = null;
  }
}

const showNewEmailModal = ref(false);
const newEmailPrefix = ref('');
const newEmailDomain = ref('@sharklasers.com');
const isRegistering = ref(false);

const domainList = [
  '@sharklasers.com', '@grr.la'
];

function autoGenerateEmail() {
  const randomStr = Math.random().toString(36).substring(2, 8);
  newEmailPrefix.value = `${randomStr}`;
}

async function handleCreateEmail() {
  if (!newEmailPrefix.value) {
    showToast('请输入或生成邮箱前缀', 'error');
    return;
  }

  const fullAddress = `${newEmailPrefix.value}${newEmailDomain.value}`;
  isRegistering.value = true;

  try {
    if (window.electronAPI) {
      const apiTestPromise = window.electronAPI.pingApi(fullAddress);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
      const [apiSuccess] = await Promise.all([apiTestPromise, delayPromise]);
      if (!apiSuccess) throw new Error('SERVER_REJECTED');

      await window.electronAPI.addEmail(fullAddress);
      await store.fetchRealData();
    }

    showToast(`🎉 注册成功：已与邮箱服务器完成握手`, 'success');
    newEmailPrefix.value = '';
    showNewEmailModal.value = false;

  } catch (error: any) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      showToast('添加失败：该邮箱已在您的列表中', 'error');
    } else {
      showToast(`注册失败：服务器无响应或被防火墙拦截`, 'error');
    }
  } finally {
    isRegistering.value = false;
  }
}

const showBindModal = ref(false);
const currentBindEmailId = ref<number | null>(null);
const bindSecret = ref('');
const previewCode = ref('------');
const previewSeconds = ref(30);
let previewInterval: any = null;

const currentBindEmail = computed(() => store.emails.find(e => e.id === currentBindEmailId.value));

watch(bindSecret, () => updatePreview());

async function updatePreview() {
  const cleanSecret = bindSecret.value.replace(/\s/g, '').toUpperCase();
  if (cleanSecret.length >= 16) {
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.generateTOTP(cleanSecret);
        if (res) {
          previewCode.value = res.code;
          previewSeconds.value = res.seconds;
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  previewCode.value = '------';
  previewSeconds.value = 30;
}

function openBindModal(id: number) {
  currentBindEmailId.value = id;
  bindSecret.value = '';
  previewCode.value = '------';
  showBindModal.value = true;
  previewInterval = setInterval(updatePreview, 1000);
}

function closeBindModal() {
  showBindModal.value = false;
  if (previewInterval) clearInterval(previewInterval);
}

async function confirmBind2FA() {
  const cleanSecret = bindSecret.value.replace(/\s/g, '').toUpperCase();
  if (cleanSecret.length < 16) {
    showToast('验证密钥长度不足，去除空格后不少于 16 位', 'error');
    return;
  }
  if (currentBindEmailId.value !== null) {
    try {
      if (window.electronAPI) {
        await window.electronAPI.update2FA(currentBindEmailId.value, cleanSecret);
        await store.fetchRealData();
        await store.updateTOTP();
        showToast('2FA 绑定成功', 'success');
      }
    } catch (error: any) {
      console.error('保存 2FA 密钥失败:', error);
      showToast('绑定失败，请查看控制台报错', 'error');
    }
  }
  closeBindModal();
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

.email-card {
  -webkit-user-select: none;
  user-select: none;
}

.email-card.selected-global-email {
  border: 2px solid var(--warning) !important;
  box-shadow: 0 4px 16px rgba(255, 154, 46, 0.25) !important;
  transform: translateY(-2px);
}

.pwd-container {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
}

.pwd-text {
  font-family: 'Consolas', monospace;
  font-size: 13px;
  min-width: 60px;
}

.pwd-text.is-empty {
  font-family: inherit;
  color: var(--text-tertiary);
  font-size: 12px;
}

.pwd-input {
  width: 120px;
  padding: 2px 6px;
  font-size: 12px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  outline: none;
  font-family: 'Consolas', monospace;
}

.pwd-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pwd-action-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary);
}

.pwd-action-btn.success:hover {
  color: var(--success);
}

.pwd-action-btn.danger:hover {
  color: var(--danger);
}

.pwd-action-btn svg {
  width: 14px;
  height: 14px;
}

.domain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 6px;
}

.domain-tag {
  padding: 8px 6px;
  font-size: 11.5px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.15s ease;
  color: var(--text-secondary);
  font-family: 'Consolas', monospace;
}

.domain-tag:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  border-color: rgba(0, 0, 0, 0.2);
}

.domain-tag.active {
  background: rgba(79, 142, 247, 0.12);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(79, 142, 247, 0.2);
}
</style>