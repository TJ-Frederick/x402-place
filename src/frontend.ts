import type { Env } from "./types";
import { FACTIONS } from "./factions";

export function serveHtml(env: Env): string {
  const factionsJson = JSON.stringify(FACTIONS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>$place — Faction Warfare</title>
<link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #070b14;
    --surface: #0c1220;
    --surface2: #111b2e;
    --surface3: #162036;
    --border: #1a2744;
    --text: #c8d6e5;
    --text-dim: #4a5a78;
    --text-bright: #edf2f7;
    --accent: #00d4ff;
    --accent2: #0090cc;
    --accent-glow: rgba(0, 212, 255, 0.12);
    --green: #00e676;
    --orange: #ff9f43;
    --red: #ff5252;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'JetBrains Mono', 'SF Mono', monospace;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 15% 50%, rgba(0, 140, 255, 0.035) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 20%, rgba(0, 200, 255, 0.025) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  /* ========== HEADER ========== */

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    height: 56px;
    z-index: 100;
    position: relative;
    box-shadow: 0 1px 24px rgba(0, 0, 0, 0.3);
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .logo {
    font-family: 'Oxanium', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .logo span {
    color: var(--accent);
    text-shadow: 0 0 14px rgba(0, 212, 255, 0.4);
  }
  .header-stats {
    display: flex;
    gap: 20px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }
  .stat-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
  }
  .stat-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
    transition: color 0.3s;
  }
  .stat-value.flash {
    color: #fff;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .session-counter {
    display: none;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 6px;
    background: rgba(0, 230, 118, 0.06);
    border: 1px solid rgba(0, 230, 118, 0.18);
  }
  .session-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
  }
  .session-value {
    font-family: 'Oxanium', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--green);
  }
  .faction-badge {
    display: none;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 6px;
    font-family: 'Oxanium', sans-serif;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid;
    letter-spacing: 0.5px;
  }
  .badge-emblem { font-size: 14px; }
  .wallet-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-family: 'Oxanium', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }
  .wallet-btn:hover {
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }
  .wallet-btn.connected {
    border-color: var(--green);
    color: var(--green);
    background: rgba(0, 230, 118, 0.05);
  }

  /* ========== INFO BUTTON & MODAL ========== */

  .info-btn {
    width: 30px; height: 30px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-dim);
    font-family: 'Oxanium', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .info-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }
  .info-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 14, 0.85);
    backdrop-filter: blur(6px);
    z-index: 9999;
    align-items: center;
    justify-content: center;
  }
  .info-overlay.show { display: flex; }
  .info-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    max-width: 480px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    padding: 28px 28px 22px;
    box-shadow: 0 8px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 212, 255, 0.06);
  }
  .info-modal h2 {
    font-family: 'Oxanium', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-bright);
    margin-bottom: 18px;
  }
  .info-modal h2 span { color: var(--accent); }
  .info-modal h3 {
    font-family: 'Oxanium', sans-serif;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--accent);
    margin: 18px 0 8px;
  }
  .info-modal p {
    font-size: 12px;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 6px;
  }
  .info-modal .info-factions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 12px;
  }
  .info-modal .info-faction-tag {
    font-family: 'Oxanium', sans-serif;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid;
  }
  .info-modal .info-close {
    display: block;
    width: 100%;
    margin-top: 18px;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-family: 'Oxanium', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }
  .info-modal .info-close:hover {
    border-color: var(--accent);
    box-shadow: 0 0 12px var(--accent-glow);
  }

  /* ========== LAYOUT ========== */

  .main {
    display: flex;
    height: calc(100vh - 56px);
    position: relative;
    z-index: 1;
  }

  /* ========== CANVAS ========== */

  .canvas-wrap {
    flex: 1;
    position: relative;
    overflow: hidden;
    cursor: crosshair;
    background: #050810;
  }
  .canvas-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.4);
  }
  #canvas {
    position: absolute;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    box-shadow: 0 0 0 2px var(--border), 0 0 40px rgba(0, 212, 255, 0.08);
  }
  .coords {
    position: absolute;
    bottom: 14px;
    left: 14px;
    background: rgba(7, 11, 20, 0.92);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-dim);
    pointer-events: none;
    z-index: 10;
    backdrop-filter: blur(4px);
  }
  .zoom-controls {
    position: absolute;
    bottom: 14px;
    right: 14px;
    display: flex;
    gap: 4px;
    z-index: 10;
  }
  .zoom-btn {
    width: 34px;
    height: 34px;
    background: rgba(12, 18, 32, 0.9);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.15s;
    backdrop-filter: blur(4px);
  }
  .zoom-btn:hover {
    background: var(--surface2);
    border-color: var(--accent);
    color: var(--accent);
  }
  .selected-pixel {
    position: absolute;
    border: 2px solid var(--accent);
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.5), inset 0 0 4px rgba(0, 212, 255, 0.2);
  }

  /* ========== SIDEBAR ========== */

  .sidebar {
    width: 310px;
    background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: -1px 0 24px rgba(0, 0, 0, 0.2);
  }
  .sidebar-section {
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-section h3 {
    font-family: 'Oxanium', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-dim);
    margin-bottom: 14px;
  }

  /* ========== IDENTITY ========== */

  .identity-section {
    text-align: center;
    padding: 24px 16px;
  }
  .connect-icon {
    font-size: 36px;
    margin-bottom: 12px;
    display: block;
    filter: grayscale(0.3);
  }
  .connect-title {
    font-family: 'Oxanium', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-bright);
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .connect-desc {
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 20px;
    line-height: 1.6;
  }
  .connect-big-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--accent2), var(--accent));
    border: none;
    border-radius: 8px;
    color: #000;
    font-family: 'Oxanium', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    position: relative;
    overflow: hidden;
  }
  .connect-big-btn::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.08) 50%,
      transparent 70%
    );
    animation: sheen 3s ease-in-out infinite;
  }
  @keyframes sheen {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
  .connect-big-btn:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 24px rgba(0, 212, 255, 0.3);
    transform: translateY(-1px);
  }
  .connect-sub {
    font-size: 11px;
    color: var(--text-dim);
    margin-top: 14px;
  }
  .identity-card {
    display: none;
    text-align: left;
  }
  .addr {
    font-size: 10px;
    color: var(--text-dim);
    margin-bottom: 10px;
    word-break: break-all;
    opacity: 0.7;
  }
  .faction-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
    position: relative;
    overflow: hidden;
  }
  .faction-card::before, .faction-card::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
  }
  .faction-card::before {
    top: -1px;
    left: -1px;
    border-top: 2px solid;
    border-left: 2px solid;
    border-color: inherit;
  }
  .faction-card::after {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid;
    border-right: 2px solid;
    border-color: inherit;
  }
  .faction-emblem {
    font-size: 22px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .faction-info { flex: 1; }
  .faction-label {
    font-family: 'Oxanium', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .faction-sub {
    font-size: 9px;
    color: var(--text-dim);
    margin-top: 3px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .faction-color-block {
    width: 26px;
    height: 26px;
    border-radius: 6px;
  }

  /* ========== COLOR PICKER ========== */

  .color-picker-section {
    margin-top: 12px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface2);
  }
  .color-picker-section label {
    font-family: 'Oxanium', sans-serif;
    font-size: 9px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    display: block;
    margin-bottom: 10px;
  }
  .color-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.15s;
    padding: 0;
    outline: none;
  }
  .color-swatch:hover {
    transform: scale(1.15);
    z-index: 1;
  }
  .color-swatch.active {
    border-color: #fff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }
  .color-custom-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .color-custom-row span {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .color-custom-row input[type="color"] {
    width: 28px;
    height: 28px;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    background: none;
    padding: 0;
  }
  .color-custom-row input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  .color-custom-row input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
  .color-custom-row input[type="color"].active {
    border-color: #fff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  /* ========== TARGET (Selected Pixel) ========== */

  .pixel-info {
    font-size: 12px;
  }
  .pixel-info .row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid rgba(26, 39, 68, 0.4);
  }
  .pixel-info .row:last-child { border-bottom: none; }
  .pixel-info .label {
    color: var(--text-dim);
    font-size: 11px;
  }
  .pixel-info .value { font-weight: 500; }
  .price-value { color: var(--green); }
  .overwrite-value { color: var(--orange); }

  .place-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 8px;
    color: white;
    font-family: 'Oxanium', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 14px;
    transition: all 0.2s;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    position: relative;
  }
  .place-btn:hover:not(:disabled) {
    filter: brightness(0.9);
    transform: translateY(-1px);
  }
  .place-btn:active:not(:disabled) {
    transform: scale(0.98);
  }
  .place-btn:disabled {
    background: var(--surface2) !important;
    color: var(--text-dim) !important;
    cursor: not-allowed;
    filter: none;
    box-shadow: none !important;
    animation: none !important;
  }
  .place-btn:not(:disabled) {
    animation: btnPulse 2.5s ease-in-out infinite;
  }
  @keyframes btnPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.12); }
    50% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
  }

  /* ========== LEADERBOARD ========== */

  .leaderboard {
    padding: 16px;
  }
  .leaderboard h3 {
    font-family: 'Oxanium', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-dim);
    margin-bottom: 14px;
  }
  .faction-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    font-size: 12px;
    transition: background 0.15s;
    border-radius: 4px;
  }
  .faction-entry:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  .faction-rank {
    width: 24px;
    text-align: center;
    font-size: 13px;
    flex-shrink: 0;
  }
  .faction-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .faction-name {
    font-family: 'Oxanium', sans-serif;
    font-weight: 600;
    flex: 1;
    font-size: 12px;
  }
  .faction-territory {
    font-size: 11px;
    color: var(--text-dim);
    min-width: 38px;
    text-align: right;
  }
  .faction-spent {
    color: var(--accent);
    font-weight: 500;
    font-size: 11px;
    min-width: 58px;
    text-align: right;
  }
  .faction-bar {
    height: 3px;
    background: rgba(26, 39, 68, 0.6);
    border-radius: 2px;
    margin: 2px 4px 6px 36px;
    overflow: hidden;
  }
  .faction-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease-out;
  }

  /* ========== ACTIVITY ========== */

  .activity {
    padding: 16px;
    border-top: 1px solid var(--border);
  }
  .activity h3 {
    font-family: 'Oxanium', sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-dim);
    margin-bottom: 10px;
  }
  .activity-item {
    font-size: 11px;
    color: var(--text-dim);
    padding: 3px 0;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .activity-item .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .activity-item .time-ago {
    margin-left: auto;
    font-size: 10px;
    opacity: 0.5;
    flex-shrink: 0;
  }

  /* ========== TOAST ========== */

  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 14px 28px;
    border-radius: 10px;
    font-family: 'Oxanium', sans-serif;
    font-size: 13px;
    font-weight: 600;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1000;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    letter-spacing: 0.5px;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }
  .toast.success {
    border-color: var(--green);
    color: var(--green);
    box-shadow: 0 8px 32px rgba(0, 230, 118, 0.1);
  }
  .toast.error {
    border-color: var(--red);
    color: var(--red);
    box-shadow: 0 8px 32px rgba(255, 82, 82, 0.1);
  }

  /* ========== LOADING ========== */

  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    z-index: 50;
  }
  .loading-content { text-align: center; }
  .loading-logo {
    font-family: 'Oxanium', sans-serif;
    font-size: 52px;
    font-weight: 700;
    letter-spacing: -2px;
    color: var(--text);
    margin-bottom: 4px;
  }
  .loading-logo span {
    color: var(--accent);
    text-shadow: 0 0 24px rgba(0, 212, 255, 0.5);
  }
  .loading-subtitle {
    font-family: 'Oxanium', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 6px;
    color: var(--text-dim);
    margin-bottom: 32px;
  }
  .loading-bar {
    width: 180px;
    height: 2px;
    background: var(--border);
    border-radius: 1px;
    overflow: hidden;
    margin: 0 auto;
  }
  .loading-bar-fill {
    width: 30%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    border-radius: 1px;
    animation: loadSlide 1.2s ease-in-out infinite;
  }
  @keyframes loadSlide {
    0% { transform: translateX(-200%); }
    100% { transform: translateX(400%); }
  }

  /* ========== EFFECTS ========== */

  .pixel-burst {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 20;
    transform: translate(-50%, -50%);
    border: 2px solid;
    background: transparent;
    animation: burst 0.6s ease-out forwards;
  }
  @keyframes burst {
    0% { width: 8px; height: 8px; opacity: 0.9; }
    100% { width: 60px; height: 60px; opacity: 0; }
  }
  .score-popup {
    position: absolute;
    pointer-events: none;
    z-index: 25;
    font-family: 'Oxanium', sans-serif;
    font-weight: 700;
    font-size: 16px;
    text-shadow: 0 0 8px currentColor;
    animation: scoreFloat 0.8s ease-out forwards;
    transform: translate(-50%, -50%);
  }
  @keyframes scoreFloat {
    0% { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
    40% { opacity: 1; transform: translate(-50%, -50%) translateY(-14px) scale(1.3); }
    100% { opacity: 0; transform: translate(-50%, -50%) translateY(-32px) scale(0.8); }
  }

  /* ========== MISC ========== */

  .no-wallet { padding: 12px 0; font-size: 12px; color: var(--text-dim); }
  .no-wallet a { color: var(--accent); text-decoration: none; }
  .no-wallet a:hover { text-decoration: underline; }

  .hint-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 6px 0;
    background: rgba(0, 212, 255, 0.03);
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .hint-bar kbd {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
    font-family: inherit;
  }

  /* Scrollbar styling */
  .sidebar ::-webkit-scrollbar { width: 4px; }
  .sidebar ::-webkit-scrollbar-track { background: transparent; }
  .sidebar ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ========== MOBILE ========== */

  .header-stats-compact { display: none; }
  .mobile-sheet { display: none; }

  @media (max-width: 768px) {
    .header {
      height: 44px;
      padding: 0 12px;
    }
    .header-left { gap: 10px; }
    .logo { font-size: 18px; }
    .header-stats { display: none; }
    .header-stats-compact {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-dim);
      white-space: nowrap;
    }
    .header-stats-compact .stat-val {
      color: var(--accent);
      font-weight: 500;
    }
    .header-right { gap: 8px; }
    .session-counter { display: none !important; }
    .faction-badge { display: none !important; }
    .wallet-btn {
      padding: 6px 10px;
      font-size: 11px;
    }
    .main { height: calc(100vh - 44px); }
    .sidebar { display: none; }
    .canvas-wrap { width: 100%; }

    .coords {
      top: 10px;
      left: 10px;
      bottom: auto;
      font-size: 11px;
      padding: 4px 10px;
    }
    .zoom-controls {
      bottom: auto;
      top: 10px;
      right: 10px;
    }
    .zoom-btn {
      width: 38px;
      height: 38px;
    }

    /* Toast above sheet */
    .toast { bottom: 180px; }

    /* ---- Bottom Sheet ---- */
    .mobile-sheet {
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
      border-radius: 14px 14px 0 0;
      z-index: 200;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      will-change: transform;
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
      max-height: 85vh;
    }
    .sheet-handle-area {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 0 6px;
      cursor: grab;
      -webkit-user-select: none;
      user-select: none;
    }
    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--text-dim);
    }

    /* Collapsed content: color row + claim button */
    .sheet-collapsed-content {
      padding: 4px 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mobile-color-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 4px 0;
      scrollbar-width: none;
    }
    .mobile-color-row::-webkit-scrollbar { display: none; }
    .mobile-color-row .color-swatch {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 6px;
    }
    .mobile-color-row .color-custom-inline {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border: 2px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      background: none;
      padding: 0;
    }
    .mobile-color-row .color-custom-inline::-webkit-color-swatch-wrapper { padding: 0; }
    .mobile-color-row .color-custom-inline::-webkit-color-swatch { border: none; border-radius: 4px; }
    .mobile-color-row .color-custom-inline.active {
      border-color: #fff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    }
    .sheet-collapsed-content .place-btn {
      margin-top: 0;
      padding: 12px;
      font-size: 12px;
    }

    /* Expanded content: pixel info + identity */
    .sheet-expanded-content {
      padding: 0 12px;
      border-top: 1px solid var(--border);
      overflow: hidden;
    }
    .mobile-pixel-info {
      padding: 10px 0;
    }
    .mobile-pixel-info .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      font-size: 11px;
    }
    .mobile-pixel-info .info-grid .row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }
    .mobile-pixel-info .info-grid .label { color: var(--text-dim); font-size: 10px; }
    .mobile-pixel-info .info-grid .value { font-weight: 500; }
    .mobile-pixel-info .info-grid .price-value { color: var(--green); }
    .mobile-pixel-info .info-grid .overwrite-value { color: var(--orange); }
    .mobile-identity {
      padding: 8px 0 10px;
      border-top: 1px solid rgba(26, 39, 68, 0.4);
    }
    .mobile-identity .faction-card {
      padding: 10px;
    }
    .mobile-identity .faction-emblem {
      width: 32px;
      height: 32px;
      font-size: 18px;
    }
    .mobile-identity .faction-label { font-size: 14px; }
    .mobile-identity .addr {
      font-size: 9px;
      margin-top: 6px;
      margin-bottom: 0;
    }

    /* Full content: leaderboard + activity */
    .sheet-full-content {
      padding: 0 12px;
      border-top: 1px solid var(--border);
      overflow-y: auto;
      flex: 1;
    }
    .sheet-full-content .leaderboard { padding: 10px 0; }
    .sheet-full-content .activity { padding: 10px 0; border-top: 1px solid var(--border); }

    /* Safe area for notched phones */
    .mobile-sheet {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="logo"><span>$</span>place</div>
    <div class="header-stats">
      <div class="stat">
        <span class="stat-label">active</span>
        <span class="stat-value" id="stat-active">--</span>
      </div>
      <div class="stat">
        <span class="stat-label">placed</span>
        <span class="stat-value" id="stat-total">--</span>
      </div>
      <div class="stat">
        <span class="stat-label">spent</span>
        <span class="stat-value" id="stat-spent">--</span>
      </div>
    </div>
    <div class="header-stats-compact">
      <span class="stat-val" id="stat-compact-placed">--</span>
      <span>placed &middot;</span>
      <span class="stat-val" id="stat-compact-spent">--</span>
    </div>
  </div>
  <div class="header-right">
    <div class="session-counter" id="session-counter">
      <span class="session-label">yours</span>
      <span class="session-value" id="session-value">0</span>
    </div>
    <div class="faction-badge" id="faction-badge">
      <span class="badge-emblem" id="badge-emblem"></span>
      <span id="badge-name"></span>
    </div>
    <button class="info-btn" id="info-btn" onclick="toggleInfo()" title="How it works">?</button>
    <button class="wallet-btn" id="wallet-btn" onclick="connectWallet()">Connect Wallet</button>
  </div>
</div>

<div class="info-overlay" id="info-overlay" onclick="if(event.target===this)toggleInfo()">
  <div class="info-modal">
    <h2><span>$</span>place &mdash; How It Works</h2>
    <h3>The Canvas</h3>
    <p>A 500&times;500 shared pixel grid. Every pixel is permanent &mdash; once placed, it stays forever unless someone overwrites it.</p>
    <h3>Claiming Pixels</h3>
    <p>Connect a wallet, pick a color, click a pixel, and pay with SBC on the Radius network. Unclaimed pixels start at $0.0001. Overwriting someone else's pixel costs double their last price, up to a $0.10 cap.</p>
    <h3>Factions</h3>
    <p>Your wallet address determines your faction. Fight for territory alongside your allies.</p>
    <div class="info-factions" id="info-factions"></div>
    <h3>Payments</h3>
    <p>Powered by the x402 payment protocol &mdash; HTTP 402 responses trigger automatic wallet prompts. No accounts, no sign-ups.</p>
    <button class="info-close" onclick="toggleInfo()">Got it</button>
  </div>
</div>

<div class="main">
  <div class="canvas-wrap" id="canvas-wrap">
    <canvas id="canvas" width="500" height="500"></canvas>
    <div class="selected-pixel" id="selected-pixel" style="display:none;"></div>
    <div class="coords" id="coords">(-, -)</div>
    <div class="zoom-controls">
      <button class="zoom-btn" onclick="zoomIn()">+</button>
      <button class="zoom-btn" onclick="zoomOut()">&minus;</button>
      <button class="zoom-btn" onclick="resetView()">&#8962;</button>
    </div>
    <div class="loading" id="loading">
      <div class="loading-content">
        <div class="loading-logo"><span>$</span>place</div>
        <div class="loading-subtitle">FACTION WARFARE</div>
        <div class="loading-bar"><div class="loading-bar-fill"></div></div>
      </div>
    </div>
  </div>

  <div class="sidebar">
    <div class="hint-bar">
      <span><kbd>Click</kbd> select pixel</span>
      <span><kbd>Shift</kbd>+drag to pan</span>
      <span><kbd>Scroll</kbd> zoom</span>
    </div>

    <div class="sidebar-section identity-section" id="identity-section">
      <div id="connect-prompt">
        <span class="connect-icon">&#9876;</span>
        <h2 class="connect-title">Join the Battle</h2>
        <p class="connect-desc">Connect your wallet to be assigned a faction and start claiming territory on the canvas.</p>
        <button class="connect-big-btn" onclick="connectWallet()">Connect Wallet</button>
        <div class="connect-sub">Each pixel costs SBC on Radius</div>
        <div class="no-wallet" id="no-wallet" style="display:none;">
          No wallet detected. Install <a href="https://metamask.io" target="_blank">MetaMask</a> to play.
        </div>
      </div>
      <div class="identity-card" id="identity-card">
        <div class="faction-card" id="faction-card">
          <div class="faction-emblem" id="identity-emblem"></div>
          <div class="faction-info">
            <div class="faction-label" id="identity-faction"></div>
            <div class="faction-sub">Your allegiance</div>
          </div>
          <div class="faction-color-block" id="identity-color"></div>
        </div>
        <div class="addr" id="identity-addr"></div>
        <div class="color-picker-section">
          <label>Choose your color</label>
          <div class="color-swatches" id="color-swatches"></div>
          <div class="color-custom-row">
            <span>custom</span>
            <input type="color" id="color-custom" value="#ffffff">
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <h3>Target</h3>
      <div class="pixel-info">
        <div class="row"><span class="label">position</span><span class="value" id="info-pos">--</span></div>
        <div class="row"><span class="label">owner</span><span class="value" id="info-owner">unclaimed</span></div>
        <div class="row"><span class="label">faction</span><span class="value" id="info-faction">--</span></div>
        <div class="row"><span class="label">price</span><span class="value price-value" id="info-price">$0.0001</span></div>
      </div>
      <button class="place-btn" id="place-btn" disabled>Connect to Claim</button>
    </div>

    <div class="leaderboard" id="leaderboard"><h3>Territory Control</h3></div>
    <div class="activity" id="activity"><h3>Battle Log</h3></div>
  </div>
</div>

<!-- Mobile Bottom Sheet -->
<div class="mobile-sheet" id="mobile-sheet">
  <div class="sheet-handle-area" id="sheet-handle-area">
    <div class="sheet-handle"></div>
  </div>

  <div class="sheet-collapsed-content">
    <div class="mobile-color-row" id="mobile-color-row"></div>
    <button class="place-btn" id="mobile-place-btn" disabled>Connect to Claim</button>
  </div>

  <div class="sheet-expanded-content" id="sheet-expanded">
    <div class="mobile-pixel-info">
      <div class="info-grid">
        <div class="row"><span class="label">position</span><span class="value" id="m-info-pos">--</span></div>
        <div class="row"><span class="label">owner</span><span class="value" id="m-info-owner">unclaimed</span></div>
        <div class="row"><span class="label">faction</span><span class="value" id="m-info-faction">--</span></div>
        <div class="row" style="grid-column: span 2"><span class="label">price</span><span class="value price-value" id="m-info-price">$0.0001</span></div>
      </div>
    </div>
    <div class="mobile-identity" id="mobile-identity" style="display:none;">
      <div class="faction-card" id="m-faction-card">
        <div class="faction-emblem" id="m-identity-emblem"></div>
        <div class="faction-info">
          <div class="faction-label" id="m-identity-faction"></div>
          <div class="faction-sub">Your allegiance</div>
        </div>
        <div class="faction-color-block" id="m-identity-color"></div>
      </div>
      <div class="addr" id="m-identity-addr"></div>
    </div>
  </div>

  <div class="sheet-full-content" id="sheet-full">
    <div class="leaderboard" id="mobile-leaderboard"><h3>Territory Control</h3></div>
    <div class="activity" id="mobile-activity"><h3>Battle Log</h3></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
var CANVAS_SIZE = 500;
var FACTIONS = ${factionsJson};
var RADIUS_CHAIN_ID = 723;
var RADIUS_CHAIN_HEX = '0x2d3';
var TOKEN_ADDRESS = '0x33ad9e4bd16b69b5bfded37d8b5d9ff9aba014fb';
var FACILITATOR_ADDRESS = '0xdeE710bB6a3b652C35B5cB74E7bdb03EE1F641E6';

var FACTION_EMBLEMS = {
  'Bombadil': '\\u265B',
  'Starbuck': '\\u2605',
  'Muaddib': '\\u25C8',
  'Kenobi': '\\u2726',
  'Picard': '\\u25B2',
  'Deckard': '\\u25C9',
  'Ripley': '\\u2B21'
};

function getEmblem(name) {
  return FACTION_EMBLEMS[name] || '\\u25CF';
}

function toggleInfo() {
  var overlay = document.getElementById('info-overlay');
  overlay.classList.toggle('show');
}

// Populate faction tags in info modal
(function() {
  var container = document.getElementById('info-factions');
  if (!container) return;
  FACTIONS.forEach(function(f) {
    var tag = document.createElement('span');
    tag.className = 'info-faction-tag';
    tag.style.color = f.color;
    tag.style.borderColor = f.color;
    tag.style.background = f.color + '12';
    tag.textContent = (FACTION_EMBLEMS[f.name] || '') + ' ' + f.name;
    container.appendChild(tag);
  });
})();

function getFactionForAddress(addr) {
  var idx = parseInt(addr.slice(-1).toLowerCase(), 16) % FACTIONS.length;
  return FACTIONS[idx];
}

var sessionPixels = 0;

var state = {
  pixels: new Map(),
  selectedX: null, selectedY: null,
  wallet: null, faction: null, color: '#ffffff',
  zoom: 2, panX: 0, panY: 0,
  dragging: false, dragStartX: 0, dragStartY: 0,
  dragStartPanX: 0, dragStartPanY: 0, placing: false,
};

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var wrap = document.getElementById('canvas-wrap');

// == Wallet ==

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function connectWallet() {
  if (!window.ethereum) {
    if (isMobile()) {
      window.location.href = 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname;
      return;
    }
    document.getElementById('no-wallet').style.display = 'block';
    return;
  }
  try {
    var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || !accounts.length) return;
    state.wallet = accounts[0];
    state.faction = getFactionForAddress(state.wallet);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: RADIUS_CHAIN_HEX }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: RADIUS_CHAIN_HEX,
            chainName: 'Radius',
            nativeCurrency: { name: 'RUSD', symbol: 'RUSD', decimals: 18 },
            rpcUrls: ['https://rpc.radiustech.xyz'],
            blockExplorerUrls: ['https://network.radiustech.xyz'],
          }],
        });
      }
    }
    updateWalletUI();
    showToast('Enlisted in ' + state.faction.name, 'success');
  } catch (e) {
    showToast('Connection failed: ' + e.message, 'error');
  }
}

function updateWalletUI() {
  if (!state.wallet) return;
  var short = state.wallet.slice(0, 6) + '..' + state.wallet.slice(-4);
  var btn = document.getElementById('wallet-btn');
  btn.textContent = short;
  btn.classList.add('connected');

  var badge = document.getElementById('faction-badge');
  badge.style.display = 'flex';
  badge.style.borderColor = state.faction.color;
  badge.style.color = state.faction.color;
  document.getElementById('badge-emblem').textContent = getEmblem(state.faction.name);
  document.getElementById('badge-name').textContent = state.faction.name;

  document.getElementById('connect-prompt').style.display = 'none';
  var card = document.getElementById('identity-card');
  card.style.display = 'block';
  document.getElementById('identity-addr').textContent = state.wallet;
  document.getElementById('identity-color').style.background = state.faction.color;
  document.getElementById('identity-color').style.boxShadow = '0 0 12px ' + state.faction.color;
  document.getElementById('identity-faction').textContent = state.faction.name;
  document.getElementById('identity-faction').style.color = state.faction.color;
  document.getElementById('identity-emblem').textContent = getEmblem(state.faction.name);

  var factionCard = document.getElementById('faction-card');
  factionCard.style.borderColor = state.faction.color;
  factionCard.style.background = 'linear-gradient(135deg, ' + state.faction.color + '11, transparent)';

  document.getElementById('session-counter').style.display = 'flex';

  // Mobile identity sync
  var mIdentity = document.getElementById('mobile-identity');
  if (mIdentity) {
    mIdentity.style.display = 'block';
    document.getElementById('m-identity-addr').textContent = state.wallet;
    document.getElementById('m-identity-color').style.background = state.faction.color;
    document.getElementById('m-identity-color').style.boxShadow = '0 0 12px ' + state.faction.color;
    document.getElementById('m-identity-faction').textContent = state.faction.name;
    document.getElementById('m-identity-faction').style.color = state.faction.color;
    document.getElementById('m-identity-emblem').textContent = getEmblem(state.faction.name);
    var mCard = document.getElementById('m-faction-card');
    mCard.style.borderColor = state.faction.color;
    mCard.style.background = 'linear-gradient(135deg, ' + state.faction.color + '11, transparent)';
  }

  state.color = state.faction.color;
  pickColor(state.color);
  document.getElementById('color-custom').value = state.color;
  updateBtnColor(state.color);
  updatePlaceButton();
}

if (window.ethereum) {
  window.ethereum.on('accountsChanged', function(accts) {
    if (accts.length) {
      state.wallet = accts[0];
      state.faction = getFactionForAddress(state.wallet);
      updateWalletUI();
    } else { location.reload(); }
  });
}

var PALETTE = [
  '#ffffff','#c0c0c0','#808080','#000000',
  '#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899',
  '#7c2d12','#854d0e','#166534','#1e3a5f',
];
(function initSwatches() {
  var container = document.getElementById('color-swatches');
  PALETTE.forEach(function(c) {
    var btn = document.createElement('button');
    btn.className = 'color-swatch';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.addEventListener('click', function() { pickColor(c); });
    container.appendChild(btn);
  });
})();

function isLight(hex) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 150;
}

function updateBtnColor(c) {
  var btn = document.getElementById('place-btn');
  btn.style.background = c;
  btn.style.color = isLight(c) ? '#000' : '#fff';
  var mBtn = document.getElementById('mobile-place-btn');
  if (mBtn) { mBtn.style.background = c; mBtn.style.color = isLight(c) ? '#000' : '#fff'; }
}

function pickColor(c) {
  state.color = c;
  updateBtnColor(c);
  var inPalette = PALETTE.includes(c);
  document.querySelectorAll('.color-swatch').forEach(function(s) {
    s.classList.toggle('active', s.dataset.color === c);
  });
  var custom = document.getElementById('color-custom');
  if (!inPalette) { custom.value = c; custom.classList.add('active'); }
  else { custom.classList.remove('active'); }
  var mCustom = document.getElementById('mobile-color-custom');
  if (mCustom) {
    if (!inPalette) { mCustom.value = c; mCustom.classList.add('active'); }
    else { mCustom.classList.remove('active'); }
  }
}

document.getElementById('color-custom').addEventListener('input', function(e) {
  state.color = e.target.value;
  updateBtnColor(state.color);
  document.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('color-custom').classList.add('active');
});

// == Canvas ==

function render() {
  var w = wrap.clientWidth, h = wrap.clientHeight;
  var sz = state.zoom, total = CANVAS_SIZE * sz;
  canvas.style.width = total + 'px';
  canvas.style.height = total + 'px';
  canvas.style.left = (w/2 + state.panX - total/2) + 'px';
  canvas.style.top = (h/2 + state.panY - total/2) + 'px';
  var sel = document.getElementById('selected-pixel');
  if (state.selectedX !== null) {
    sel.style.display = 'block';
    sel.style.width = sz + 'px'; sel.style.height = sz + 'px';
    sel.style.left = (w/2 + state.panX - total/2 + state.selectedX * sz) + 'px';
    sel.style.top = (h/2 + state.panY - total/2 + state.selectedY * sz) + 'px';
  } else { sel.style.display = 'none'; }
}

function drawPixels() {
  ctx.fillStyle = '#080d18';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (state.zoom >= 8) {
    ctx.strokeStyle = '#141e30'; ctx.lineWidth = 0.5 / state.zoom;
    for (var i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_SIZE,i); ctx.stroke();
    }
  }
  state.pixels.forEach(function(p) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 1, 1);
  });
}

// == Pan/Zoom ==

wrap.addEventListener('mousedown', function(e) {
  if (e.button === 1 || e.button === 2 || e.shiftKey) {
    state.dragging = true;
    state.dragStartX = e.clientX; state.dragStartY = e.clientY;
    state.dragStartPanX = state.panX; state.dragStartPanY = state.panY;
    wrap.style.cursor = 'grabbing'; e.preventDefault();
  }
});
wrap.addEventListener('mousemove', function(e) {
  if (state.dragging) {
    state.panX = state.dragStartPanX + (e.clientX - state.dragStartX);
    state.panY = state.dragStartPanY + (e.clientY - state.dragStartY);
    render(); return;
  }
  var r = canvas.getBoundingClientRect();
  var px = Math.floor((e.clientX - r.left) / state.zoom);
  var py = Math.floor((e.clientY - r.top) / state.zoom);
  if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE)
    document.getElementById('coords').textContent = '(' + px + ', ' + py + ')';
});
wrap.addEventListener('mouseup', function() {
  if (state.dragging) { state.dragging = false; wrap.style.cursor = 'crosshair'; }
});
wrap.addEventListener('click', function(e) {
  if (state.dragging) return;
  var r = canvas.getBoundingClientRect();
  var px = Math.floor((e.clientX - r.left) / state.zoom);
  var py = Math.floor((e.clientY - r.top) / state.zoom);
  if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) selectPixel(px, py);
});
wrap.addEventListener('wheel', function(e) {
  e.preventDefault();
  var old = state.zoom;
  state.zoom = e.deltaY < 0 ? Math.min(40, state.zoom*1.2) : Math.max(0.5, state.zoom/1.2);
  var r = wrap.getBoundingClientRect();
  var mx = e.clientX - r.left - r.width/2, my = e.clientY - r.top - r.height/2;
  var ratio = state.zoom / old;
  state.panX = mx - ratio*(mx - state.panX);
  state.panY = my - ratio*(my - state.panY);
  render();
}, { passive: false });

function zoomIn() { state.zoom = Math.min(40, state.zoom*1.5); render(); }
function zoomOut() { state.zoom = Math.max(0.5, state.zoom/1.5); render(); }
function resetView() { state.zoom = 2; state.panX = 0; state.panY = 0; render(); }

// == Pixel Selection ==

async function selectPixel(x, y) {
  state.selectedX = x; state.selectedY = y;
  document.getElementById('info-pos').textContent = '(' + x + ', ' + y + ')';
  var mPos = document.getElementById('m-info-pos');
  if (mPos) mPos.textContent = '(' + x + ', ' + y + ')';
  render();
  try {
    var res = await fetch('/api/pixel/' + x + '/' + y);
    var data = await res.json();
    if (data.pixel) {
      state.pixelOwned = true;
      var ownerText = data.pixel.owner ? data.pixel.owner.slice(0,8) + '..' : 'unclaimed';
      var factionText = data.pixel.faction || '--';
      document.getElementById('info-owner').textContent = ownerText;
      document.getElementById('info-faction').textContent = factionText;
      document.getElementById('info-price').textContent = data.price;
      document.getElementById('info-price').className = 'value overwrite-value';
      // Mobile sync
      var mo = document.getElementById('m-info-owner'); if (mo) mo.textContent = ownerText;
      var mf = document.getElementById('m-info-faction'); if (mf) mf.textContent = factionText;
      var mp = document.getElementById('m-info-price'); if (mp) { mp.textContent = data.price; mp.className = 'value overwrite-value'; }
    } else {
      state.pixelOwned = false;
      document.getElementById('info-owner').textContent = 'unclaimed';
      document.getElementById('info-faction').textContent = '--';
      document.getElementById('info-price').textContent = data.price;
      document.getElementById('info-price').className = 'value price-value';
      // Mobile sync
      var mo = document.getElementById('m-info-owner'); if (mo) mo.textContent = 'unclaimed';
      var mf = document.getElementById('m-info-faction'); if (mf) mf.textContent = '--';
      var mp = document.getElementById('m-info-price'); if (mp) { mp.textContent = data.price; mp.className = 'value price-value'; }
    }
  } catch (e) { console.error(e); }
  updatePlaceButton();
}

function updatePlaceButton() {
  var btn = document.getElementById('place-btn');
  var mBtn = document.getElementById('mobile-place-btn');
  if (!state.wallet) {
    btn.textContent = 'Connect to Claim';
    btn.disabled = true;
    btn.style.color = '';
    if (mBtn) { mBtn.textContent = 'Connect to Claim'; mBtn.disabled = true; mBtn.style.color = ''; }
    return;
  }
  if (state.selectedX !== null) {
    var verb = state.pixelOwned ? 'Capture' : 'Claim';
    var label = verb + ' Pixel  ' + document.getElementById('info-price').textContent;
    btn.textContent = label;
    btn.disabled = false;
    btn.style.color = isLight(state.color) ? '#000' : '#fff';
    if (mBtn) { mBtn.textContent = label; mBtn.disabled = false; mBtn.style.color = isLight(state.color) ? '#000' : '#fff'; }
  } else {
    btn.textContent = 'Select Target';
    btn.disabled = true;
    btn.style.color = '';
    if (mBtn) { mBtn.textContent = 'Select Target'; mBtn.disabled = true; mBtn.style.color = ''; }
  }
}

// == x402 Payment Flow ==

var lastUsedNonce = null;

async function getPermitNonce(owner) {
  var data = '0x7ecebe00' + owner.slice(2).padStart(64, '0');
  var result = await window.ethereum.request({
    method: 'eth_call',
    params: [{ to: TOKEN_ADDRESS, data: data }, 'latest'],
  });
  var onChainNonce = BigInt(result);
  // If we recently used a nonce that the chain hasn't confirmed yet, increment past it
  if (lastUsedNonce !== null && lastUsedNonce >= onChainNonce) {
    onChainNonce = lastUsedNonce + 1n;
  }
  lastUsedNonce = onChainNonce;
  return onChainNonce.toString();
}

async function signAndPlacePixel() {
  if (!state.wallet || state.selectedX === null || state.placing) return;
  var btn = document.getElementById('place-btn');
  btn.disabled = true; btn.textContent = 'Acquiring...';
  state.placing = true;

  try {
    // 1) POST without payment -> get 402
    var initRes = await fetch('/api/pixel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x: state.selectedX, y: state.selectedY,
        color: state.color, faction: state.faction.name,
      }),
    });

    if (initRes.status !== 402) {
      var d = await initRes.json();
      if (d.success) { onPixelPlaced(d); return; }
      showToast(d.error || 'Unexpected response', 'error'); return;
    }

    var payReq = await initRes.json();
    var accept = payReq.accepts[0];
    btn.textContent = 'Sign in Wallet...';

    // 2) Build ERC-2612 Permit
    var nonce = await getPermitNonce(state.wallet);
    var deadline = Math.floor(Date.now() / 1000) + (accept.maxTimeoutSeconds || 300);

    var permitTypes = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    var permitDomain = {
      name: accept.extra.name,
      version: accept.extra.version,
      chainId: RADIUS_CHAIN_ID,
      verifyingContract: accept.asset,
    };

    var typedData = {
      types: { EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ], Permit: permitTypes.Permit },
      primaryType: 'Permit',
      domain: permitDomain,
      message: {
        owner: state.wallet,
        spender: FACILITATOR_ADDRESS,
        value: accept.maxAmountRequired,
        nonce: nonce,
        deadline: String(deadline),
      },
    };

    // 3) Sign
    var signature = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [state.wallet, JSON.stringify(typedData)],
    });

    btn.textContent = 'Claiming...';

    // 4) Build payment payload and retry
    var paymentPayload = {
      x402Version: 2,
      resource: accept.resource,
      accepted: accept,
      payload: {
        signature: signature,
        authorization: {
          from: state.wallet,
          to: FACILITATOR_ADDRESS,
          value: accept.maxAmountRequired,
          validAfter: '0',
          validBefore: String(deadline),
          nonce: nonce,
        },
      },
    };

    var encoded = btoa(JSON.stringify(paymentPayload));

    var paidRes = await fetch('/api/pixel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'PAYMENT-SIGNATURE': encoded },
      body: JSON.stringify({
        x: state.selectedX, y: state.selectedY,
        color: state.color, faction: state.faction.name,
      }),
    });

    var result = await paidRes.json();
    if (result.success) { onPixelPlaced(result); }
    else { showToast(result.error || 'Payment failed', 'error'); }
  } catch (e) {
    if (e.code === 4001) showToast('Payment cancelled', 'error');
    else { showToast('Error: ' + (e.message || e), 'error'); console.error(e); }
  } finally {
    state.placing = false; btn.disabled = false; updatePlaceButton();
  }
}

function onPixelPlaced(data) {
  state.pixels.set(state.selectedX + ',' + state.selectedY, {
    x: state.selectedX, y: state.selectedY,
    color: state.color,
    owner: data.pixel.owner, faction: state.faction.name,
  });
  drawPixels(); render();
  selectPixel(state.selectedX, state.selectedY);
  updateStats(data.stats); updateLeaderboard(data.factions);
  showToast(data.message, 'success');

  // Gamification
  sessionPixels++;
  var sv = document.getElementById('session-value');
  if (sv) sv.textContent = sessionPixels;
  showBurstEffect(state.selectedX, state.selectedY, state.color);
}

function showBurstEffect(x, y, color) {
  var w = wrap.clientWidth, h = wrap.clientHeight;
  var total = CANVAS_SIZE * state.zoom;
  var px = w/2 + state.panX - total/2 + x * state.zoom + state.zoom/2;
  var py = h/2 + state.panY - total/2 + y * state.zoom + state.zoom/2;

  var burst = document.createElement('div');
  burst.className = 'pixel-burst';
  burst.style.left = px + 'px';
  burst.style.top = py + 'px';
  burst.style.borderColor = color;
  burst.style.boxShadow = '0 0 20px ' + color + ', 0 0 40px ' + color;
  wrap.appendChild(burst);

  var score = document.createElement('div');
  score.className = 'score-popup';
  score.textContent = '+1';
  score.style.left = px + 'px';
  score.style.top = (py - 8) + 'px';
  score.style.color = color;
  wrap.appendChild(score);

  setTimeout(function() { burst.remove(); score.remove(); }, 1000);
}

document.getElementById('place-btn').addEventListener('click', signAndPlacePixel);

// == Toast ==
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + (type || '');
  setTimeout(function() { t.className = 'toast'; }, 4000);
}

// == Territory Calculation ==

function calculateTerritory() {
  var counts = {};
  var total = 0;
  state.pixels.forEach(function(p) {
    if (p.faction) {
      counts[p.faction] = (counts[p.faction] || 0) + 1;
      total++;
    }
  });
  return { counts: counts, total: total };
}

// == Stats / Leaderboard / Activity ==

function updateStats(s) {
  if (!s) return;
  document.getElementById('stat-active').textContent = s.active_pixels.toLocaleString();
  document.getElementById('stat-total').textContent = s.total_pixels_placed.toLocaleString();
  document.getElementById('stat-spent').textContent = '$' + (s.total_spent / 100).toFixed(4);

  // Mobile compact stats
  var mc1 = document.getElementById('stat-compact-placed');
  var mc2 = document.getElementById('stat-compact-spent');
  if (mc1) mc1.textContent = s.total_pixels_placed.toLocaleString();
  if (mc2) mc2.textContent = '$' + (s.total_spent / 100).toFixed(4);

  // Flash effect on update
  var vals = document.querySelectorAll('.stat-value');
  vals.forEach(function(v) {
    v.classList.add('flash');
    setTimeout(function() { v.classList.remove('flash'); }, 300);
  });
}

function updateLeaderboard(factions) {
  if (!factions || !factions.length) return;
  var el = document.getElementById('leaderboard');
  var fc = {}; FACTIONS.forEach(function(f) { fc[f.name] = f.color; });
  var territory = calculateTerritory();
  var medals = ['\\uD83E\\uDD47', '\\uD83E\\uDD48', '\\uD83E\\uDD49'];

  var h = '<h3>Territory Control</h3>';
  factions.forEach(function(f, i) {
    var c = fc[f.name] || '#888';
    var spent = (f.total_spent_cents || 0) / 100;
    var pixelCount = territory.counts[f.name] || 0;
    var pct = territory.total > 0 ? (pixelCount / territory.total * 100) : 0;
    var medal = i < 3 ? medals[i] : String(i + 1);

    h += '<div class="faction-entry">'
      + '<span class="faction-rank">' + medal + '</span>'
      + '<span class="faction-dot" style="background:' + c + ';box-shadow:0 0 4px ' + c + '"></span>'
      + '<span class="faction-name">' + f.name + '</span>'
      + '<span class="faction-territory">' + pct.toFixed(1) + '%</span>'
      + '<span class="faction-spent">$' + spent.toFixed(4) + '</span>'
      + '</div>'
      + '<div class="faction-bar"><div class="faction-bar-fill" style="width:' + pct + '%;background:' + c + ';box-shadow:0 0 6px ' + c + '"></div></div>';
  });
  el.innerHTML = h;
  var mEl = document.getElementById('mobile-leaderboard');
  if (mEl) mEl.innerHTML = h;
}

function updateActivity(recent) {
  if (!recent || !recent.length) return;
  var el = document.getElementById('activity');
  var h = '<h3>Battle Log</h3>';
  recent.slice(0, 15).forEach(function(p) {
    var addr = p.owner ? p.owner.slice(0,6) + '..' : '??';
    var f = p.faction ? ' [' + p.faction + ']' : '';
    var t = timeAgo(new Date(p.placed_at + 'Z'));
    h += '<div class="activity-item">'
      + '<span class="color-dot" style="background:' + p.color + ';box-shadow:0 0 3px ' + p.color + '"></span>'
      + '<span>' + addr + f + ' (' + p.x + ',' + p.y + ')</span>'
      + '<span class="time-ago">' + t + '</span></div>';
  });
  el.innerHTML = h;
  var mEl = document.getElementById('mobile-activity');
  if (mEl) mEl.innerHTML = h;
}

function timeAgo(d) {
  var s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

// == Mobile Bottom Sheet ==

var mobileSheet = document.getElementById('mobile-sheet');
var sheetHandle = document.getElementById('sheet-handle-area');
var SNAP_COLLAPSED = 0;
var SNAP_HALF = 1;
var SNAP_FULL = 2;
var sheetSnap = SNAP_COLLAPSED;
var sheetDragging = false;
var sheetStartY = 0;
var sheetStartTranslate = 0;
var sheetCurrentTranslate = 0;

function getSheetHeight() {
  return mobileSheet.offsetHeight;
}

function getSnapPositions() {
  var h = getSheetHeight();
  var vh = window.innerHeight;
  // collapsed: show only handle + collapsed content (~120px)
  var collapsed = h - 120;
  // half: 50vh
  var half = h - Math.min(vh * 0.5, h);
  // full: 15vh margin from top
  var full = Math.max(h - vh * 0.85, 0);
  return [collapsed, half, full];
}

function setSheetPosition(translateY, animate) {
  if (animate) {
    mobileSheet.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';
  } else {
    mobileSheet.style.transition = 'none';
  }
  mobileSheet.style.transform = 'translateY(' + translateY + 'px)';
  sheetCurrentTranslate = translateY;
}

function snapSheet(snapIndex) {
  var positions = getSnapPositions();
  sheetSnap = snapIndex;
  setSheetPosition(positions[snapIndex], true);
  // Toggle overflow for scrollable content when fully open
  var fullContent = document.getElementById('sheet-full');
  if (fullContent) {
    fullContent.style.overflowY = snapIndex === SNAP_FULL ? 'auto' : 'hidden';
  }
}

function getSheetVisibleHeight() {
  // Calculate how many pixels of the sheet are visible for the current snap state
  var positions = getSnapPositions();
  var translateY = positions[sheetSnap];
  var sheetH = getSheetHeight();
  return sheetH - translateY;
}

function ensurePixelVisible() {
  if (window.innerWidth > 768 || state.selectedX === null) return;
  var h = wrap.clientHeight;
  var sz = state.zoom, total = CANVAS_SIZE * sz;
  var pixelY = h / 2 + state.panY - total / 2 + state.selectedY * sz + sz / 2;
  var sheetVisible = getSheetVisibleHeight();
  var padding = 48;
  var visibleTop = padding;
  var visibleBottom = h - sheetVisible - padding;
  var visibleCenter = (visibleTop + visibleBottom) / 2;
  var dy = 0;
  if (pixelY > visibleBottom) {
    dy = -(pixelY - visibleCenter);
  } else if (pixelY < visibleTop) {
    dy = visibleCenter - pixelY;
  }
  if (dy !== 0) {
    state.panY += dy;
    // Animate the pan with CSS transition
    var dur = '0.35s';
    var ease = 'cubic-bezier(0.32, 0.72, 0, 1)';
    canvas.style.transition = 'top ' + dur + ' ' + ease + ', left ' + dur + ' ' + ease;
    var sel = document.getElementById('selected-pixel');
    sel.style.transition = 'top ' + dur + ' ' + ease + ', left ' + dur + ' ' + ease;
    render();
    // Remove transition after animation completes so dragging stays instant
    setTimeout(function() {
      canvas.style.transition = 'none';
      sel.style.transition = 'none';
    }, 370);
  }
}

function initSheet() {
  if (window.innerWidth > 768) return;
  var positions = getSnapPositions();
  setSheetPosition(positions[SNAP_COLLAPSED], false);
  // Hide expanded/full sections via translateY clipping
  var expanded = document.getElementById('sheet-expanded');
  var full = document.getElementById('sheet-full');
  if (full) full.style.overflowY = 'hidden';
}

// Sheet drag handlers
sheetHandle.addEventListener('touchstart', function(e) {
  if (window.innerWidth > 768) return;
  sheetDragging = true;
  sheetStartY = e.touches[0].clientY;
  sheetStartTranslate = sheetCurrentTranslate;
  mobileSheet.style.transition = 'none';
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (!sheetDragging) return;
  var dy = e.touches[0].clientY - sheetStartY;
  var newTranslate = sheetStartTranslate + dy;
  var positions = getSnapPositions();
  // Clamp between full open and collapsed
  newTranslate = Math.max(positions[SNAP_FULL], Math.min(positions[SNAP_COLLAPSED], newTranslate));
  setSheetPosition(newTranslate, false);
}, { passive: true });

document.addEventListener('touchend', function() {
  if (!sheetDragging) return;
  sheetDragging = false;
  // Find nearest snap point
  var positions = getSnapPositions();
  var velocity = sheetCurrentTranslate - sheetStartTranslate;
  var closest = 0;
  var minDist = Infinity;
  // Bias toward the direction of the drag
  for (var i = 0; i < positions.length; i++) {
    var dist = Math.abs(sheetCurrentTranslate - positions[i]);
    // Apply velocity bias
    if (velocity < -30 && i > sheetSnap) dist -= 80;
    if (velocity > 30 && i < sheetSnap) dist -= 80;
    if (dist < minDist) { minDist = dist; closest = i; }
  }
  snapSheet(closest);
});

// Tap handle to toggle collapsed/half
sheetHandle.addEventListener('click', function() {
  if (window.innerWidth > 768) return;
  if (sheetSnap === SNAP_COLLAPSED) snapSheet(SNAP_HALF);
  else snapSheet(SNAP_COLLAPSED);
});

// Init on load and resize
window.addEventListener('resize', function() {
  if (window.innerWidth <= 768) {
    initSheet();
  }
});

// Init mobile color swatches
(function initMobileSwatches() {
  var container = document.getElementById('mobile-color-row');
  if (!container) return;
  PALETTE.forEach(function(c) {
    var btn = document.createElement('button');
    btn.className = 'color-swatch';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.addEventListener('click', function() { pickColor(c); });
    container.appendChild(btn);
  });
  var custom = document.createElement('input');
  custom.type = 'color';
  custom.id = 'mobile-color-custom';
  custom.className = 'color-custom-inline';
  custom.value = '#ffffff';
  custom.addEventListener('input', function(e) {
    state.color = e.target.value;
    updateBtnColor(state.color);
    document.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
    custom.classList.add('active');
    document.getElementById('color-custom').classList.add('active');
    document.getElementById('color-custom').value = e.target.value;
  });
  container.appendChild(custom);
})();

// Mobile place button
document.getElementById('mobile-place-btn').addEventListener('click', signAndPlacePixel);

// == Canvas Touch Events ==

var touchState = { startX: 0, startY: 0, startPanX: 0, startPanY: 0, moved: false, pinching: false, pinchDist: 0, pinchZoom: 0 };

function getTouchDist(t1, t2) {
  var dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

wrap.addEventListener('touchstart', function(e) {
  if (e.target.closest('.mobile-sheet') || e.target.closest('.zoom-btn')) return;
  if (e.touches.length === 2) {
    // Pinch start
    touchState.pinching = true;
    touchState.pinchDist = getTouchDist(e.touches[0], e.touches[1]);
    touchState.pinchZoom = state.zoom;
    e.preventDefault();
  } else if (e.touches.length === 1) {
    touchState.startX = e.touches[0].clientX;
    touchState.startY = e.touches[0].clientY;
    touchState.startPanX = state.panX;
    touchState.startPanY = state.panY;
    touchState.moved = false;
    touchState.pinching = false;
  }
}, { passive: false });

wrap.addEventListener('touchmove', function(e) {
  if (e.target.closest('.mobile-sheet')) return;
  if (touchState.pinching && e.touches.length === 2) {
    var dist = getTouchDist(e.touches[0], e.touches[1]);
    var scale = dist / touchState.pinchDist;
    state.zoom = Math.max(0.5, Math.min(40, touchState.pinchZoom * scale));
    render();
    e.preventDefault();
    return;
  }
  if (e.touches.length === 1 && !touchState.pinching) {
    var dx = e.touches[0].clientX - touchState.startX;
    var dy = e.touches[0].clientY - touchState.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      touchState.moved = true;
    }
    if (touchState.moved) {
      state.panX = touchState.startPanX + dx;
      state.panY = touchState.startPanY + dy;
      render();
      e.preventDefault();
    }
  }
}, { passive: false });

wrap.addEventListener('touchend', function(e) {
  if (e.target.closest('.mobile-sheet')) return;
  if (touchState.pinching) {
    touchState.pinching = false;
    return;
  }
  if (!touchState.moved && e.changedTouches.length) {
    // Tap — select pixel
    var touch = e.changedTouches[0];
    var r = canvas.getBoundingClientRect();
    var px = Math.floor((touch.clientX - r.left) / state.zoom);
    var py = Math.floor((touch.clientY - r.top) / state.zoom);
    if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
      selectPixel(px, py);
      if (window.innerWidth <= 768) {
        // Open sheet if collapsed
        if (sheetSnap === SNAP_COLLAPSED) {
          snapSheet(SNAP_HALF);
        }
        // Pan canvas so pixel stays visible above the sheet
        // Use requestAnimationFrame to let the snap position settle
        requestAnimationFrame(function() {
          ensurePixelVisible();
        });
      }
    }
  }
}, { passive: true });

// == Load & Poll ==

async function loadCanvas() {
  try {
    var res = await fetch('/api/canvas');
    var data = await res.json();
    state.pixels.clear();
    data.pixels.forEach(function(p) { state.pixels.set(p.x + ',' + p.y, p); });
    drawPixels(); updateStats(data.stats); updateLeaderboard(data.factions);
    var a = await fetch('/api/activity?limit=20');
    updateActivity((await a.json()).recent);
  } catch (e) { console.error('Failed to load canvas:', e); }
  document.getElementById('loading').style.display = 'none';
  render();
}

async function pollUpdates() {
  try {
    var res = await fetch('/api/canvas');
    var data = await res.json();
    state.pixels.clear();
    data.pixels.forEach(function(p) { state.pixels.set(p.x + ',' + p.y, p); });
    drawPixels(); render(); updateStats(data.stats); updateLeaderboard(data.factions);
  } catch (e) {}
}

loadCanvas();
initSheet();
setInterval(pollUpdates, 5000);
setInterval(async function() {
  try { var r = await fetch('/api/activity?limit=20'); updateActivity((await r.json()).recent); } catch(e) {}
}, 10000);

window.addEventListener('resize', render);
wrap.addEventListener('contextmenu', function(e) { e.preventDefault(); });
</script>
</body>
</html>`;
}
