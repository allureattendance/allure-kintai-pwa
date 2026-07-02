/* ==================================================
   ALLURE勤怠PWA app.js
   完全貼り替え版

   役割：
   ・時計 / 日付表示
   ・カメラ起動
   ・テンキー入力
   ・ID / PW確認
   ・状態表示
   ・打刻ボタン制御
   ・写真撮影 / 確認
   ・Apps Scriptへ保存送信
   ・設定シートから通常打刻画面用設定を取得

   注意：
   ・顔検出本体は face-detector.js 側で行う
   ・app.js は通常 script として読み込む
   ・face-detector.js だけ type="module" で読み込む
   ================================================== */


/* ==================================================
   重要設定
   Apps Script WebアプリURL
   ================================================== */

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz42nC-sCcf8H1ybtfX4MD8VkfJixvyn9s0Y69onmk2-AOZ0hyHYpWHuRpET84JDulJ/exec";


/* ==================================================
   通常打刻画面用 設定初期値
   設定シートから取得できない場合はこの値を使う
   ================================================== */

let clientSettings = {
  storeName: "ALLURE",
  terminalName: "ALLURE入口",
  businessDaySwitchTime: "8:00",
  photoWidth: 640,
  photoFolderName: "ALLURE_勤怠写真",
  appVersion: "2026.07.02-01"
};


/* ==================================================
   共通状態
   ================================================== */

let currentInputTarget = null;

let currentStaffId = "";
let currentStaffPw = "";
let currentStaffName = "";
let currentStatus = "";
let currentAllowedActions = [];

let currentFaceDetected = false;

let pendingPunchType = "";
let pendingPhotoBase64 = "";

let cameraStream = null;

let isSavingPunch = false;


/* ==================================================
   起動処理
   ================================================== */

window.addEventListener("DOMContentLoaded", async function () {
  await loadClientSettings();

  setupClock();
  setupInputs();
  setupKeypad();
  setupPunchButtons();
  setupPhotoModal();
  setupAdminButton();
  setupReloadButton();
  setupResumeReload();
  setupViewportFix();

  applyClientSettingsToScreen();

  resetScreen();

  startCamera();

  // 顔検出本体は face-detector.js 側。
  setFaceStatusText("顔検出停止中", false);
  updatePunchButtons();

  const staffIdInput = document.getElementById("staffIdInput");

  if (staffIdInput) {
    staffIdInput.focus();
    currentInputTarget = staffIdInput;
    staffIdInput.classList.add("active-input");
  }
});


/* ==================================================
   通常打刻画面用 設定取得
   Apps Script action: getClientSettings
   ================================================== */

async function loadClientSettings() {
  if (!GAS_API_URL || GAS_API_URL === "ここにApps ScriptのWebアプリURLを入れる") {
    return;
  }

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getClientSettings"
      })
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("通常打刻画面用設定取得失敗:", data.message || "");
      return;
    }

    if (data.settings) {
      clientSettings = {
       storeName: data.settings.storeName || clientSettings.storeName,
       terminalName: data.settings.terminalName || clientSettings.terminalName,
       businessDaySwitchTime: data.settings.businessDaySwitchTime || clientSettings.businessDaySwitchTime,
       photoWidth: Number(data.settings.photoWidth || clientSettings.photoWidth),
       photoFolderName: data.settings.photoFolderName || clientSettings.photoFolderName,
       appVersion: data.settings.appVersion || clientSettings.appVersion
      };
    }

  } catch (error) {
    console.error("通常打刻画面用設定取得エラー:", error);
  }
}


function applyClientSettingsToScreen() {
  const storeNameEl = document.getElementById("storeNameText");
  const terminalNameEl = document.getElementById("terminalNameText");
  const appVersionEl = document.getElementById("appVersionText");

  if (storeNameEl) {
    storeNameEl.textContent = clientSettings.storeName;
  }

  if (terminalNameEl) {
    terminalNameEl.textContent = clientSettings.terminalName;
  }

  if (appVersionEl) {
    appVersionEl.textContent = "Ver. " + (clientSettings.appVersion || "");
  }
}


/* ==================================================
   時計表示
   ================================================== */

function setupClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const dateText = document.getElementById("dateText");
  const timeText = document.getElementById("timeText");

  if (dateText) {
    dateText.textContent = `${yyyy}/${mm}/${dd}`;
  }

  if (timeText) {
    timeText.textContent = `${hh}:${mi}:${ss}`;
  }
}


/* ==================================================
   入力欄
   ================================================== */

function setupInputs() {
  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  if (staffIdInput) {
    staffIdInput.addEventListener("focus", function () {
      setActiveInput(staffIdInput);
    });

    staffIdInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();

        if (staffPwInput) {
          setActiveInput(staffPwInput);
        }
      }
    });

    staffIdInput.addEventListener("input", function () {
      clearStaffResultOnly();
    });
  }

  if (staffPwInput) {
    staffPwInput.addEventListener("focus", function () {
      setActiveInput(staffPwInput);
    });

    staffPwInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        checkStaffStatus();
      }
    });

    staffPwInput.addEventListener("input", function () {
      clearStaffResultOnly();
    });
  }
}

function setActiveInput(inputElement) {
  if (!inputElement) return;

  // すでに同じ入力欄なら何もしない
  if (currentInputTarget === inputElement) return;

  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  if (staffIdInput) {
    staffIdInput.classList.remove("active-input");
  }

  if (staffPwInput) {
    staffPwInput.classList.remove("active-input");
  }

  currentInputTarget = inputElement;

  inputElement.classList.add("active-input");

  // Androidキーボードを出さないため、ここでは focus() しない
}


/* ==================================================
   テンキー
   7 8 9 BS
   4 5 6 TAB
   1 2 3 0
   ================================================== */

function setupKeypad() {
  const buttons = document.querySelectorAll(".keypad-button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const key = button.dataset.key;
      handleKeypadInput(key);
    });
  });
}

function handleKeypadInput(key) {
  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  if (!currentInputTarget) {
    if (staffIdInput) {
      setActiveInput(staffIdInput);
    }
  }

  if (!currentInputTarget) return;

  // BS：1文字削除
  if (key === "backspace") {
    currentInputTarget.value = currentInputTarget.value.slice(0, -1);
    clearStaffResultOnly();
    return;
  }

  // TAB：ID → PW、PW → スタッフ確認
  if (key === "tab") {
    if (currentInputTarget === staffIdInput) {
      if (staffPwInput) {
        setActiveInput(staffPwInput);
      }
      return;
    }

    if (currentInputTarget === staffPwInput) {
      checkStaffStatus();
      return;
    }

    return;
  }

  // 数字以外は入力しない
  if (!/^[0-9]$/.test(key)) {
    return;
  }

  currentInputTarget.value += key;
  clearStaffResultOnly();
}


/* ==================================================
   カメラ起動
   ================================================== */

async function startCamera() {
  const video = document.getElementById("cameraVideo");
  const cameraMessage = document.getElementById("cameraMessage");

  if (!video) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (cameraMessage) {
      cameraMessage.textContent = "カメラ非対応です";
      cameraMessage.classList.add("camera-error");
    }

    showMainMessage("このブラウザはカメラ機能に対応していません", "error");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = cameraStream;

    video.onloadedmetadata = function () {
      video.play();

      if (cameraMessage) {
        cameraMessage.textContent = "顔をガイド内に合わせてください";
        cameraMessage.classList.remove("camera-error");
        cameraMessage.classList.add("camera-ok");
      }
    };

  } catch (error) {
    console.error("カメラ起動エラー:", error);

    sendErrorLog(
      "カメラ起動エラー",
      "カメラを起動できません",
      "startCamera",
      error && error.message ? error.message : String(error)
    );

    if (cameraMessage) {
      cameraMessage.textContent = "カメラを起動できません";
      cameraMessage.classList.add("camera-error");
    }

    showMainMessage("カメラを起動できません。ブラウザのカメラ許可を確認してください。", "error");
  }
}


/* ==================================================
   スタッフ状態確認
   Apps Script action: checkStaffStatus

   Apps Script側：
   staffCode → 従業員コード
   staffPin  → 暗証番号
   ================================================== */

async function checkStaffStatus() {
  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  const staffId = staffIdInput ? staffIdInput.value.trim() : "";
  const staffPw = staffPwInput ? staffPwInput.value.trim() : "";

  if (!staffId) {
    showMainMessage("IDを入力してください", "warning");
    if (staffIdInput) setActiveInput(staffIdInput);
    return;
  }

  if (!staffPw) {
    showMainMessage("PWを入力してください", "warning");
    if (staffPwInput) setActiveInput(staffPwInput);
    return;
  }

  if (!isGasUrlSet()) return;

  showMainMessage("スタッフ確認中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "checkStaffStatus",

        // Apps Script側が実際に読んでいる名前
        staffCode: staffId,
        staffPin: staffPw,

        // 画面入力
        staffId: staffId,
        staffPw: staffPw,

        // 互換用
        employeeCode: staffId,
        pinCode: staffPw,
        code: staffId,
        id: staffId,
        password: staffPw,
        pin: staffPw,
        pw: staffPw
      })
    });

    const data = await response.json();

    if (!data.success) {
      currentStaffId = "";
      currentStaffPw = "";
      currentStaffName = "";
      currentStatus = "";
      currentAllowedActions = [];

      setStaffName("未確認");
      setStatusText("未確認");

      updatePunchButtons();

      showMainMessage(data.message || "IDまたはPWが違います", "error");
      return;
    }

    currentStaffId = staffId;
    currentStaffPw = staffPw;
    currentStaffName = data.staffName || data.name || "";
    currentStatus = data.status || "";

    currentAllowedActions = Array.isArray(data.allowedPunchTypes)
      ? data.allowedPunchTypes
      : Array.isArray(data.allowedActions)
        ? data.allowedActions
        : [];

    setStaffName(currentStaffName || "未設定");
    setStatusText(currentStatus || "未確認");

    updatePunchButtons();

    if (currentFaceDetected) {
      showMainMessage("確認完了。打刻できます。", "success");
    } else {
      showMainMessage("確認完了。顔をカメラに映してください。", "warning");
    }

  } catch (error) {
    console.error("スタッフ確認エラー:", error);

    sendErrorLog(
      "スタッフ確認エラー",
      "スタッフ確認でエラーが発生しました",
      "checkStaffStatus",
      error && error.message ? error.message : String(error)
    );

    showMainMessage("スタッフ確認でエラーが発生しました", "error");
  }
}


/* ==================================================
   打刻ボタン
   ================================================== */

function setupPunchButtons() {
  const buttons = document.querySelectorAll(".punch-button");

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.disabled || button.classList.contains("disabled")) {
        return;
      }

      const punchType = button.dataset.punchType;

      if (!punchType) {
        showMainMessage("打刻種別が取得できません", "error");
        return;
      }

      preparePunch(punchType);
    });
  });
}

function preparePunch(punchType) {
  if (!currentStaffId || !currentStaffPw) {
    showMainMessage("先にIDとPWを入力してください", "warning");
    return;
  }

  if (!currentFaceDetected) {
    showMainMessage("顔が映っていないため打刻できません", "warning");
    return;
  }

  pendingPunchType = punchType;

  const photoBase64 = captureCameraPhoto();

  if (!photoBase64) {
    showMainMessage("写真撮影に失敗しました", "error");

    sendErrorLog(
      "写真撮影エラー",
      "写真撮影に失敗しました",
      "captureCameraPhoto",
      "video readyState または canvas 取得失敗"
    );

    return;
  }

  pendingPhotoBase64 = photoBase64;

  showPhotoConfirm(photoBase64);
}


/* ==================================================
   写真撮影・圧縮
   設定シートの「写真横幅」を使用
   ================================================== */

function captureCameraPhoto() {
  const video = document.getElementById("cameraVideo");

  if (!video || video.readyState < 2) {
    return "";
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (!sourceWidth || !sourceHeight) {
    return "";
  }

  const targetWidth = Number(clientSettings.photoWidth || 640);
  const targetHeight = Math.round(sourceHeight * (targetWidth / sourceWidth));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return "";
  }

  // 画面表示は左右反転しているため、保存写真も見た目に合わせる
  ctx.translate(targetWidth, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL("image/jpeg", 0.82);
}


/* ==================================================
   管理者画面を開く
   ================================================== */

function setupAdminButton() {
  const btnOpenAdmin = document.getElementById("btnOpenAdmin");

  if (!btnOpenAdmin) return;

  btnOpenAdmin.addEventListener("click", function () {
    window.location.href = "admin.html";
  });
}

/* ==================================================
   Reloadボタン
   カメラ停止・顔検出停止・通信不安定時の復旧用
   ================================================== */

function setupReloadButton() {
  const btnReloadApp = document.getElementById("btnReloadApp");

  if (!btnReloadApp) return;

  btnReloadApp.addEventListener("click", function () {
    const ok = window.confirm(
      "勤怠画面をReloadします。\n\n" +
      "入力中のID/PWは消えます。\n" +
      "よろしいですか？"
    );

    if (!ok) return;

    const baseUrl = window.location.origin + window.location.pathname;
    const reloadUrl = baseUrl + "?reload=" + Date.now();

    window.location.replace(reloadUrl);
  });
}

/* ==================================================
   スリープ復帰 / 画面再表示時の自動Reload
   Androidでカメラが止まったままになる対策
   ================================================== */

function setupResumeReload() {
  let inactiveAt = 0;
  let isResumeReloading = false;

  function markInactive() {
    inactiveAt = Date.now();
  }

  function checkResume(reason) {
    if (!inactiveAt) return;
    if (isResumeReloading) return;

    const inactiveTime = Date.now() - inactiveAt;

    // 2秒以上、画面OFF・裏移動・フォーカス外れがあった場合だけReload
    if (inactiveTime < 2000) return;

    isResumeReloading = true;

    showMainMessage(
      "画面復帰を検知しました。カメラを再起動します...",
      "warning"
    );

    setTimeout(function () {
      const baseUrl = window.location.origin + window.location.pathname;
      const reloadUrl =
        baseUrl +
        "?resumeReload=" +
        Date.now() +
        "&reason=" +
        encodeURIComponent(reason || "resume");

      window.location.replace(reloadUrl);
    }, 800);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      markInactive();
      return;
    }

    checkResume("visibilitychange");
  });

  window.addEventListener("pagehide", function () {
    markInactive();
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      checkResume("pageshow-persisted");
      return;
    }

    checkResume("pageshow");
  });

  window.addEventListener("blur", function () {
    markInactive();
  });

  window.addEventListener("focus", function () {
    checkResume("focus");
  });
}

/* ==================================================
   Android / PWA 画面高さズレ対策
   復帰後に下が切れる問題を補正する
   ================================================== */

function setupViewportFix() {
  function updateAppHeight() {
    const height = window.innerHeight;

    document.documentElement.style.setProperty(
      "--app-height",
      height + "px"
    );

    document.body.style.height = height + "px";

    // 復帰直後にズレたスクロール位置を戻す
    window.scrollTo(0, 0);
  }

  // 起動直後
  updateAppHeight();

  // 少し遅れて再計算
  setTimeout(updateAppHeight, 300);
  setTimeout(updateAppHeight, 1000);

  // 画面サイズ変更時
  window.addEventListener("resize", function () {
    updateAppHeight();
    setTimeout(updateAppHeight, 300);
  });

  // 画面向き変更時
  window.addEventListener("orientationchange", function () {
    setTimeout(updateAppHeight, 300);
    setTimeout(updateAppHeight, 1000);
  });

  // スリープ復帰・アプリ復帰時
  window.addEventListener("focus", function () {
    updateAppHeight();
    setTimeout(updateAppHeight, 300);
    setTimeout(updateAppHeight, 1000);
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      updateAppHeight();
      setTimeout(updateAppHeight, 300);
      setTimeout(updateAppHeight, 1000);
    }
  });
}

/* ==================================================
   写真確認モーダル
   ================================================== */

function setupPhotoModal() {
  const btnRetakePhoto = document.getElementById("btnRetakePhoto");
  const btnSavePhoto = document.getElementById("btnSavePhoto");

  if (btnRetakePhoto) {
    btnRetakePhoto.disabled = false;

    btnRetakePhoto.addEventListener("click", function () {
      if (isSavingPunch) return;

      hidePhotoConfirm();
      pendingPhotoBase64 = "";
      pendingPunchType = "";
      showMainMessage("撮り直してください", "warning");
    });
  }

  if (btnSavePhoto) {
    btnSavePhoto.disabled = false;

    btnSavePhoto.addEventListener("click", function () {
      savePunch();
    });
  }
}

function showPhotoConfirm(photoBase64) {
  const modal = document.getElementById("photoConfirmModal");
  const preview = document.getElementById("photoPreview");
  const btnRetakePhoto = document.getElementById("btnRetakePhoto");
  const btnSavePhoto = document.getElementById("btnSavePhoto");

  isSavingPunch = false;

  if (preview) {
    preview.src = photoBase64;
  }

  if (btnRetakePhoto) {
    btnRetakePhoto.disabled = false;
  }

  if (btnSavePhoto) {
    btnSavePhoto.disabled = false;
    btnSavePhoto.textContent = "保存する";
  }

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function hidePhotoConfirm() {
  const modal = document.getElementById("photoConfirmModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}


/* ==================================================
   打刻保存
   Apps Script action: savePunch
   ================================================== */

async function savePunch() {
  if (isSavingPunch) {
    return;
  }

  if (!pendingPunchType) {
    showMainMessage("打刻種別がありません", "error");
    return;
  }

  if (!pendingPhotoBase64) {
    showMainMessage("写真がありません", "error");
    return;
  }

  if (!isGasUrlSet()) return;

  const btnSavePhoto = document.getElementById("btnSavePhoto");
  const btnRetakePhoto = document.getElementById("btnRetakePhoto");

  isSavingPunch = true;

  if (btnSavePhoto) {
    btnSavePhoto.disabled = true;
    btnSavePhoto.textContent = "保存中...";
  }

  if (btnRetakePhoto) {
    btnRetakePhoto.disabled = true;
  }

  showMainMessage("保存中...", "");

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "savePunch",

        // Apps Script側が実際に読んでいる名前
        staffCode: currentStaffId,
        staffPin: currentStaffPw,

        // 画面入力
        staffId: currentStaffId,
        staffPw: currentStaffPw,
        staffName: currentStaffName,
        punchType: pendingPunchType,
        photoBase64: pendingPhotoBase64,

        // 設定シートから取得した値
        storeName: clientSettings.storeName || "ALLURE",
        terminalName: clientSettings.terminalName || "ALLURE入口",
        businessDaySwitchTime: clientSettings.businessDaySwitchTime || "8:00",
        photoWidth: clientSettings.photoWidth || 640,
        photoFolderName: clientSettings.photoFolderName || "ALLURE_勤怠写真",

        // 互換用
        employeeCode: currentStaffId,
        pinCode: currentStaffPw,
        code: currentStaffId,
        id: currentStaffId,
        password: currentStaffPw,
        pin: currentStaffPw,
        pw: currentStaffPw,
        name: currentStaffName,
        type: pendingPunchType,
        actionType: pendingPunchType,
        punch: pendingPunchType,
        imageBase64: pendingPhotoBase64,
        photo: pendingPhotoBase64,
        image: pendingPhotoBase64
      })
    });

    const data = await response.json();

    if (!data.success) {
      isSavingPunch = false;

      if (btnSavePhoto) {
        btnSavePhoto.disabled = false;
        btnSavePhoto.textContent = "保存する";
      }

      if (btnRetakePhoto) {
        btnRetakePhoto.disabled = false;
      }

      showMainMessage(data.message || "保存に失敗しました", "error");
      return;
    }

    hidePhotoConfirm();

    showMainMessage("保存しました", "success");

    resetAfterSave();

  } catch (error) {
    console.error("打刻保存エラー:", error);

    sendErrorLog(
      "打刻保存エラー",
      "保存中にエラーが発生しました",
      "savePunch",
      error && error.message ? error.message : String(error)
    );

    isSavingPunch = false;

    if (btnSavePhoto) {
      btnSavePhoto.disabled = false;
      btnSavePhoto.textContent = "保存する";
    }

    if (btnRetakePhoto) {
      btnRetakePhoto.disabled = false;
    }

    showMainMessage("保存中にエラーが発生しました", "error");
  }
}


/* ==================================================
   顔検出との連携
   face-detector.js から呼ばれる
   ================================================== */

function allureFace_setDetected(hasFace) {
  currentFaceDetected = !!hasFace;

  if (currentFaceDetected) {
    setFaceStatusText("顔OK", true);
  } else {
    setFaceStatusText("顔なし", false);
  }

  updatePunchButtons();
}

function allureFace_setDetectorStatus(text, isOk) {
  setFaceStatusText(text, isOk);
}

function setFaceStatusText(text, isOk) {
  const el = document.getElementById("allureFaceStatus");

  if (!el) return;

  el.textContent = text;

  el.classList.remove("face-ok");
  el.classList.remove("face-ng");

  if (isOk) {
    el.classList.add("face-ok");
  } else {
    el.classList.add("face-ng");
  }
}


/* ==================================================
   打刻ボタン制御
   顔なし：全部押せない
   顔あり：状態に応じて押せるボタンだけ有効
   ================================================== */

function updatePunchButtons() {
  const btnIn = document.getElementById("btnIn");
  const btnOut = document.getElementById("btnOut");
  const btnGoOut = document.getElementById("btnGoOut");
  const btnBack = document.getElementById("btnBack");

  if (!btnIn || !btnOut || !btnGoOut || !btnBack) {
    return;
  }

  // まず全部押せない状態にする
  setButtonDisabled(btnIn, true, "in");
  setButtonDisabled(btnOut, true, "out");
  setButtonDisabled(btnGoOut, true, "goout");
  setButtonDisabled(btnBack, true, "back");

  // 顔がない場合は全部押せない
  if (!currentFaceDetected) {
    return;
  }

  // スタッフ状態が未確認なら全部押せない
  if (!currentStatus) {
    return;
  }

  const statusText = String(currentStatus).trim();

  const allowedText = Array.isArray(currentAllowedActions)
    ? currentAllowedActions.map(function (item) {
        return String(item).trim();
      })
    : [];

  // allowedPunchTypes / allowedActions がある場合は優先
  if (allowedText.length > 0) {
    if (
      allowedText.includes("IN") ||
      allowedText.includes("出勤")
    ) {
      setButtonDisabled(btnIn, false, "in");
    }

    if (
      allowedText.includes("OUT") ||
      allowedText.includes("退勤")
    ) {
      setButtonDisabled(btnOut, false, "out");
    }

    if (
      allowedText.includes("GO_OUT") ||
      allowedText.includes("GO OUT") ||
      allowedText.includes("外出")
    ) {
      setButtonDisabled(btnGoOut, false, "goout");
    }

    if (
      allowedText.includes("BACK") ||
      allowedText.includes("戻り")
    ) {
      setButtonDisabled(btnBack, false, "back");
    }

    return;
  }

  // allowedTextが無い場合は状態名で判定
  if (statusText === "出勤前") {
    setButtonDisabled(btnIn, false, "in");
    return;
  }

  if (statusText === "出勤中") {
    setButtonDisabled(btnOut, false, "out");
    setButtonDisabled(btnGoOut, false, "goout");
    return;
  }

  if (statusText === "外出中") {
    setButtonDisabled(btnBack, false, "back");
    return;
  }

  if (statusText === "退勤済み") {
    setButtonDisabled(btnIn, false, "in");
    return;
  }
}

function setButtonDisabled(button, disabled, type) {
  if (!button) return;

  button.disabled = disabled;

  button.classList.remove("btn-in-active");
  button.classList.remove("btn-out-active");
  button.classList.remove("btn-goout-active");
  button.classList.remove("btn-back-active");

  button.classList.remove("punch-active-in");
  button.classList.remove("punch-active-out");
  button.classList.remove("punch-active-goout");
  button.classList.remove("punch-active-back");

  button.classList.remove("disabled");

  if (disabled) {
    button.classList.add("disabled");
    return;
  }

  switch (type) {
    case "in":
      button.classList.add("btn-in-active");
      button.classList.add("punch-active-in");
      break;

    case "out":
      button.classList.add("btn-out-active");
      button.classList.add("punch-active-out");
      break;

    case "goout":
      button.classList.add("btn-goout-active");
      button.classList.add("punch-active-goout");
      break;

    case "back":
      button.classList.add("btn-back-active");
      button.classList.add("punch-active-back");
      break;
  }
}


/* ==================================================
   表示更新
   ================================================== */

function setStaffName(name) {
  const el = document.getElementById("staffNameText");

  if (el) {
    el.textContent = name;
  }
}

function setStatusText(status) {
  const el = document.getElementById("statusText");

  if (el) {
    el.textContent = status;
  }
}

function showMainMessage(message, type) {
  const el = document.getElementById("mainMessage");

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
   リセット
   ================================================== */

function clearStaffResultOnly() {
  currentStaffId = "";
  currentStaffPw = "";
  currentStaffName = "";
  currentStatus = "";
  currentAllowedActions = [];

  setStaffName("未確認");
  setStatusText("未確認");
  showMainMessage("IDとPWを入力してください", "");

  updatePunchButtons();
}

function resetAfterSave() {
  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  if (staffIdInput) staffIdInput.value = "";
  if (staffPwInput) staffPwInput.value = "";

  pendingPunchType = "";
  pendingPhotoBase64 = "";
  isSavingPunch = false;

  currentStaffId = "";
  currentStaffPw = "";
  currentStaffName = "";
  currentStatus = "";
  currentAllowedActions = [];

  setStaffName("未確認");
  setStatusText("未確認");

  updatePunchButtons();

  if (staffIdInput) {
    setActiveInput(staffIdInput);
  }
}

function resetScreen() {
  const staffIdInput = document.getElementById("staffIdInput");
  const staffPwInput = document.getElementById("staffPwInput");

  if (staffIdInput) staffIdInput.value = "";
  if (staffPwInput) staffPwInput.value = "";

  pendingPunchType = "";
  pendingPhotoBase64 = "";
  isSavingPunch = false;

  currentStaffId = "";
  currentStaffPw = "";
  currentStaffName = "";
  currentStatus = "";
  currentAllowedActions = [];

  setStaffName("未確認");
  setStatusText("未確認");
  showMainMessage("IDとPWを入力してください", "");

  updatePunchButtons();
}


/* ==================================================
   GAS URL確認
   ================================================== */

function isGasUrlSet() {
  if (!GAS_API_URL || GAS_API_URL === "ここにApps ScriptのWebアプリURLを入れる") {
    showMainMessage("app.js上部のGAS_API_URLにApps ScriptのURLを入れてください", "warning");
    return false;
  }

  return true;
}


/* ==================================================
   エラーログ送信
   Apps Script action: logError

   重要：
   ・エラーログ送信に失敗しても画面は止めない
   ・勤怠打刻処理を邪魔しない
   ================================================== */

function sendErrorLog(errorType, errorMessage, operation, detail) {
  try {
    if (!GAS_API_URL || GAS_API_URL === "ここにApps ScriptのWebアプリURLを入れる") {
      return;
    }

    fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "logError",
        terminalName: clientSettings.terminalName || "ALLURE入口",
        staffCode: currentStaffId || "",
        staffName: currentStaffName || "",
        status: currentStatus || "",
        errorType: errorType || "",
        errorMessage: errorMessage || "",
        operation: operation || "",
        detail: detail || "",
        userAgent: navigator.userAgent || ""
      })
    }).catch(function (error) {
      console.error("エラーログ送信失敗:", error);
    });

  } catch (error) {
    console.error("エラーログ処理エラー:", error);
  }
}


/* ==================================================
   face-detector.js / HTML から呼び出せるように公開
   ================================================== */

window.allureFace_setDetected = allureFace_setDetected;
window.allureFace_setDetectorStatus = allureFace_setDetectorStatus;
window.showMainMessage = showMainMessage;
window.savePunch = savePunch;
window.hidePhotoConfirm = hidePhotoConfirm;
window.sendErrorLog = sendErrorLog;
