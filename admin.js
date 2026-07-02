/* ==================================================
   ALLURE 管理者画面 admin.js

   役割：
   ・管理者ログイン画面の操作
   ・打刻画面へ戻る
   ・管理者ログイン処理
   ・権限 main / admin によるメニュー表示切替

   注意：
   Apps Script側に checkAdminLogin action を追加後、
   管理者ログインが実際に動く
   ================================================== */


/* ==================================================
   Apps Script WebアプリURL
   app.js と同じURL
   ================================================== */

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz42nC-sCcf8H1ybtfX4MD8VkfJixvyn9s0Y69onmk2-AOZ0hyHYpWHuRpET84JDulJ/exec";


/* ==================================================
   ログイン中管理者情報
   ================================================== */

let currentAdminId = "";
let currentAdminName = "";
let currentAdminRole = "";
let currentAdminPw = "";
let currentAdminProtectionType = "";


/* ==================================================
   起動処理
   ================================================== */

window.addEventListener("DOMContentLoaded", function () {
  setupAdminEvents();
  showLoginArea();

  const adminIdInput = document.getElementById("adminIdInput");

  if (adminIdInput) {
    adminIdInput.focus();
  }
});


/* ==================================================
   イベント設定
   ================================================== */

function setupAdminEvents() {
  const btnBackToPunch = document.getElementById("btnBackToPunch");
  const btnAdminLogin = document.getElementById("btnAdminLogin");
  const btnAdminLogout = document.getElementById("btnAdminLogout");
  const adminIdInput = document.getElementById("adminIdInput");
  const adminPwInput = document.getElementById("adminPwInput");

  if (btnBackToPunch) {
    btnBackToPunch.addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  if (btnAdminLogin) {
    btnAdminLogin.addEventListener("click", function () {
      checkAdminLogin();
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener("click", function () {
      logoutAdmin();
    });
  }

  if (adminIdInput) {
    adminIdInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();

        if (adminPwInput) {
          adminPwInput.focus();
        }
      }
    });
  }

  if (adminPwInput) {
    adminPwInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        checkAdminLogin();
      }
    });
  }

  setupMenuButtons();
}


/* ==================================================
   管理者ログイン
   Apps Script action: checkAdminLogin
   ================================================== */

async function checkAdminLogin() {
  const adminIdInput = document.getElementById("adminIdInput");
  const adminPwInput = document.getElementById("adminPwInput");

  const adminId = adminIdInput ? adminIdInput.value.trim() : "";
  const adminPw = adminPwInput ? adminPwInput.value.trim() : "";

  if (!adminId) {
    showAdminMessage("管理者IDを入力してください", "warning");
    if (adminIdInput) adminIdInput.focus();
    return;
  }

  if (!adminPw) {
    showAdminMessage("暗証番号を入力してください", "warning");
    if (adminPwInput) adminPwInput.focus();
    return;
  }

  showAdminMessage("ログイン確認中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "checkAdminLogin",
        adminId: adminId,
        adminPw: adminPw
      })
    });

    const data = await response.json();

  if (!data.success) {
    currentAdminId = "";
    currentAdminName = "";
    currentAdminRole = "";
    currentAdminPw = "";
    currentAdminProtectionType = "";

    showAdminMessage(data.message || "管理者IDまたは暗証番号が違います", "error");
    return;
  }

    currentAdminId = data.adminId || adminId;
    currentAdminName = data.adminName || "";
    currentAdminRole = data.role || data.adminRole || "";
    currentAdminPw = adminPw;
    currentAdminProtectionType = data.protectionType || "";

    if (!currentAdminRole) {
      showAdminMessage("管理者権限が取得できません", "error");
      return;
    }

    showMenuArea();
    applyRoleMenu(currentAdminRole);

    showWorkMessage("メニューを選択してください。");

  } catch (error) {
    console.error("管理者ログインエラー:", error);
    showAdminMessage("管理者ログインでエラーが発生しました", "error");
  }
}


/* ==================================================
   ログアウト
   ================================================== */

function logoutAdmin() {
  currentAdminId = "";
  currentAdminName = "";
  currentAdminRole = "";
  currentAdminPw = "";
  currentAdminProtectionType = "";

  const adminIdInput = document.getElementById("adminIdInput");
  const adminPwInput = document.getElementById("adminPwInput");

  if (adminIdInput) adminIdInput.value = "";
  if (adminPwInput) adminPwInput.value = "";

  showLoginArea();
  showAdminMessage("管理者IDと暗証番号を入力してください", "");

  if (adminIdInput) {
    adminIdInput.focus();
  }
}


/* ==================================================
   画面切替
   ================================================== */

function showLoginArea() {
  const adminLoginArea = document.getElementById("adminLoginArea");
  const adminMenuArea = document.getElementById("adminMenuArea");

  if (adminLoginArea) {
    adminLoginArea.classList.remove("hidden");
  }

  if (adminMenuArea) {
    adminMenuArea.classList.add("hidden");
  }
}

function showMenuArea() {
  const adminLoginArea = document.getElementById("adminLoginArea");
  const adminMenuArea = document.getElementById("adminMenuArea");
  const loginAdminName = document.getElementById("loginAdminName");
  const loginAdminRole = document.getElementById("loginAdminRole");

  if (adminLoginArea) {
    adminLoginArea.classList.add("hidden");
  }

  if (adminMenuArea) {
    adminMenuArea.classList.remove("hidden");
  }

  if (loginAdminName) {
    loginAdminName.textContent = currentAdminName || currentAdminId || "未設定";
  }

  if (loginAdminRole) {
    if (currentAdminRole === "main") {
      loginAdminRole.textContent = "Main管理者";
    } else if (currentAdminRole === "admin") {
      loginAdminRole.textContent = "管理者";
    } else {
      loginAdminRole.textContent = currentAdminRole || "未確認";
    }
  }
}


/* ==================================================
   権限別メニュー表示
   ================================================== */

function applyRoleMenu(role) {
  const mainOnlyButtons = document.querySelectorAll(".menu-main-only");

  mainOnlyButtons.forEach(function (button) {
    button.classList.remove("hidden");
    button.classList.remove("disabled-menu");
    button.disabled = false;
  });

  if (role === "main") {
    return;
  }

  if (role === "admin") {
    mainOnlyButtons.forEach(function (button) {
      button.classList.add("hidden");
      button.disabled = true;
    });

    return;
  }

  mainOnlyButtons.forEach(function (button) {
    button.classList.add("hidden");
    button.disabled = true;
  });
}


/* ==================================================
   メニューボタン
   現段階では画面表示のみ
   ================================================== */

function setupMenuButtons() {
  const menuButtons = document.querySelectorAll(".menu-button");

  menuButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.disabled || button.classList.contains("disabled-menu")) {
        return;
      }

      const menu = button.dataset.menu || "";

      handleMenuClick(menu);
    });
  });
}

function handleMenuClick(menu) {
  if (!currentAdminId || !currentAdminRole) {
    showWorkMessage("管理者ログインが必要です。");
    return;
  }

  switch (menu) {
    case "punchSearch":
      showPunchSearchForm();
      break;

    case "editHistory":
      showPunchEditHistory();
      break;

    case "staffAdd":
      showStaffAddForm();
      break;

    case "staffStatus":
      showStaffStatusList();
      break;

    case "staffHistory":
      showStaffChangeHistory();
      break;

    case "staffPunchStatus":
      showStaffPunchStatus();
      break;

    case "adminAdd":
      if (currentAdminRole !== "main") {
        showWorkMessage("この機能はMain管理者のみ使用できます。");
        return;
      }
      showAdminAddForm();
      break;

    case "adminStatus":
      if (currentAdminRole !== "main") {
        showWorkMessage("この機能はMain管理者のみ使用できます。");
        return;
      }
      showAdminStatusList();
      break;

    case "adminRole":
      if (currentAdminRole !== "main") {
        showWorkMessage("この機能はMain管理者のみ使用できます。");
        return;
      }
      showAdminRoleList();
      break;

    case "errorLog":
      if (currentAdminRole !== "main") {
        showWorkMessage("この機能はMain管理者のみ使用できます。");
        return;
      }
      showErrorLogList();
      break;

    case "settings":
      if (currentAdminRole !== "main") {
        showWorkMessage("この機能はMain管理者のみ使用できます。");
        return;
      }
      showSettingsList();
      break;

    default:
      showWorkMessage("未対応のメニューです。");
      break;
  }
}

/* ==================================================
   表示メッセージ
   ================================================== */

function showAdminMessage(message, type) {
  const el = document.getElementById("adminLoginMessage");

  if (!el) return;

  el.textContent = message;

  el.classList.remove("error");
  el.classList.remove("success");
  el.classList.remove("warning");

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }

  if (type === "warning") {
    el.classList.add("warning");
  }
}

/* ==================================================
   スタッフ追加フォーム表示
   ================================================== */

function showStaffAddForm() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  workArea.innerHTML = `
    <div class="work-title">スタッフ追加</div>

    <div class="admin-form">

      <div class="admin-form-row">
        <label for="newStaffCode">従業員コード</label>
        <input id="newStaffCode" class="admin-form-input" type="text" inputmode="numeric" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newStaffName">スタッフ名</label>
        <input id="newStaffName" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newStaffPin">暗証番号</label>
        <input id="newStaffPin" class="admin-form-input" type="password" inputmode="numeric" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newStaffStatus">状態</label>
        <select id="newStaffStatus" class="admin-form-input">
          <option value="有効">有効</option>
          <option value="無効">無効</option>
        </select>
      </div>

      <div class="admin-form-row">
        <label for="newStaffMemo">備考</label>
        <input id="newStaffMemo" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newStaffReason">追加理由</label>
        <input id="newStaffReason" class="admin-form-input" type="text" autocomplete="off" value="新規スタッフ登録">
      </div>

      <button id="btnAddStaffSubmit" class="admin-action-button" type="button">
        スタッフを追加する
      </button>

      <div id="staffAddMessage" class="admin-sub-message">
        必要情報を入力してください。
      </div>

    </div>
  `;

  const btnAddStaffSubmit = document.getElementById("btnAddStaffSubmit");

  if (btnAddStaffSubmit) {
    btnAddStaffSubmit.addEventListener("click", function () {
      addStaff();
    });
  }

  const newStaffCode = document.getElementById("newStaffCode");

  if (newStaffCode) {
    newStaffCode.focus();
  }
}

/* ==================================================
   スタッフ追加保存
   Apps Script action: addStaff
   ================================================== */

async function addStaff() {
  const newStaffCode = document.getElementById("newStaffCode");
  const newStaffName = document.getElementById("newStaffName");
  const newStaffPin = document.getElementById("newStaffPin");
  const newStaffStatus = document.getElementById("newStaffStatus");
  const newStaffMemo = document.getElementById("newStaffMemo");
  const newStaffReason = document.getElementById("newStaffReason");
  const btnAddStaffSubmit = document.getElementById("btnAddStaffSubmit");

  const staffCode = newStaffCode ? newStaffCode.value.trim() : "";
  const staffName = newStaffName ? newStaffName.value.trim() : "";
  const staffPin = newStaffPin ? newStaffPin.value.trim() : "";
  const staffStatus = newStaffStatus ? newStaffStatus.value.trim() : "";
  const staffMemo = newStaffMemo ? newStaffMemo.value.trim() : "";
  const reason = newStaffReason ? newStaffReason.value.trim() : "";

  if (!currentAdminId || !currentAdminPw) {
    showStaffAddMessage("管理者ログイン情報がありません。再ログインしてください。", "error");
    return;
  }

  if (!staffCode) {
    showStaffAddMessage("従業員コードを入力してください。", "warning");
    if (newStaffCode) newStaffCode.focus();
    return;
  }

  if (!staffName) {
    showStaffAddMessage("スタッフ名を入力してください。", "warning");
    if (newStaffName) newStaffName.focus();
    return;
  }

  if (!staffPin) {
    showStaffAddMessage("暗証番号を入力してください。", "warning");
    if (newStaffPin) newStaffPin.focus();
    return;
  }

  if (staffStatus !== "有効" && staffStatus !== "無効") {
    showStaffAddMessage("状態は「有効」または「無効」を選択してください。", "warning");
    return;
  }

  if (btnAddStaffSubmit) {
    btnAddStaffSubmit.disabled = true;
    btnAddStaffSubmit.textContent = "追加中...";
  }

  showStaffAddMessage("スタッフ追加中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addStaff",

        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,

        staffCode: staffCode,
        staffName: staffName,
        staffPin: staffPin,
        staffStatus: staffStatus,
        staffMemo: staffMemo,
        reason: reason
      })
    });

    const data = await response.json();

  if (!data.success) {
    await sendAdminErrorLog(
      "スタッフ追加APIエラー",
      data.message || "スタッフ追加に失敗しました。",
      "addStaff",
      {
       staffCode: staffCode,
       staffName: staffName,
       staffStatus: staffStatus,
       staffMemo: staffMemo,
       reason: reason,
       responseMessage: data.message || ""
    }
  );

  if (btnAddStaffSubmit) {
    btnAddStaffSubmit.disabled = false;
    btnAddStaffSubmit.textContent = "スタッフを追加する";
  }

  showStaffAddMessage(data.message || "スタッフ追加に失敗しました。", "error");
  return;
}

    showStaffAddMessage(data.message || "スタッフを追加しました。", "success");

    if (newStaffCode) newStaffCode.value = "";
    if (newStaffName) newStaffName.value = "";
    if (newStaffPin) newStaffPin.value = "";
    if (newStaffStatus) newStaffStatus.value = "有効";
    if (newStaffMemo) newStaffMemo.value = "";
    if (newStaffReason) newStaffReason.value = "新規スタッフ登録";

    if (btnAddStaffSubmit) {
      btnAddStaffSubmit.disabled = false;
      btnAddStaffSubmit.textContent = "スタッフを追加する";
    }

    if (newStaffCode) {
      newStaffCode.focus();
    }

  } catch (error) {
    console.error("スタッフ追加エラー:", error);

    await sendAdminErrorLog(
      "スタッフ追加エラー",
      error,
     "addStaff",
     {
      staffCode: staffCode,
      staffName: staffName,
      staffStatus: staffStatus,
      staffMemo: staffMemo,
      reason: reason
     }
  );

  if (btnAddStaffSubmit) {
    btnAddStaffSubmit.disabled = false;
    btnAddStaffSubmit.textContent = "スタッフを追加する";
  }

  showStaffAddMessage("スタッフ追加中にエラーが発生しました。", "error");
}
}

function showStaffAddMessage(message, type) {
  const el = document.getElementById("staffAddMessage");

  if (!el) return;

  el.textContent = message;

  el.classList.remove("error");
  el.classList.remove("success");
  el.classList.remove("warning");

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }

  if (type === "warning") {
    el.classList.add("warning");
  }
}

/* ==================================================
   スタッフ有効 / 無効切替 一覧表示
   Apps Script action: getStaffList
   ================================================== */

async function showStaffStatusList() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">スタッフ有効 / 無効切替</div>
    <div class="admin-sub-message">スタッフ一覧を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getStaffList",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

   if (!data.success) {
     await sendAdminErrorLog(
      "スタッフ一覧取得APIエラー",
      data.message || "スタッフ一覧の取得に失敗しました。",
      "getStaffList",
      {
        responseMessage: data.message || ""
      }
   );

   workArea.innerHTML = `
     <div class="work-title">スタッフ有効 / 無効切替</div>
     <div class="admin-sub-message error">${escapeHtml(data.message || "スタッフ一覧の取得に失敗しました。")}</div>
    `;
    return;
   }

    renderStaffStatusList(data.staffList || []);

 } catch (error) {
   console.error("スタッフ一覧取得エラー:", error);

   await sendAdminErrorLog(
      "スタッフ一覧取得エラー",
      error,
      "getStaffList",
      {}
   );

  workArea.innerHTML = `
    <div class="work-title">スタッフ有効 / 無効切替</div>
    <div class="admin-sub-message error">スタッフ一覧取得中にエラーが発生しました。</div>
  `;
}
}

function renderStaffStatusList(staffList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!staffList.length) {
    workArea.innerHTML = `
      <div class="work-title">スタッフ有効 / 無効切替</div>
      <div class="admin-sub-message warning">スタッフが登録されていません。</div>
    `;
    return;
  }

  const rowsHtml = staffList.map(function (staff) {
    const status = staff.staffStatus || "";
    const isActive = status === "有効";
    const nextStatus = isActive ? "無効" : "有効";
    const buttonText = isActive ? "無効にする" : "有効にする";

    return `
      <tr>
        <td>${escapeHtml(String(staff.displayOrder || ""))}</td>
        <td>${escapeHtml(staff.staffCode || "")}</td>
        <td>${escapeHtml(staff.staffName || "")}</td>
        <td>
          <span class="${isActive ? "status-active" : "status-inactive"}">
            ${escapeHtml(status || "未設定")}
          </span>
        </td>
        <td>${escapeHtml(staff.staffMemo || "")}</td>
        <td>${escapeHtml(staff.updatedAt || "")}</td>
        <td>${escapeHtml(staff.updateContent || "")}</td>
        <td>
          <button
            class="small-action-button ${isActive ? "danger-button" : "success-button"}"
            type="button"
            data-staff-code="${escapeHtml(staff.staffCode || "")}"
            data-staff-name="${escapeHtml(staff.staffName || "")}"
            data-current-status="${escapeHtml(status || "")}"
            data-next-status="${escapeHtml(nextStatus)}"
          >
            ${escapeHtml(buttonText)}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">スタッフ有効 / 無効切替</div>

    <div class="admin-sub-message">
      変更したいスタッフのボタンを押してください。保存処理は次の工程で接続します。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>表示順</th>
            <th>従業員コード</th>
            <th>スタッフ名</th>
            <th>状態</th>
            <th>備考</th>
            <th>更新日時</th>
            <th>更新内容</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  setupStaffStatusButtons();
}

function setupStaffStatusButtons() {
  const buttons = document.querySelectorAll(".small-action-button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const staffCode = button.dataset.staffCode || "";
      const staffName = button.dataset.staffName || "";
      const currentStatus = button.dataset.currentStatus || "";
      const nextStatus = button.dataset.nextStatus || "";

      const ok = window.confirm(
        staffCode + " / " + staffName + "\n\n" +
        "状態を「" + currentStatus + "」から「" + nextStatus + "」へ変更しますか？"
      );

      if (!ok) return;

      updateStaffStatus(staffCode, staffName, currentStatus, nextStatus);
    });
  });
}

/* ==================================================
   スタッフ有効 / 無効 保存
   Apps Script action: updateStaffStatus
   ================================================== */

async function updateStaffStatus(staffCode, staffName, currentStatus, nextStatus) {
  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  const reason = "スタッフ状態変更：" + currentStatus + "→" + nextStatus;

  showWorkMessage(
    staffCode + " / " + staffName + " を「" + nextStatus + "」へ変更中..."
  );

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateStaffStatus",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,
        staffCode: staffCode,
        nextStatus: nextStatus,
        reason: reason
      })
    });

    const data = await response.json();

   if (!data.success) {
     await sendAdminErrorLog(
       "スタッフ状態変更APIエラー",
       data.message || "スタッフ状態変更に失敗しました。",
       "updateStaffStatus",
       {
         staffCode: staffCode,
         staffName: staffName,
         currentStatus: currentStatus,
         nextStatus: nextStatus,
         responseMessage: data.message || ""
       }
   );

  showWorkMessage(data.message || "スタッフ状態変更に失敗しました。");
  return;
}

    showWorkMessage(data.message || "スタッフ状態を変更しました。");

    // 変更後の一覧を再取得して表示更新
    showStaffStatusList();

  } catch (error) {
    console.error("スタッフ状態変更エラー:", error);

    await sendAdminErrorLog(
      "スタッフ状態変更エラー",
      error,
      "updateStaffStatus",
      {
        staffCode: staffCode,
        staffName: staffName,
        currentStatus: currentStatus,
        nextStatus: nextStatus
      }
    );

    showWorkMessage("スタッフ状態変更中にエラーが発生しました。");
  }
}

/* ==================================================
   HTMLエスケープ
   ================================================== */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==================================================
   スタッフ変更履歴確認
   Apps Script action: getStaffChangeHistory
   ================================================== */

async function showStaffChangeHistory() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">スタッフ変更履歴確認</div>
    <div class="admin-sub-message">スタッフ変更履歴を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getStaffChangeHistory",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "スタッフ変更履歴取得APIエラー",
        data.message || "スタッフ変更履歴の取得に失敗しました。",
        "getStaffChangeHistory",
        {
          responseMessage: data.message || ""
        }
      );

      workArea.innerHTML = `
        <div class="work-title">スタッフ変更履歴確認</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "スタッフ変更履歴の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderStaffChangeHistory(data.historyList || []);

  } catch (error) {
    console.error("スタッフ変更履歴取得エラー:", error);

    await sendAdminErrorLog(
      "スタッフ変更履歴取得エラー",
      error,
      "getStaffChangeHistory",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">スタッフ変更履歴確認</div>
      <div class="admin-sub-message error">スタッフ変更履歴取得中にエラーが発生しました。</div>
    `;
  }
}

function renderStaffChangeHistory(historyList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!historyList.length) {
    workArea.innerHTML = `
      <div class="work-title">スタッフ変更履歴確認</div>
      <div class="admin-sub-message warning">スタッフ変更履歴はありません。</div>
    `;
    return;
  }

  const rowsHtml = historyList.map(function (item) {
    return `
      <tr>
        <td>${escapeHtml(item.dateTime || "")}</td>
        <td>${escapeHtml(item.operationType || "")}</td>
        <td>${escapeHtml(item.adminId || "")}</td>
        <td>${escapeHtml(item.adminName || "")}</td>
        <td>${escapeHtml(item.adminRole || "")}</td>
        <td>${escapeHtml(item.staffCode || "")}</td>
        <td>${escapeHtml(item.staffName || "")}</td>
        <td>${escapeHtml(item.beforeText || "")}</td>
        <td>${escapeHtml(item.afterText || "")}</td>
        <td>${escapeHtml(item.reason || "")}</td>
        <td>${escapeHtml(item.memo || "")}</td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">スタッフ変更履歴確認</div>

    <div class="admin-sub-message">
      新しい履歴を上に表示しています。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>日時</th>
            <th>操作種別</th>
            <th>管理者ID</th>
            <th>管理者名</th>
            <th>権限</th>
            <th>対象コード</th>
            <th>対象スタッフ</th>
            <th>変更前</th>
            <th>変更後</th>
            <th>理由</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/* ==================================================
   スタッフ打刻状況確認
   Apps Script action: getStaffPunchStatus
   ================================================== */

async function showStaffPunchStatus() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">スタッフ打刻状況確認</div>
    <div class="admin-sub-message">スタッフ打刻状況を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getStaffPunchStatus",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "スタッフ打刻状況取得APIエラー",
        data.message || "スタッフ打刻状況の取得に失敗しました。",
        "getStaffPunchStatus",
        {
           responseMessage: data.message || ""
        }
      );

      workArea.innerHTML = `
        <div class="work-title">スタッフ打刻状況確認</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "スタッフ打刻状況の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderStaffPunchStatus(data.statusList || []);

  } catch (error) {
    console.error("スタッフ打刻状況取得エラー:", error);

    await sendAdminErrorLog(
      "スタッフ打刻状況取得エラー",
      error,
      "getStaffPunchStatus",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">スタッフ打刻状況確認</div>
      <div class="admin-sub-message error">スタッフ打刻状況取得中にエラーが発生しました。</div>
    `;
  }
}

function renderStaffPunchStatus(statusList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!statusList.length) {
    workArea.innerHTML = `
      <div class="work-title">スタッフ打刻状況確認</div>
      <div class="admin-sub-message warning">スタッフが登録されていません。</div>
    `;
    return;
  }

  const rowsHtml = statusList.map(function (item) {
    const staffActive = item.staffStatus === "有効";
    const currentStatus = item.currentStatus || "未確認";

    let currentStatusClass = "status-inactive";

    if (currentStatus === "出勤中") {
      currentStatusClass = "status-active";
    }

    if (currentStatus === "外出中") {
      currentStatusClass = "status-warning";
    }

    if (currentStatus === "退勤済み") {
      currentStatusClass = "status-ended";
    }

    if (currentStatus === "出勤前") {
      currentStatusClass = "status-before";
    }

    if (
      item.forgotClockOut === true ||
      currentStatus.indexOf("退勤忘れ") !== -1 ||
      String(item.forgotClockOutText || "").indexOf("退勤忘れ") !== -1
    ) {
      currentStatusClass = "status-forgot-clockout";
    }

    return `
      <tr>
        <td>${escapeHtml(String(item.displayOrder || ""))}</td>
        <td>${escapeHtml(item.staffCode || "")}</td>
        <td>${escapeHtml(item.staffName || "")}</td>
        <td>
          <span class="${staffActive ? "status-active" : "status-inactive"}">
            ${escapeHtml(item.staffStatus || "未設定")}
          </span>
        </td>
        <td>
          <span class="${currentStatusClass}">
            ${escapeHtml(currentStatus)}
          </span>
        </td>
        <td>${escapeHtml(item.latestRecordedAt || "")}</td>
        <td>${escapeHtml(item.latestPunchType || "")}</td>
        <td>${escapeHtml(item.latestBusinessDate || "")}</td>
        <td>${escapeHtml(item.latestDisplayTime || "")}</td>
        <td>${escapeHtml(item.staffMemo || "")}</td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">スタッフ打刻状況確認</div>

    <div class="admin-sub-message">
      スタッフごとの現在状態と最新打刻を表示しています。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>表示順</th>
            <th>従業員コード</th>
            <th>スタッフ名</th>
            <th>スタッフ状態</th>
            <th>現在状態</th>
            <th>最新打刻日時</th>
            <th>最新打刻種別</th>
            <th>営業日</th>
            <th>表示時刻</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/* ==================================================
   打刻Data検索フォーム
   Apps Script action: searchPunchData
   ================================================== */

function showPunchSearchForm() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  workArea.innerHTML = `
    <div class="work-title">打刻Data検索・修正</div>

    <div class="admin-form">

      <div class="admin-form-row">
        <label for="searchBusinessDate">営業日</label>
        <input id="searchBusinessDate" class="admin-form-input" type="date">
      </div>

      <div class="admin-form-row">
        <label for="searchStaffCode">従業員コード</label>
        <input id="searchStaffCode" class="admin-form-input" type="text" inputmode="numeric" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="searchStaffName">スタッフ名</label>
        <input id="searchStaffName" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="searchPunchType">打刻種別</label>
        <select id="searchPunchType" class="admin-form-input">
          <option value="">すべて</option>
          <option value="出勤">出勤</option>
          <option value="退勤">退勤</option>
          <option value="外出">外出</option>
          <option value="戻り">戻り</option>
        </select>
      </div>

      <button id="btnSearchPunchData" class="admin-action-button" type="button">
        検索する
      </button>

      <div id="punchSearchMessage" class="admin-sub-message">
        営業日・従業員コード・スタッフ名・打刻種別で検索できます。営業日だけでも検索できます。
      </div>

      <div id="punchSearchResultArea"></div>

    </div>
  `;

  const btnSearchPunchData = document.getElementById("btnSearchPunchData");

  if (btnSearchPunchData) {
    btnSearchPunchData.addEventListener("click", function () {
      searchPunchData();
    });
  }

  const searchBusinessDate = document.getElementById("searchBusinessDate");

  if (searchBusinessDate) {
    searchBusinessDate.focus();
  }
}


/* ==================================================
   打刻Data検索実行
   ================================================== */

async function searchPunchData() {
  const workArea = document.getElementById("adminWorkArea");
  const messageEl = document.getElementById("punchSearchMessage");
  const resultArea = document.getElementById("punchSearchResultArea");

  const searchBusinessDate = document.getElementById("searchBusinessDate");
  const searchStaffCode = document.getElementById("searchStaffCode");
  const searchStaffName = document.getElementById("searchStaffName");
  const searchPunchType = document.getElementById("searchPunchType");

  if (!workArea || !resultArea) return;

  if (!currentAdminId || !currentAdminPw) {
    if (messageEl) {
      messageEl.textContent = "管理者ログイン情報がありません。再ログインしてください。";
      messageEl.classList.add("error");
    }
    return;
  }

  const businessDateInput = searchBusinessDate ? searchBusinessDate.value.trim() : "";
  const businessDate = businessDateInput ? businessDateInput.replaceAll("-", "/") : "";

  const staffCode = searchStaffCode ? searchStaffCode.value.trim() : "";
  const staffName = searchStaffName ? searchStaffName.value.trim() : "";
  const punchType = searchPunchType ? searchPunchType.value.trim() : "";

  if (messageEl) {
    messageEl.textContent = "打刻Dataを検索中...";
    messageEl.classList.remove("error", "success", "warning");
  }

  resultArea.innerHTML = "";

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "searchPunchData",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,
        businessDate: businessDate,
        staffCode: staffCode,
        staffName: staffName,
        punchType: punchType
      })
    });

    const data = await response.json();

  if (!data.success) {
    await sendAdminErrorLog(
      "打刻Data検索APIエラー",
      data.message || "打刻Data検索に失敗しました。",
      "searchPunchData",
      {
        businessDate: businessDate,
        staffCode: staffCode,
        staffName: staffName,
        punchType: punchType,
        responseMessage: data.message || ""
      }
    );

  if (messageEl) {
    messageEl.textContent = data.message || "打刻Data検索に失敗しました。";
    messageEl.classList.add("error");
  }
  return;
}

    if (messageEl) {
      messageEl.textContent = "検索結果：" + (data.punchList || []).length + "件";
      messageEl.classList.add("success");
    }

    renderPunchSearchResult(data.punchList || []);

  } catch (error) {
    console.error("打刻Data検索エラー:", error);

    await sendAdminErrorLog(
      "打刻Data検索エラー",
      error,
      "searchPunchData",
      {
        businessDate: businessDate,
        staffCode: staffCode,
        staffName: staffName,
        punchType: punchType
      }
    );

    if (messageEl) {
      messageEl.textContent = "打刻Data検索中にエラーが発生しました。";
      messageEl.classList.add("error");
    }
  }
}


/* ==================================================
   打刻Data検索結果表示
   ================================================== */

function renderPunchSearchResult(punchList) {
  const resultArea = document.getElementById("punchSearchResultArea");

  if (!resultArea) return;

  if (!punchList.length) {
    resultArea.innerHTML = `
      <div class="admin-sub-message warning" style="margin-top: 14px;">
        該当する打刻Dataはありません。
      </div>
    `;
    return;
  }

  const rowsHtml = punchList.map(function (item) {
    return `
      <tr>
        <td>${escapeHtml(item.punchId || "")}</td>
        <td>${escapeHtml(item.recordedAt || "")}</td>
        <td>${escapeHtml(item.businessDate || "")}</td>
        <td>${escapeHtml(item.displayTime || "")}</td>
        <td>${escapeHtml(item.staffCode || "")}</td>
        <td>${escapeHtml(item.staffName || "")}</td>
        <td>${escapeHtml(item.punchType || "")}</td>
        <td>${escapeHtml(item.memo || "")}</td>
        <td>${escapeHtml(item.editStatus || "")}</td>
        <td>
          ${
            item.photoUrl
              ? `<a href="${escapeHtml(item.photoUrl)}" target="_blank">写真</a>`
              : ""
          }
        </td>
        <td>
          <button
            class="small-action-button success-button"
            type="button"
            data-row-number="${escapeHtml(String(item.rowNumber || ""))}"
            data-punch-id="${escapeHtml(item.punchId || "")}"
            data-recorded-at="${escapeHtml(item.recordedAt || "")}"
            data-business-date="${escapeHtml(item.businessDate || "")}"
            data-display-time="${escapeHtml(item.displayTime || "")}"
            data-staff-code="${escapeHtml(item.staffCode || "")}"
            data-staff-name="${escapeHtml(item.staffName || "")}"
            data-punch-type="${escapeHtml(item.punchType || "")}"
            data-memo="${escapeHtml(item.memo || "")}"
          >
            修正する
          </button>
        </td>
      </tr>
    `;
  }).join("");

  resultArea.innerHTML = `
    <div class="admin-table-wrap" style="margin-top: 14px;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>打刻ID</th>
            <th>打刻日時</th>
            <th>営業日</th>
            <th>表示時刻</th>
            <th>従業員コード</th>
            <th>スタッフ名</th>
            <th>打刻種別</th>
            <th>備考</th>
            <th>修正状態</th>
            <th>写真</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  setupPunchEditButtons();
}


/* ==================================================
   修正ボタン
   検索結果の「修正する」から修正フォームを表示
   ================================================== */

function setupPunchEditButtons() {
  const buttons = document.querySelectorAll("[data-punch-id]");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const punchData = {
        rowNumber: button.dataset.rowNumber || "",
        punchId: button.dataset.punchId || "",
        recordedAt: button.dataset.recordedAt || "",
        businessDate: button.dataset.businessDate || "",
        displayTime: button.dataset.displayTime || "",
        staffCode: button.dataset.staffCode || "",
        staffName: button.dataset.staffName || "",
        punchType: button.dataset.punchType || "",
        memo: button.dataset.memo || ""
      };

      showPunchEditForm(punchData);
    });
  });
}

/* ==================================================
   打刻Data修正フォーム表示
   ================================================== */

function showPunchEditForm(punchData) {
  const resultArea = document.getElementById("punchSearchResultArea");

  if (!resultArea) return;

  const recordedAtForInput = convertDateTimeTextToInputValue(punchData.recordedAt);

  resultArea.innerHTML = `
    <div class="work-title" style="margin-top: 18px;">打刻Data修正</div>

    <div class="admin-form">

      <div class="admin-sub-message">
        修正対象：${escapeHtml(punchData.staffCode)} / ${escapeHtml(punchData.staffName)} / ${escapeHtml(punchData.punchId)}
      </div>

      <div class="admin-form-row">
        <label>現在の打刻日時</label>
        <div class="admin-readonly-box">${escapeHtml(punchData.recordedAt)}</div>
      </div>

      <div class="admin-form-row">
        <label for="editRecordedAt">修正後打刻日時</label>
        <input
          id="editRecordedAt"
          class="admin-form-input"
          type="datetime-local"
          value="${escapeHtml(recordedAtForInput)}"
        >
      </div>

      <div class="admin-form-row">
        <label>現在の打刻種別</label>
        <div class="admin-readonly-box">${escapeHtml(punchData.punchType)}</div>
      </div>

      <div class="admin-form-row">
        <label for="editPunchType">修正後打刻種別</label>
        <select id="editPunchType" class="admin-form-input">
          <option value="出勤" ${punchData.punchType === "出勤" ? "selected" : ""}>出勤</option>
          <option value="退勤" ${punchData.punchType === "退勤" ? "selected" : ""}>退勤</option>
          <option value="外出" ${punchData.punchType === "外出" ? "selected" : ""}>外出</option>
          <option value="戻り" ${punchData.punchType === "戻り" ? "selected" : ""}>戻り</option>
        </select>
      </div>

      <div class="admin-form-row">
        <label for="editReason">修正理由</label>
        <input
          id="editReason"
          class="admin-form-input"
          type="text"
          autocomplete="off"
          value="打刻修正"
        >
      </div>

      <div class="admin-form-row">
        <label for="editMemo">修正メモ</label>
        <input
          id="editMemo"
          class="admin-form-input"
          type="text"
          autocomplete="off"
          value=""
        >
      </div>

      <button
        id="btnSavePunchEdit"
        class="admin-action-button"
        type="button"
      >
        修正を保存する
      </button>

      <button
        id="btnBackToSearchResult"
        class="admin-action-button secondary-action-button"
        type="button"
      >
        検索結果に戻る
      </button>

      <div id="punchEditMessage" class="admin-sub-message">
        修正内容を確認して保存してください。保存処理は次の工程で接続します。
      </div>

    </div>
  `;

  const btnSavePunchEdit = document.getElementById("btnSavePunchEdit");
  const btnBackToSearchResult = document.getElementById("btnBackToSearchResult");

  if (btnSavePunchEdit) {
    btnSavePunchEdit.addEventListener("click", function () {
      savePunchEdit(punchData);
    });
   }
 
  if (btnBackToSearchResult) {
    btnBackToSearchResult.addEventListener("click", function () {
      searchPunchData();
    });
  }
}

/* ==================================================
   打刻Data修正保存
   Apps Script action: updatePunchData
   ================================================== */

async function savePunchEdit(punchData) {
  const editRecordedAt = document.getElementById("editRecordedAt");
  const editPunchType = document.getElementById("editPunchType");
  const editReason = document.getElementById("editReason");
  const editMemo = document.getElementById("editMemo");
  const btnSavePunchEdit = document.getElementById("btnSavePunchEdit");

  const newRecordedAt = editRecordedAt ? editRecordedAt.value.trim() : "";
  const newPunchType = editPunchType ? editPunchType.value.trim() : "";
  const reason = editReason ? editReason.value.trim() : "";
  const memo = editMemo ? editMemo.value.trim() : "";

  if (!currentAdminId || !currentAdminPw) {
    showPunchEditMessage("管理者ログイン情報がありません。再ログインしてください。", "error");
    return;
  }

  if (!punchData || !punchData.rowNumber || !punchData.punchId) {
    showPunchEditMessage("修正対象データが確認できません。検索からやり直してください。", "error");
    return;
  }

  if (!newRecordedAt) {
    showPunchEditMessage("修正後打刻日時を入力してください。", "warning");
    if (editRecordedAt) editRecordedAt.focus();
    return;
  }

  if (!newPunchType) {
    showPunchEditMessage("修正後打刻種別を選択してください。", "warning");
    if (editPunchType) editPunchType.focus();
    return;
  }

  if (!reason) {
    showPunchEditMessage("修正理由を入力してください。", "warning");
    if (editReason) editReason.focus();
    return;
  }

  const ok = window.confirm(
    "打刻Dataを修正します。\n\n" +
    "打刻ID：" + punchData.punchId + "\n" +
    "スタッフ：" + punchData.staffCode + " / " + punchData.staffName + "\n" +
    "打刻日時：" + punchData.recordedAt + " → " + newRecordedAt + "\n" +
    "打刻種別：" + punchData.punchType + " → " + newPunchType + "\n\n" +
    "保存してよろしいですか？"
  );

  if (!ok) return;

  if (btnSavePunchEdit) {
    btnSavePunchEdit.disabled = true;
    btnSavePunchEdit.textContent = "保存中...";
  }

  showPunchEditMessage("打刻Dataを修正中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updatePunchData",

        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,

        rowNumber: punchData.rowNumber,
        punchId: punchData.punchId,

        newRecordedAt: newRecordedAt,
        newPunchType: newPunchType,
        reason: reason,
        editMemo: memo
      })
    });

    const data = await response.json();

  if (!data.success) {
    await sendAdminErrorLog(
    "打刻Data修正APIエラー",
    data.message || "打刻Data修正に失敗しました。",
    "updatePunchData",
    {
      punchId: punchData ? punchData.punchId : "",
      rowNumber: punchData ? punchData.rowNumber : "",
      staffCode: punchData ? punchData.staffCode : "",
      staffName: punchData ? punchData.staffName : "",
      beforeRecordedAt: punchData ? punchData.recordedAt : "",
      beforePunchType: punchData ? punchData.punchType : "",
      responseMessage: data.message || ""
    }
  );

  if (btnSavePunchEdit) {
    btnSavePunchEdit.disabled = false;
    btnSavePunchEdit.textContent = "修正を保存する";
  }

  showPunchEditMessage(data.message || "打刻Data修正に失敗しました。", "error");
  return;
}

    showPunchEditMessage(data.message || "打刻Dataを修正しました。", "success");

    if (btnSavePunchEdit) {
      btnSavePunchEdit.disabled = false;
      btnSavePunchEdit.textContent = "修正を保存する";
    }

    // 保存後、検索結果を再取得して表示を更新
    setTimeout(function () {
      searchPunchData();
    }, 800);

    } catch (error) {
    console.error("打刻Data修正エラー:", error);

    await sendAdminErrorLog(
      "打刻Data修正エラー",
      error,
      "updatePunchData",
      {
        punchId: punchData ? punchData.punchId : "",
        rowNumber: punchData ? punchData.rowNumber : "",
        staffCode: punchData ? punchData.staffCode : "",
        staffName: punchData ? punchData.staffName : "",
        beforeRecordedAt: punchData ? punchData.recordedAt : "",
        beforePunchType: punchData ? punchData.punchType : ""
      }
    );

    if (btnSavePunchEdit) {
      btnSavePunchEdit.disabled = false;
      btnSavePunchEdit.textContent = "修正を保存する";
    }

    showPunchEditMessage("打刻Data修正中にエラーが発生しました。", "error");
    }
  }

function showPunchEditMessage(message, type) {
  const el = document.getElementById("punchEditMessage");

  if (!el) return;

  el.textContent = message;

  el.classList.remove("error");
  el.classList.remove("success");
  el.classList.remove("warning");

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }

  if (type === "warning") {
    el.classList.add("warning");
  }
}

function convertDateTimeTextToInputValue(text) {
  if (!text) return "";

  const normalized = String(text).trim().replace(/\//g, "-");

  // yyyy-MM-dd HH:mm:ss → yyyy-MM-ddTHH:mm
  if (normalized.length >= 16) {
    return normalized.substring(0, 16).replace(" ", "T");
  }

  return "";
}

/* ==================================================
   管理者画面 エラーログ送信
   Apps Script action: logError
   ================================================== */

async function sendAdminErrorLog(errorType, error, operation, detail) {
  try {
    const errorMessage =
      error && error.message
        ? error.message
        : String(error || "");

    let detailText = "";

    if (typeof detail === "string") {
      detailText = detail;
    } else {
      detailText = JSON.stringify(detail || {});
    }

    await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "logError",

        terminalName: "管理者画面",

        staffCode: currentAdminId || "",
        staffName: currentAdminName || "",
        status: currentAdminRole || "",

        errorType: errorType || "管理者画面エラー",
        errorMessage: errorMessage,

        operation: operation || "",
        detail: detailText,

        userAgent: navigator.userAgent || ""
      })
    });

  } catch (logError) {
    // エラーログ送信自体の失敗で画面処理を止めない
    console.error("管理者画面エラーログ送信失敗:", logError);
  }
}

/* ==================================================
   修正履歴確認
   Apps Script action: getPunchEditHistory
   ================================================== */

async function showPunchEditHistory() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">修正履歴確認</div>
    <div class="admin-sub-message">修正履歴を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getPunchEditHistory",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      workArea.innerHTML = `
        <div class="work-title">修正履歴確認</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "修正履歴の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderPunchEditHistory(data.historyList || []);

  } catch (error) {
    console.error("修正履歴取得エラー:", error);

    await sendAdminErrorLog(
      "修正履歴取得エラー",
      error,
      "getPunchEditHistory",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">修正履歴確認</div>
      <div class="admin-sub-message error">修正履歴取得中にエラーが発生しました。</div>
    `;
  }
}

function renderPunchEditHistory(historyList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!historyList.length) {
    workArea.innerHTML = `
      <div class="work-title">修正履歴確認</div>
      <div class="admin-sub-message warning">修正履歴はありません。</div>
    `;
    return;
  }

  const rowsHtml = historyList.map(function (item) {
    return `
      <tr>
        <td>${escapeHtml(item.editHistoryId || "")}</td>
        <td>${escapeHtml(item.editedAt || "")}</td>
        <td>${escapeHtml(item.adminId || "")}</td>
        <td>${escapeHtml(item.adminName || "")}</td>
        <td>${escapeHtml(item.punchId || "")}</td>
        <td>${escapeHtml(item.staffCode || "")}</td>
        <td>${escapeHtml(item.staffName || "")}</td>
        <td>${escapeHtml(item.beforeRecordedAt || "")}</td>
        <td>${escapeHtml(item.afterRecordedAt || "")}</td>
        <td>${escapeHtml(item.beforeDisplayTime || "")}</td>
        <td>${escapeHtml(item.afterDisplayTime || "")}</td>
        <td>${escapeHtml(item.beforePunchType || "")}</td>
        <td>${escapeHtml(item.afterPunchType || "")}</td>
        <td>${escapeHtml(item.reason || "")}</td>
        <td>${escapeHtml(item.memo || "")}</td>
        <td>${escapeHtml(item.changeSummary || "")}</td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">修正履歴確認</div>

    <div class="admin-sub-message">
      新しい修正履歴を上に表示しています。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>修正履歴ID</th>
            <th>修正日時</th>
            <th>管理者ID</th>
            <th>管理者名</th>
            <th>打刻ID</th>
            <th>従業員コード</th>
            <th>スタッフ名</th>
            <th>修正前日時</th>
            <th>修正後日時</th>
            <th>修正前時刻</th>
            <th>修正後時刻</th>
            <th>修正前種別</th>
            <th>修正後種別</th>
            <th>修正理由</th>
            <th>修正メモ</th>
            <th>修正内容まとめ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/* ==================================================
   エラーログ確認
   Apps Script action: getErrorLog
   Main管理者専用
   ================================================== */

async function showErrorLogList() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">エラーログ確認</div>
    <div class="admin-sub-message">エラーログを取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "getErrorLog",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      workArea.innerHTML = `
        <div class="work-title">エラーログ確認</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "エラーログの取得に失敗しました。")}</div>
      `;
      return;
    }

    renderErrorLogList(data.errorList || []);

  } catch (error) {
    console.error("エラーログ取得エラー:", error);

    workArea.innerHTML = `
      <div class="work-title">エラーログ確認</div>
      <div class="admin-sub-message error">エラーログ取得中にエラーが発生しました。</div>
    `;
  }
}

function renderErrorLogList(errorList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!errorList.length) {
    workArea.innerHTML = `
      <div class="work-title">エラーログ確認</div>
      <div class="admin-sub-message warning">エラーログはありません。</div>
    `;
    return;
  }

  const rowsHtml = errorList.map(function (item) {
    return `
      <tr>
        <td>${escapeHtml(item.dateTime || "")}</td>
        <td>${escapeHtml(item.terminalName || "")}</td>
        <td>${escapeHtml(item.staffCode || "")}</td>
        <td>${escapeHtml(item.staffName || "")}</td>
        <td>${escapeHtml(item.status || "")}</td>
        <td>${escapeHtml(item.errorType || "")}</td>
        <td>${escapeHtml(item.errorMessage || "")}</td>
        <td>${escapeHtml(item.operation || "")}</td>
        <td>${escapeHtml(item.detail || "")}</td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">エラーログ確認</div>

    <div class="admin-sub-message">
      新しいエラーログを上に表示しています。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>日時</th>
            <th>端末名</th>
            <th>ID</th>
            <th>名前</th>
            <th>状態</th>
            <th>エラー種別</th>
            <th>エラー内容</th>
            <th>操作内容</th>
            <th>詳細</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

/* ==================================================
   管理者追加フォーム
   Apps Script action: addAdmin
   Main管理者専用
   ================================================== */

function showAdminAddForm() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">管理者追加</div>

    <div class="admin-form">

      <div class="admin-form-row">
        <label for="newAdminId">管理者ID</label>
        <input id="newAdminId" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newAdminName">管理者名</label>
        <input id="newAdminName" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newAdminPw">暗証番号</label>
        <input id="newAdminPw" class="admin-form-input" type="password" inputmode="numeric" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newAdminRole">権限</label>
        <select id="newAdminRole" class="admin-form-input">
          <option value="admin">admin</option>
          <option value="main">main</option>
        </select>
      </div>

      <div class="admin-form-row">
        <label for="newAdminStatus">状態</label>
        <select id="newAdminStatus" class="admin-form-input">
          <option value="有効">有効</option>
          <option value="無効">無効</option>
        </select>
      </div>

      <div class="admin-form-row">
        <label for="newAdminMemo">備考</label>
        <input id="newAdminMemo" class="admin-form-input" type="text" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label for="newAdminReason">追加理由</label>
        <input id="newAdminReason" class="admin-form-input" type="text" autocomplete="off" value="新規管理者登録">
      </div>

      <button id="btnAddAdminSubmit" class="admin-action-button" type="button">
        管理者を追加する
      </button>

      <div id="adminAddMessage" class="admin-sub-message">
        必要情報を入力してください。
      </div>

    </div>
  `;

  const btnAddAdminSubmit = document.getElementById("btnAddAdminSubmit");

  if (btnAddAdminSubmit) {
    btnAddAdminSubmit.addEventListener("click", function () {
      addAdmin();
    });
  }

  const newAdminId = document.getElementById("newAdminId");

  if (newAdminId) {
    newAdminId.focus();
  }
}


/* ==================================================
   管理者追加保存
   Apps Script action: addAdmin
   ================================================== */

async function addAdmin() {
  const newAdminId = document.getElementById("newAdminId");
  const newAdminName = document.getElementById("newAdminName");
  const newAdminPw = document.getElementById("newAdminPw");
  const newAdminRole = document.getElementById("newAdminRole");
  const newAdminStatus = document.getElementById("newAdminStatus");
  const newAdminMemo = document.getElementById("newAdminMemo");
  const newAdminReason = document.getElementById("newAdminReason");
  const btnAddAdminSubmit = document.getElementById("btnAddAdminSubmit");

  const adminId = newAdminId ? newAdminId.value.trim() : "";
  const adminName = newAdminName ? newAdminName.value.trim() : "";
  const adminPw = newAdminPw ? newAdminPw.value.trim() : "";
  const adminRole = newAdminRole ? newAdminRole.value.trim() : "";
  const adminStatus = newAdminStatus ? newAdminStatus.value.trim() : "";
  const adminMemo = newAdminMemo ? newAdminMemo.value.trim() : "";
  const reason = newAdminReason ? newAdminReason.value.trim() : "";

  if (!currentAdminId || !currentAdminPw) {
    showAdminAddMessage("管理者ログイン情報がありません。再ログインしてください。", "error");
    return;
  }

  if (currentAdminRole !== "main") {
    showAdminAddMessage("この機能はMain管理者のみ使用できます。", "error");
    return;
  }

  if (!adminId) {
    showAdminAddMessage("管理者IDを入力してください。", "warning");
    if (newAdminId) newAdminId.focus();
    return;
  }

  if (!adminName) {
    showAdminAddMessage("管理者名を入力してください。", "warning");
    if (newAdminName) newAdminName.focus();
    return;
  }

  if (!adminPw) {
    showAdminAddMessage("暗証番号を入力してください。", "warning");
    if (newAdminPw) newAdminPw.focus();
    return;
  }

  if (adminRole !== "main" && adminRole !== "admin") {
    showAdminAddMessage("権限は main または admin を選択してください。", "warning");
    return;
  }

  if (adminStatus !== "有効" && adminStatus !== "無効") {
    showAdminAddMessage("状態は「有効」または「無効」を選択してください。", "warning");
    return;
  }

  if (btnAddAdminSubmit) {
    btnAddAdminSubmit.disabled = true;
    btnAddAdminSubmit.textContent = "追加中...";
  }

  showAdminAddMessage("管理者追加中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addAdmin",

        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,

        newAdminId: adminId,
        newAdminName: adminName,
        newAdminPw: adminPw,
        newAdminRole: adminRole,
        newAdminStatus: adminStatus,
        newAdminMemo: adminMemo,
        reason: reason
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "管理者追加APIエラー",
        data.message || "管理者追加に失敗しました。",
        "addAdmin",
        {
          newAdminId: adminId,
          newAdminName: adminName,
          newAdminRole: adminRole,
          newAdminStatus: adminStatus,
          newAdminMemo: adminMemo,
          reason: reason,
          responseMessage: data.message || ""
        }
      );

      if (btnAddAdminSubmit) {
        btnAddAdminSubmit.disabled = false;
        btnAddAdminSubmit.textContent = "管理者を追加する";
      }

      showAdminAddMessage(data.message || "管理者追加に失敗しました。", "error");
      return;
    }

    showAdminAddMessage(data.message || "管理者を追加しました。", "success");

    if (newAdminId) newAdminId.value = "";
    if (newAdminName) newAdminName.value = "";
    if (newAdminPw) newAdminPw.value = "";
    if (newAdminRole) newAdminRole.value = "admin";
    if (newAdminStatus) newAdminStatus.value = "有効";
    if (newAdminMemo) newAdminMemo.value = "";
    if (newAdminReason) newAdminReason.value = "新規管理者登録";

    if (btnAddAdminSubmit) {
      btnAddAdminSubmit.disabled = false;
      btnAddAdminSubmit.textContent = "管理者を追加する";
    }

    if (newAdminId) {
      newAdminId.focus();
    }

  } catch (error) {
    console.error("管理者追加エラー:", error);

    await sendAdminErrorLog(
      "管理者追加エラー",
      error,
      "addAdmin",
      {
        newAdminId: adminId,
        newAdminName: adminName,
        newAdminRole: adminRole,
        newAdminStatus: adminStatus,
        newAdminMemo: adminMemo,
        reason: reason
      }
    );

    if (btnAddAdminSubmit) {
      btnAddAdminSubmit.disabled = false;
      btnAddAdminSubmit.textContent = "管理者を追加する";
    }

    showAdminAddMessage("管理者追加中にエラーが発生しました。", "error");
  }
}

function showAdminAddMessage(message, type) {
  const el = document.getElementById("adminAddMessage");

  if (!el) return;

  el.textContent = message;

  el.classList.remove("error");
  el.classList.remove("success");
  el.classList.remove("warning");

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }

  if (type === "warning") {
    el.classList.add("warning");
  }
}

/* ==================================================
   管理者 有効 / 無効切替 一覧表示
   Apps Script action: getAdminList
   Main管理者専用
   ================================================== */

async function showAdminStatusList() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">管理者有効 / 無効切替</div>
    <div class="admin-sub-message">管理者一覧を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getAdminList",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "管理者一覧取得APIエラー",
        data.message || "管理者一覧の取得に失敗しました。",
        "getAdminList",
        {
          responseMessage: data.message || ""
        }
      );

      workArea.innerHTML = `
        <div class="work-title">管理者有効 / 無効切替</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "管理者一覧の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderAdminStatusList(data.adminList || []);

  } catch (error) {
    console.error("管理者一覧取得エラー:", error);

    await sendAdminErrorLog(
      "管理者一覧取得エラー",
      error,
      "getAdminList",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">管理者有効 / 無効切替</div>
      <div class="admin-sub-message error">管理者一覧取得中にエラーが発生しました。</div>
    `;
  }
}


function renderAdminStatusList(adminList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!adminList.length) {
    workArea.innerHTML = `
      <div class="work-title">管理者有効 / 無効切替</div>
      <div class="admin-sub-message warning">管理者が登録されていません。</div>
    `;
    return;
  }

  const rowsHtml = adminList.map(function (admin) {
    const status = admin.adminStatus || "";
    const isActive = status === "有効";
    const nextStatus = isActive ? "無効" : "有効";
    const buttonText = isActive ? "無効にする" : "有効にする";

    const isSelf = admin.adminId === currentAdminId;
    const isProtectedTopAdmin = admin.protectionType === "最高管理者";
    const disableSelfButton = isSelf && nextStatus === "無効";
    const disableProtectedButton = isProtectedTopAdmin && nextStatus === "無効";
    const disableStatusButton = disableSelfButton || disableProtectedButton;

    return `
      <tr>
        <td>${escapeHtml(String(admin.displayOrder || ""))}</td>
        <td>${escapeHtml(admin.adminId || "")}</td>
        <td>${escapeHtml(admin.adminName || "")}</td>
        <td>
          <span class="${admin.adminRole === "main" ? "status-warning" : "status-active"}">
            ${escapeHtml(admin.adminRole || "")}
          </span>
        </td>
        <td>
          <span class="${isActive ? "status-active" : "status-inactive"}">
            ${escapeHtml(status || "未設定")}
          </span>
        </td>
        <td>${escapeHtml(admin.adminMemo || "")}</td>
        <td>${escapeHtml(admin.updatedAt || "")}</td>
        <td>${escapeHtml(admin.updateContent || "")}</td>
        <td>
          <button
            class="small-action-button ${isActive ? "danger-button" : "success-button"}"
            type="button"
            data-admin-id="${escapeHtml(admin.adminId || "")}"
            data-admin-name="${escapeHtml(admin.adminName || "")}"
            data-current-status="${escapeHtml(status || "")}"
            data-next-status="${escapeHtml(nextStatus)}"
            ${disableStatusButton ? "disabled" : ""}
          >
            ${
              disableProtectedButton
                ? "最高管理者は無効不可"
                : disableSelfButton
                 ? "自分は無効不可"
                 : escapeHtml(buttonText)
            } 
          </button>
        </td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">管理者有効 / 無効切替</div>

    <div class="admin-sub-message">
      変更したい管理者のボタンを押してください。ログイン中のMain管理者自身は無効にできません。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>表示順</th>
            <th>管理者ID</th>
            <th>管理者名</th>
            <th>権限</th>
            <th>状態</th>
            <th>備考</th>
            <th>更新日時</th>
            <th>更新内容</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  setupAdminStatusButtons();
}


function setupAdminStatusButtons() {
  const buttons = document.querySelectorAll("[data-admin-id]");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.disabled) return;

      const targetAdminId = button.dataset.adminId || "";
      const targetAdminName = button.dataset.adminName || "";
      const currentStatus = button.dataset.currentStatus || "";
      const nextStatus = button.dataset.nextStatus || "";

      const ok = window.confirm(
        targetAdminId + " / " + targetAdminName + "\n\n" +
        "状態を「" + currentStatus + "」から「" + nextStatus + "」へ変更しますか？"
      );

      if (!ok) return;

      updateAdminStatus(targetAdminId, targetAdminName, currentStatus, nextStatus);
    });
  });
}


/* ==================================================
   管理者 有効 / 無効 保存
   Apps Script action: updateAdminStatus
   Main管理者専用
   ================================================== */

async function updateAdminStatus(targetAdminId, targetAdminName, currentStatus, nextStatus) {
  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  const reason = "管理者状態変更：" + currentStatus + "→" + nextStatus;

  showWorkMessage(
    targetAdminId + " / " + targetAdminName + " を「" + nextStatus + "」へ変更中..."
  );

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateAdminStatus",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,
        targetAdminId: targetAdminId,
        nextStatus: nextStatus,
        reason: reason
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "管理者状態変更APIエラー",
        data.message || "管理者状態変更に失敗しました。",
        "updateAdminStatus",
        {
          targetAdminId: targetAdminId,
          targetAdminName: targetAdminName,
          currentStatus: currentStatus,
          nextStatus: nextStatus,
          responseMessage: data.message || ""
        }
      );

      showWorkMessage(data.message || "管理者状態変更に失敗しました。");
      return;
    }

    showWorkMessage(data.message || "管理者状態を変更しました。");

    // 変更後の一覧を再取得して表示更新
    showAdminStatusList();

  } catch (error) {
    console.error("管理者状態変更エラー:", error);

    await sendAdminErrorLog(
      "管理者状態変更エラー",
      error,
      "updateAdminStatus",
      {
        targetAdminId: targetAdminId,
        targetAdminName: targetAdminName,
        currentStatus: currentStatus,
        nextStatus: nextStatus
      }
    );

    showWorkMessage("管理者状態変更中にエラーが発生しました。");
  }
}

/* ==================================================
   管理者 権限変更 一覧表示
   Apps Script action: getAdminList
   Main管理者専用
   ================================================== */

async function showAdminRoleList() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">管理者権限変更</div>
    <div class="admin-sub-message">管理者一覧を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getAdminList",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "管理者権限変更一覧取得APIエラー",
        data.message || "管理者一覧の取得に失敗しました。",
        "getAdminList",
        {
          responseMessage: data.message || ""
        }
      );

      workArea.innerHTML = `
        <div class="work-title">管理者権限変更</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "管理者一覧の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderAdminRoleList(data.adminList || []);

  } catch (error) {
    console.error("管理者権限変更一覧取得エラー:", error);

    await sendAdminErrorLog(
      "管理者権限変更一覧取得エラー",
      error,
      "getAdminList",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">管理者権限変更</div>
      <div class="admin-sub-message error">管理者一覧取得中にエラーが発生しました。</div>
    `;
  }
}


function renderAdminRoleList(adminList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!adminList.length) {
    workArea.innerHTML = `
      <div class="work-title">管理者権限変更</div>
      <div class="admin-sub-message warning">管理者が登録されていません。</div>
    `;
    return;
  }

  const rowsHtml = adminList.map(function (admin) {
    const currentRole = admin.adminRole || "";
    const nextRole = currentRole === "main" ? "admin" : "main";
    const buttonText = currentRole === "main" ? "adminに変更" : "mainに変更";

    const isSelf = admin.adminId === currentAdminId;
    const isProtectedTopAdmin = admin.protectionType === "最高管理者";

    const disableProtectedButton = isProtectedTopAdmin && nextRole === "admin";
    const disableSelfButton = isSelf && nextRole === "admin";
    const disableInactiveButton = admin.adminStatus !== "有効";
    const disableRoleButton = disableProtectedButton || disableSelfButton || disableInactiveButton;

    let buttonLabel = escapeHtml(buttonText);

    if (disableProtectedButton) {
      buttonLabel = "最高管理者は降格不可";
    } else if (disableSelfButton) {
      buttonLabel = "自分は降格不可";
    } else if (disableInactiveButton) {
      buttonLabel = "無効中は変更不可";
    }

    return `
      <tr>
        <td>${escapeHtml(String(admin.displayOrder || ""))}</td>
        <td>${escapeHtml(admin.adminId || "")}</td>
        <td>${escapeHtml(admin.adminName || "")}</td>
        <td>
          <span class="${currentRole === "main" ? "status-warning" : "status-active"}">
            ${escapeHtml(currentRole || "")}
          </span>
        </td>
        <td>
          <span class="${admin.adminStatus === "有効" ? "status-active" : "status-inactive"}">
            ${escapeHtml(admin.adminStatus || "未設定")}
          </span>
        </td>
        <td>${escapeHtml(admin.protectionType || "")}</td>
        <td>${escapeHtml(admin.adminMemo || "")}</td>
        <td>${escapeHtml(admin.updatedAt || "")}</td>
        <td>${escapeHtml(admin.updateContent || "")}</td>
        <td>
          <button
            class="small-action-button ${nextRole === "main" ? "success-button" : "danger-button"}"
            type="button"
            data-admin-id="${escapeHtml(admin.adminId || "")}"
            data-admin-name="${escapeHtml(admin.adminName || "")}"
            data-current-role="${escapeHtml(currentRole || "")}"
            data-next-role="${escapeHtml(nextRole)}"
            ${disableRoleButton ? "disabled" : ""}
          >
            ${buttonLabel}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">管理者権限変更</div>

    <div class="admin-sub-message">
      変更したい管理者のボタンを押してください。最高管理者とログイン中のMain管理者自身はadminに降格できません。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>表示順</th>
            <th>管理者ID</th>
            <th>管理者名</th>
            <th>現在権限</th>
            <th>状態</th>
            <th>保護区分</th>
            <th>備考</th>
            <th>更新日時</th>
            <th>更新内容</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  setupAdminRoleButtons();
}


function setupAdminRoleButtons() {
  const buttons = document.querySelectorAll("[data-next-role]");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.disabled) return;

      const targetAdminId = button.dataset.adminId || "";
      const targetAdminName = button.dataset.adminName || "";
      const currentRole = button.dataset.currentRole || "";
      const nextRole = button.dataset.nextRole || "";

      const ok = window.confirm(
        targetAdminId + " / " + targetAdminName + "\n\n" +
        "権限を「" + currentRole + "」から「" + nextRole + "」へ変更しますか？"
      );

      if (!ok) return;

      updateAdminRole(targetAdminId, targetAdminName, currentRole, nextRole);
    });
  });
}


/* ==================================================
   管理者 権限変更 保存
   Apps Script action: updateAdminRole
   Main管理者専用
   ================================================== */

async function updateAdminRole(targetAdminId, targetAdminName, currentRole, nextRole) {
  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  const reason = "管理者権限変更：" + currentRole + "→" + nextRole;

  showWorkMessage(
    targetAdminId + " / " + targetAdminName + " の権限を「" + nextRole + "」へ変更中..."
  );

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateAdminRole",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,
        targetAdminId: targetAdminId,
        nextRole: nextRole,
        reason: reason
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "管理者権限変更APIエラー",
        data.message || "管理者権限変更に失敗しました。",
        "updateAdminRole",
        {
          targetAdminId: targetAdminId,
          targetAdminName: targetAdminName,
          currentRole: currentRole,
          nextRole: nextRole,
          responseMessage: data.message || ""
        }
      );

      showWorkMessage(data.message || "管理者権限変更に失敗しました。");
      return;
    }

    showWorkMessage(data.message || "管理者権限を変更しました。");

    // 変更後の一覧を再取得して表示更新
    showAdminRoleList();

  } catch (error) {
    console.error("管理者権限変更エラー:", error);

    await sendAdminErrorLog(
      "管理者権限変更エラー",
      error,
      "updateAdminRole",
      {
        targetAdminId: targetAdminId,
        targetAdminName: targetAdminName,
        currentRole: currentRole,
        nextRole: nextRole
      }
    );

    showWorkMessage("管理者権限変更中にエラーが発生しました。");
  }
}

/* ==================================================
   設定確認
   Apps Script action: getSettings
   Main管理者専用
   ================================================== */

async function showSettingsList() {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  workArea.innerHTML = `
    <div class="work-title">設定確認 / 変更</div>
    <div class="admin-sub-message">設定を取得中...</div>
  `;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getSettings",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "設定取得APIエラー",
        data.message || "設定の取得に失敗しました。",
        "getSettings",
        {
          responseMessage: data.message || ""
        }
      );

      workArea.innerHTML = `
        <div class="work-title">設定確認 / 変更</div>
        <div class="admin-sub-message error">${escapeHtml(data.message || "設定の取得に失敗しました。")}</div>
      `;
      return;
    }

    renderSettingsList(data.settingList || []);

  } catch (error) {
    console.error("設定取得エラー:", error);

    await sendAdminErrorLog(
      "設定取得エラー",
      error,
      "getSettings",
      {}
    );

    workArea.innerHTML = `
      <div class="work-title">設定確認 / 変更</div>
      <div class="admin-sub-message error">設定取得中にエラーが発生しました。</div>
    `;
  }
}


function renderSettingsList(settingList) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!settingList.length) {
    workArea.innerHTML = `
      <div class="work-title">設定確認 / 変更</div>
      <div class="admin-sub-message warning">設定項目はありません。</div>
    `;
    return;
  }

  const editableKeys = ["店舗名", "端末名", "営業日切替時刻", "写真横幅", "写真保存フォルダ名"];
  const isTopAdmin = currentAdminProtectionType === "最高管理者";

  const rowsHtml = settingList.map(function (item) {
    const key = item.key || "";
    const value = item.value || "";
    const memo = item.memo || "";
    const canEdit = isTopAdmin && editableKeys.indexOf(key) !== -1;

    let actionHtml = `<span class="status-inactive">変更不可</span>`;

    if (canEdit) {
      actionHtml = `
        <button
          class="small-action-button success-button"
          type="button"
          data-setting-key="${escapeHtml(key)}"
          data-setting-value="${escapeHtml(value)}"
          data-setting-memo="${escapeHtml(memo)}"
        >
          変更する
        </button>
      `;
    }

    return `
      <tr>
        <td>${escapeHtml(String(item.rowNumber || ""))}</td>
        <td>${escapeHtml(key)}</td>
        <td>${escapeHtml(value)}</td>
        <td>${escapeHtml(memo)}</td>
        <td>${escapeHtml(item.updatedAt || "")}</td>
        <td>${escapeHtml(item.updatedById || "")}</td>
        <td>${escapeHtml(item.updatedByName || "")}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join("");

  workArea.innerHTML = `
    <div class="work-title">設定確認 / 変更</div>

    <div class="admin-sub-message">
      現在の設定を表示しています。変更できるのは最高管理者のみです。
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>行番号</th>
            <th>設定キー</th>
            <th>設定値</th>
            <th>備考</th>
            <th>更新日時</th>
            <th>更新者ID</th>
            <th>更新者名</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  setupSettingEditButtons();
}

function setupSettingEditButtons() {
  const buttons = document.querySelectorAll("[data-setting-key]");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const settingKey = button.dataset.settingKey || "";
      const settingValue = button.dataset.settingValue || "";
      const settingMemo = button.dataset.settingMemo || "";

      showSettingEditForm(settingKey, settingValue, settingMemo);
    });
  });
}

function showSettingEditForm(settingKey, settingValue, settingMemo) {
  const workArea = document.getElementById("adminWorkArea");

  if (!workArea) return;

  if (!currentAdminId || !currentAdminPw) {
    showWorkMessage("管理者ログイン情報がありません。再ログインしてください。");
    return;
  }

  if (currentAdminRole !== "main") {
    showWorkMessage("この機能はMain管理者のみ使用できます。");
    return;
  }

  if (currentAdminProtectionType !== "最高管理者") {
    showWorkMessage("設定変更は最高管理者のみ使用できます。");
    return;
  }

  const settingInputMode =
    settingKey === "写真横幅" || settingKey === "営業日切替時刻"
      ? "numeric"
      : "text";

  workArea.innerHTML = `
    <div class="work-title">設定変更</div>

    <div class="admin-form">

      <div class="admin-sub-message">
        変更対象：${escapeHtml(settingKey)}
      </div>

      <div class="admin-form-row">
        <label>設定キー</label>
        <input id="editSettingKey" class="admin-form-input" type="text" value="${escapeHtml(settingKey)}" readonly>
      </div>

      <div class="admin-form-row">
        <label for="editSettingValue">設定値</label>
        <input id="editSettingValue" class="admin-form-input" type="text" inputmode="${settingInputMode}" value="${escapeHtml(settingValue)}" autocomplete="off">
      </div>

      <div class="admin-form-row">
        <label>備考</label>
        <input class="admin-form-input" type="text" value="${escapeHtml(settingMemo)}" readonly>
      </div>

      <div class="admin-form-row">
        <label for="editSettingReason">変更理由</label>
        <input id="editSettingReason" class="admin-form-input" type="text" value="設定変更" autocomplete="off">
      </div>

      <button id="btnSaveSettingEdit" class="admin-action-button" type="button">
        設定を保存する
      </button>

      <button id="btnBackToSettingsList" class="admin-action-button secondary-button" type="button">
        設定一覧に戻る
      </button>

      <div id="settingEditMessage" class="admin-sub-message">
        変更内容を確認して保存してください。
      </div>

    </div>
  `;

  const editSettingValue = document.getElementById("editSettingValue");
  const btnSaveSettingEdit = document.getElementById("btnSaveSettingEdit");
  const btnBackToSettingsList = document.getElementById("btnBackToSettingsList");

  if (btnSaveSettingEdit) {
    btnSaveSettingEdit.addEventListener("click", function () {
      saveSettingEdit();
    });
  }

  if (btnBackToSettingsList) {
    btnBackToSettingsList.addEventListener("click", function () {
      showSettingsList();
    });
  }

  if (editSettingValue) {
    editSettingValue.focus();
    editSettingValue.select();
  }
}

async function saveSettingEdit() {
  const editSettingKey = document.getElementById("editSettingKey");
  const editSettingValue = document.getElementById("editSettingValue");
  const editSettingReason = document.getElementById("editSettingReason");
  const btnSaveSettingEdit = document.getElementById("btnSaveSettingEdit");

  const settingKey = editSettingKey ? editSettingKey.value.trim() : "";
  const settingValue = editSettingValue ? editSettingValue.value.trim() : "";
  const reason = editSettingReason ? editSettingReason.value.trim() : "";

  if (!currentAdminId || !currentAdminPw) {
    showSettingEditMessage("管理者ログイン情報がありません。再ログインしてください。", "error");
    return;
  }

  if (currentAdminRole !== "main") {
    showSettingEditMessage("この機能はMain管理者のみ使用できます。", "error");
    return;
  }

  if (currentAdminProtectionType !== "最高管理者") {
    showSettingEditMessage("設定変更は最高管理者のみ使用できます。", "error");
    return;
  }

  if (!settingKey) {
    showSettingEditMessage("設定キーがありません。", "error");
    return;
  }

  if (!settingValue) {
    showSettingEditMessage("設定値を入力してください。", "warning");
    if (editSettingValue) editSettingValue.focus();
    return;
  }

  if (settingKey === "営業日切替時刻") {
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timePattern.test(settingValue)) {
      showSettingEditMessage("営業日切替時刻は 8:00 または 08:00 の形式で入力してください。", "warning");
      if (editSettingValue) editSettingValue.focus();
      return;
    }
  }

  if (settingKey === "写真横幅") {
    const widthValue = Number(settingValue);

    if (!Number.isInteger(widthValue) || widthValue < 320 || widthValue > 1280) {
      showSettingEditMessage("写真横幅は 320〜1280 の整数で入力してください。", "warning");
      if (editSettingValue) editSettingValue.focus();
      return;
    }
  }

  const ok = window.confirm(
    settingKey + "\n\n" +
    "設定値を「" + settingValue + "」に変更しますか？"
  );

  if (!ok) return;

  if (btnSaveSettingEdit) {
    btnSaveSettingEdit.disabled = true;
    btnSaveSettingEdit.textContent = "保存中...";
  }

  showSettingEditMessage("設定を保存中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "updateSettings",
        loginAdminId: currentAdminId,
        loginAdminPw: currentAdminPw,
        settingKey: settingKey,
        settingValue: settingValue,
        reason: reason
      })
    });

    const data = await response.json();

    if (!data.success) {
      await sendAdminErrorLog(
        "設定変更APIエラー",
        data.message || "設定変更に失敗しました。",
        "updateSettings",
        {
          settingKey: settingKey,
          settingValue: settingValue,
          reason: reason,
          responseMessage: data.message || ""
        }
      );

      if (btnSaveSettingEdit) {
        btnSaveSettingEdit.disabled = false;
        btnSaveSettingEdit.textContent = "設定を保存する";
      }

      showSettingEditMessage(data.message || "設定変更に失敗しました。", "error");
      return;
    }

    showSettingEditMessage(data.message || "設定を変更しました。", "success");

    if (btnSaveSettingEdit) {
      btnSaveSettingEdit.disabled = false;
      btnSaveSettingEdit.textContent = "設定を保存する";
    }

    setTimeout(function () {
      showSettingsList();
    }, 800);

  } catch (error) {
    console.error("設定変更エラー:", error);

    await sendAdminErrorLog(
      "設定変更エラー",
      error,
      "updateSettings",
      {
        settingKey: settingKey,
        settingValue: settingValue,
        reason: reason
      }
    );

    if (btnSaveSettingEdit) {
      btnSaveSettingEdit.disabled = false;
      btnSaveSettingEdit.textContent = "設定を保存する";
    }

    showSettingEditMessage("設定変更中にエラーが発生しました。", "error");
  }
}


function showSettingEditMessage(message, type) {
  const el = document.getElementById("settingEditMessage");

  if (!el) return;

  el.textContent = message;

  el.classList.remove("error");
  el.classList.remove("success");
  el.classList.remove("warning");

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }

  if (type === "warning") {
    el.classList.add("warning");
  }
}

function showWorkMessage(message) {
  const el = document.getElementById("adminWorkArea");

  if (el) {
    el.textContent = message;
  }
}
