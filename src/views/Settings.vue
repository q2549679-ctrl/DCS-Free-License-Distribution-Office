<template>
  <section class="view active">
    <div class="page-header">
      <div>
        <div class="page-title">系统设置</div>
        <div class="page-subtitle">偏好设置与数据管理</div>
      </div>
    </div>
    <div class="settings-layout">
      <!-- 设置导航 -->
      <ul class="settings-nav">
        <li class="settings-nav-item" :class="{ active: activeSection === 'interface' }"
          @click="activeSection = 'interface'">界面设置</li>
        <li class="settings-nav-item" :class="{ active: activeSection === 'backup' }" @click="activeSection = 'backup'">
          数据备份</li>
        <li class="settings-nav-item" :class="{ active: activeSection === 'about' }" @click="activeSection = 'about'">
          关于应用</li>
      </ul>

      <div class="settings-content">
        <!-- 界面设置 (保持原有) -->
        <div class="settings-section active" v-if="activeSection === 'interface'">
          <div class="settings-group">
            <div class="settings-group-title">界面偏好</div>
            <div class="form-row">
              <div class="form-label">主题模式</div>
              <div class="form-control">
                <select v-model="store.settings.theme">
                  <option value="light">浅色模式</option>
                  <option value="dark">深色模式</option>
                  <option value="system">跟随系统</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">背景模糊强度<small>调整磨砂玻璃效果的透明度</small></div>
              <div class="form-control">
                <div class="slider-row">
                  <input type="range" min="1" max="3" v-model.number="store.settings.glassStrength">
                  <span class="slider-value">{{ ['低', '中', '高'][store.settings.glassStrength - 1] }}</span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">主色调自定义</div>
              <div class="form-control">
                <div class="color-picker-row">
                  <input type="color" v-model="store.settings.primaryColor">
                  <span style="text-transform: uppercase;">{{ store.settings.primaryColor }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 核心新增：数据备份 -->
        <div class="settings-section active" v-if="activeSection === 'backup'">
          <div class="settings-group">
            <div class="settings-group-title">本地数据管理</div>

            <div class="form-row" style="align-items: flex-start;">
              <div class="form-label">
                存放路径
                <small
                  style="word-break: break-all; max-width: 300px; margin-top: 4px; line-height: 1.4;">{{ backupPath }}</small>
              </div>
              <div class="form-control">
                <button class="btn btn-secondary btn-sm" @click="changeBackupPath">更改路径</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">导出数据<small>将当前所有数据备份至上述路径</small></div>
              <div class="form-control">
                <button class="btn btn-secondary btn-sm" @click="handleBackup">立即备份</button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label">恢复数据<small>从备份文件覆盖当前数据，重启生效</small></div>
              <div class="form-control">
                <button class="btn btn-secondary btn-sm" @click="handleRestore">选择文件恢复</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            清除全部应用数据
            <small style="color:var(--danger); display:block; margin-top:4px;">⚠️ 所有邮箱、资产、头像用户名全部恢复出厂设置，不可撤销</small>
          </div>
          <div class="form-control">
            <button class="btn btn-secondary btn-sm" @click="openResetConfirm = true">执行清除全部数据</button>
          </div>
        </div>

        <!-- 清除全部确认弹窗 (保持不变) -->
        <div class="modal-overlay" :class="{ show: openResetConfirm }" @click="openResetConfirm = false">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <div class="modal-title">危险操作：清除全部应用数据</div>
              <button class="modal-close" @click="openResetConfirm = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p style="color:var(--danger);font-weight:bold">确定要清除全部数据吗？</p>
              <p>1. 所有已添加邮箱账号全部删除</p>
              <p>2. 全部试用资产记录清空</p>
              <p>3. 头像、用户名、主题设置全部恢复默认</p>
              <p><strong>此操作无法撤销！</strong></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="openResetConfirm = false">取消</button>
              <button class="btn btn-primary" style="background-color:#ef4444;border-color:#ef4444"
                @click="handleResetAll">确认清除全部</button>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section active" v-if="activeSection === 'about'">
          <div class="settings-group">
            <div class="settings-group-title">版本信息</div>
            <div class="form-row">
              <div class="form-label">应用名称</div>
              <div class="form-control" style="color:var(--text-secondary)">DCS 白嫖许可证发放处</div>
            </div>
            <div class="form-row">
              <div class="form-label">当前版本</div>
              <div class="form-control" style="color:var(--text-secondary)">v1.0.0</div>
            </div>
          </div>
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
import { ref, onMounted } from 'vue';
import { useAppStore } from '../store';

const store = useAppStore();
const activeSection = ref('backup');
const backupPath = ref('读取中...');

const openResetConfirm = ref(false);

async function handleResetAll() {
  openResetConfirm.value = false;
  try {
    await store.resetAllApplicationData();
    showToast("✅ 全部数据已清除完成，程序设置恢复出厂", 'success');
  } catch (e) {
    showToast("❌ 清除全部数据失败", 'error')
  }
}


// Toast 反馈逻辑
const toast = ref({ show: false, message: '', type: 'success' });
let toastTimer: any = null;
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.value.show = false, 3000);
}

onMounted(async () => {
  backupPath.value = await window.electronAPI.getDefaultBackupPath();
});

async function changeBackupPath() {
  const newPath = await window.electronAPI.selectBackupPath(backupPath.value);
  if (newPath) backupPath.value = newPath;
}

async function handleBackup() {
  const res = await window.electronAPI.executeBackup(backupPath.value);
  if (res.success) {
    showToast('🎉 数据备份成功！', 'success');
  } else {
    showToast('备份失败: ' + res.error, 'error');
  }
}

async function handleRestore() {
  const defaultDir = backupPath.value;
  const res = await window.electronAPI.executeRestore(defaultDir);

  if (res.canceled) return;

  if (res.success) {
    await store.fetchRealData(); // 重新加载数据
    showToast('🎉 数据恢复成功！', 'success');
  } else {
    showToast('恢复失败: ' + res.error, 'error');
  }
}
</script>