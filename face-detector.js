/* ==================================================
   ALLURE勤怠PWA face-detector.js
   完全貼り替え版 v2

   役割：
   ・MediaPipe Face Detector の読み込み
   ・カメラ映像から顔あり / 顔なしを判定
   ・結果を app.js に渡す

   重要：
   ・このファイルだけ type="module" で読み込む
   ・app.js は通常 script のまま
   ・顔検出で失敗しても app.js 本体は止めない
   ================================================== */


import {
  FaceDetector,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";


/* ==================================================
   MediaPipe設定
   ================================================== */

const ALLURE_FACE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

const ALLURE_FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";


/* ==================================================
   顔検出状態
   ================================================== */

let allureFaceDetector = null;
let allureFaceReady = false;
let allureFaceLoopStarted = false;
let allureFaceLastVideoTime = -1;
let allureFaceLastState = null;


/* ==================================================
   起動
   ================================================== */

window.addEventListener("DOMContentLoaded", function () {
  allureFaceStartSafely();
});


/* ==================================================
   安全起動
   ================================================== */

async function allureFaceStartSafely() {
  try {
    allureFaceNotifyStatus("顔検出読込中", false);

    const vision = await FilesetResolver.forVisionTasks(
      ALLURE_FACE_WASM_URL
    );

    allureFaceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: ALLURE_FACE_MODEL_URL,
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5
    });

    allureFaceReady = true;

    allureFaceNotifyStatus("顔確認中", false);
    allureFaceStartLoop();

    allureFaceNotifyMessage(
      "顔検出準備完了。顔をカメラに映してください。",
      "success"
    );

  } catch (error) {
    console.error("face-detector.js 顔検出初期化エラー:", error);

    allureFaceReady = false;
    allureFaceDetector = null;

    allureFaceNotifyDetected(false);
    allureFaceNotifyStatus("顔検出エラー", false);

    allureFaceNotifyMessage(
      "顔検出の読み込みに失敗しました。基本機能は使用できます。",
      "warning"
    );
  }
}


/* ==================================================
   検出ループ開始
   ================================================== */

function allureFaceStartLoop() {
  if (allureFaceLoopStarted) return;

  allureFaceLoopStarted = true;
  requestAnimationFrame(allureFaceCheckFrame);
}


/* ==================================================
   カメラ映像から顔検出
   ================================================== */

function allureFaceCheckFrame() {
  try {
    if (!allureFaceDetector || !allureFaceReady) {
      requestAnimationFrame(allureFaceCheckFrame);
      return;
    }

    const video = document.getElementById("cameraVideo");

    if (!video || video.readyState < 2) {
      requestAnimationFrame(allureFaceCheckFrame);
      return;
    }

    if (video.currentTime !== allureFaceLastVideoTime) {
      allureFaceLastVideoTime = video.currentTime;

      const result = allureFaceDetector.detectForVideo(
        video,
        performance.now()
      );

      const hasFace =
        !!(result && result.detections && result.detections.length > 0);

      allureFaceNotifyDetected(hasFace);
    }

  } catch (error) {
    console.error("face-detector.js 顔検出中エラー:", error);
    allureFaceNotifyDetected(false);
  }

  requestAnimationFrame(allureFaceCheckFrame);
}


/* ==================================================
   app.jsへ顔あり / 顔なし通知
   ================================================== */

function allureFaceNotifyDetected(hasFace) {
  if (allureFaceLastState === hasFace) {
    return;
  }

  allureFaceLastState = hasFace;

  if (typeof window.allureFace_setDetected === "function") {
    window.allureFace_setDetected(hasFace);
    return;
  }

  if (hasFace) {
    allureFaceNotifyStatus("顔OK", true);
  } else {
    allureFaceNotifyStatus("顔なし", false);
  }
}


/* ==================================================
   app.jsへ顔検出ステータス通知
   ================================================== */

function allureFaceNotifyStatus(text, isOk) {
  if (typeof window.allureFace_setDetectorStatus === "function") {
    window.allureFace_setDetectorStatus(text, isOk);
    return;
  }

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
   app.jsへメッセージ通知
   ================================================== */

function allureFaceNotifyMessage(message, type) {
  if (typeof window.showMainMessage === "function") {
    window.showMainMessage(message, type || "");
  }
}