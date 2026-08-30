import { defineStore } from "pinia";

declare global {
  interface Window {
    electronAPI: any;
  }
}

// key名称
const STORAGE_KEY_SETTINGS = "app_settings";
const STORAGE_KEY_SELECTED_EMAIL = "app_global_selected_email";

// 读取本地保存的设置
function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return null;
}
function loadPersistedSelectedEmailId(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY_SELECTED_EMAIL);
    if (v === null) return null;
    const num = parseInt(v, 10);
    return isNaN(num) ? null : num;
  } catch (e) {
    return null;
  }
}

// 默认值
const defaultSettings = {
  theme: "system",
  glassStrength: 2,
  primaryColor: "#4F8EF7",
  userName: "Pilot_2024",
  userAvatar: "P",
};

export const useAppStore = defineStore("app", {
  state: () => {
    // 初始化时尝试读取本地持久化数据，若无则使用默认值
    const savedSettings = loadPersistedSettings();
    const initSettings = savedSettings
      ? { ...defaultSettings, ...savedSettings }
      : { ...defaultSettings };

    return {
      settings: initSettings,
      emails: [] as any[],
      mails: [] as any[],
      assets: [] as any[],
      activities: [] as any[],
      globalSelectedEmailId: loadPersistedSelectedEmailId(),
      totpTimer: null as any,
    };
  },

  getters: {
    expiringItems: (state) => {
      const items: any[] = [];
      state.emails.forEach((e) => {
        if (
          e.status === "cooling" &&
          e.cooldownLeft <= 7 &&
          e.cooldownLeft > 0
        ) {
          items.push({
            id: `e${e.id}`,
            emailId: e.id,
            name: e.address,
            type: "邮箱冷却期",
            days: e.cooldownLeft,
            urgent: e.cooldownLeft <= 3,
            icon: "@",
            route: "/emails",
          });
        }
      });
      state.assets.forEach((a) => {
        if (
          (a.status === "active" || a.status === "expiring") &&
          a.daysLeft <= 7
        ) {
          items.push({
            id: `a${a.id}`,
            emailId: a.emailId,
            name: a.name,
            type: "试用资产 " + a.category,
            days: a.daysLeft,
            urgent: a.daysLeft <= 3,
            icon: "✈️",
            route: "/assets",
          });
        }
      });
      return items.sort((a, b) => a.days - b.days);
    },

    // 无论任何时刻，强制精准锁定当前活跃邮箱名下的 active 试用资产
    currentActiveAssetsCount: (state) => {
      if (!state.emails || state.emails.length === 0) return 0;
      // 改用 ?? 安全获取目标邮箱ID，同时覆盖 null 和 undefined
      const targetEmailId = state.globalSelectedEmailId ?? state.emails[0]?.id;
      if (!targetEmailId) return 0;

      // 按资产名称二次去重，避免同名不同格式导致的重复统计
      const uniqueAssetMap = new Map<string, any>();
      state.assets.forEach((a) => {
        if (Number(a.emailId) === Number(targetEmailId)) {
          const key = (a.name || "").trim().toLowerCase();
          if (!uniqueAssetMap.has(key)) {
            uniqueAssetMap.set(key, a);
          }
        }
      });

      // 仅统计状态为 active 且剩余天数大于 0 的资产
      let count = 0;
      uniqueAssetMap.forEach((a) => {
        if (a.status === "active" && Number(a.daysLeft) > 0) {
          count++;
        }
      });
      return count;
    },
  },

  actions: {
    async fetchRealData() {
      if (!window.electronAPI) return;
      this.emails = await window.electronAPI.getEmails();
      const rawAssets = (await window.electronAPI.getAssets()) || [];

      // 确保 globalSelectedEmailId 必定有合法的当前邮箱 ID
      if (this.emails.length > 0) {
        if (
          this.globalSelectedEmailId == null || // null 或 undefined 都触发重置
          !this.emails.some((e) => e.id === this.globalSelectedEmailId)
        ) {
          this.globalSelectedEmailId = this.emails[0].id;
        }
      } else {
        this.globalSelectedEmailId = null;
      }

      const todayTimestamp = new Date().setHours(0, 0, 0, 0);
      const validEmailIds = this.emails.map((e) => Number(e.id));

      // 仅处理属于现有邮箱的资产
      const validRawAssets = rawAssets.filter((a: any) =>
        validEmailIds.includes(Number(a.emailId)),
      );

      const assetMap = new Map<string, any>();
      validRawAssets.forEach((a: any) => {
        const key = `${a.emailId}_${a.name}`;
        assetMap.set(key, a);
      });

      this.assets = Array.from(assetMap.values()).map((a: any) => {
        if (a.status === "active" && a.endDate && a.endDate !== "-") {
          const endDateObj = new Date(a.endDate + "T00:00:00");
          const endTimestamp = endDateObj.getTime();

          // 日期解析失败则直接标记为冷却，避免虚增
          if (isNaN(endTimestamp)) {
            a.status = "cooling";
            a.daysLeft = 0;
            a.totalDays = 180;
            return a;
          }

          const diff = Math.ceil((endTimestamp - todayTimestamp) / 86400000);
          if (diff <= 0) {
            a.status = "cooling";
            a.daysLeft = 0;
            a.totalDays = 180;
          } else {
            a.status = "active";
            a.daysLeft = diff;
            a.totalDays = 14;
          }
        } else if (a.status !== "cooling" && a.status !== "available") {
          // 未知状态统一按非活跃冷却处理
          a.status = "cooling";
          a.daysLeft = 0;
          a.totalDays = 180;
        }
        return a;
      });

      this.syncCooldowns();
    },

    // 新增：持久化保存设置，每次修改设置后调用
    savePersist() {
      try {
        localStorage.setItem(
          STORAGE_KEY_SETTINGS,
          JSON.stringify(this.settings),
        );
        if (this.globalSelectedEmailId !== null) {
          localStorage.setItem(
            STORAGE_KEY_SELECTED_EMAIL,
            String(this.globalSelectedEmailId),
          );
        } else {
          localStorage.removeItem(STORAGE_KEY_SELECTED_EMAIL);
        }
      } catch (e) {
        console.warn("保存本地设置失败", e);
      }
    },

    // 重置前端本地持久化（给清除全部数据用）
    clearPersistedLocal() {
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_SELECTED_EMAIL);
      // state恢复默认
      this.settings = { ...defaultSettings };
      this.globalSelectedEmailId = null;
    },

    async resetAllApplicationData() {
      // 1. 调用主进程清空 SQLite 数据库
      if (
        window.electronAPI &&
        typeof window.electronAPI.clearAllDatabase === "function"
      ) {
        await window.electronAPI.clearAllDatabase();
      } else {
        // 兜底策略：若 Preload 缓存异常，通过单条删除清空已有数据
        if (
          this.emails &&
          this.emails.length > 0 &&
          window.electronAPI?.deleteEmail
        ) {
          for (const email of this.emails) {
            await window.electronAPI.deleteEmail(email.id);
          }
        }
      }

      // 2. 清空前端内存中的响应式数据
      this.emails = [];
      this.mails = [];
      this.assets = [];
      this.activities = [];
      this.globalSelectedEmailId = null;

      // 3. 清空 LocalStorage 偏好设置
      this.clearPersistedLocal();

      // 4. 重新拉取确认数据库状态
      await this.fetchRealData();

      this.addActivity(
        "⚠️ 用户执行【清除全部应用数据】，数据库与设置已恢复出厂",
        "danger",
      );
    },

    async markAssetActive(emailId: number, module: any) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14);

      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      const newAsset = {
        emailId,
        name: module.name,
        category: module.category,
        status: "active",
        startDate: formatDate(today),
        endDate: formatDate(endDate),
        daysLeft: 14,
        totalDays: 14,
        url: module.url,
      };

      if (window.electronAPI && window.electronAPI.upsertAsset) {
        await window.electronAPI.upsertAsset(newAsset);
      }
      await this.fetchRealData();
      this.addActivity(`激活了 ${module.name} 的试用期 (14天)`, "success");
    },

    async updateTOTP() {
      if (!window.electronAPI) return;
      for (let email of this.emails) {
        if (email.twofaSecret) {
          const result = await window.electronAPI.generateTOTP(
            email.twofaSecret,
          );
          if (result) {
            email.twofaCode = result.code;
            email.twofaSeconds = result.seconds;
          }
        }
      }
    },

    startTOTPInterval() {
      this.updateTOTP();
      if (this.totpTimer) clearInterval(this.totpTimer);
      this.totpTimer = setInterval(() => this.updateTOTP(), 1000);
    },

    addActivity(
      text: string,
      status: "success" | "warning" | "danger" = "success",
    ) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      this.activities.push({ id: Date.now(), text, time, status });
    },

    syncCooldowns() {
      const todayTimestamp = new Date().setHours(0, 0, 0, 0);
      this.emails.forEach((email) => {
        const emailAssets = this.assets.filter(
          (a) => Number(a.emailId) === Number(email.id),
        );
        if (emailAssets.length > 0) {
          const earliestTimestamp = Math.min(
            ...emailAssets.map((a) =>
              new Date(a.startDate + "T00:00:00").getTime(),
            ),
          );
          const cooldownEndTimestamp =
            earliestTimestamp + 180 * 24 * 60 * 60 * 1000;
          const diffDays = Math.ceil(
            (cooldownEndTimestamp - todayTimestamp) / (24 * 60 * 60 * 1000),
          );

          email.cooldownLeft = Math.max(0, diffDays);
          email.cooldownTotal = 180;
          const hasActive = emailAssets.some(
            (a) =>
              a.daysLeft > 0 &&
              (a.status === "active" || a.status === "expiring"),
          );
          email.status = hasActive
            ? "inuse"
            : email.cooldownLeft > 0
              ? "cooling"
              : "available";
          email.asset = emailAssets.map((a) => a.name).join("、");
        } else {
          email.status = "available";
          email.cooldownLeft = 0;
          email.cooldownTotal = 180;
          email.asset = "未绑定";
        }
      });
    },

    async fetchMailsForCurrent(emailAddress: string, emailId: number) {
      if (!window.electronAPI) return;
      try {
        const mails = await window.electronAPI.fetchMails(emailAddress);
        const otherMails = this.mails.filter((m: any) => m.emailId !== emailId);

        if (mails && mails.length > 0) {
          const mappedMails = mails.map((m: any) => ({ ...m, emailId }));
          this.mails = [...otherMails, ...mappedMails];
        } else {
          this.mails = otherMails;
        }
      } catch (error) {
        console.error("[前端] 拉取邮件失败:", error);
      }
    },
  },
});
