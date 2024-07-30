const otplib = require('otplib');
const blessed = require('blessed');

// 從命令行參數獲取 secret
const secret = process.argv[2];

if (!secret) {
  console.error('請提供 secret 參數');
  process.exit(1);
}

console.log('使用的密鑰:', secret);

// 創建 Blessed 螢幕
const screen = blessed.screen({
  smartCSR: true,
  title: 'TOTP 驗證碼生成器',
  fullUnicode: true,
  forceUnicode: true
});

// 創建一個盒子來顯示驗證碼和時間
const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: '當前驗證碼:\n\n',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    },
    bold: true
  }
});

// 將盒子添加到螢幕
screen.append(box);

// 計算下一次更新時間
const getNextUpdateTime = () => {
  const currentTime = new Date();
  const seconds = currentTime.getSeconds();
  const nextUpdateTime = new Date(currentTime.getTime());

  if (seconds >= 30) {
    nextUpdateTime.setMinutes(currentTime.getMinutes() + 1);
    nextUpdateTime.setSeconds(0);
  } else {
    nextUpdateTime.setSeconds(30);
  }

  return nextUpdateTime;
};

let token = otplib.authenticator.generate(secret);
let nextUpdateTime = getNextUpdateTime();

// 更新顯示內容的函數
const updateDisplay = () => {
  const currentTime = new Date();
  const timeDiff = Math.round((nextUpdateTime - currentTime) / 1000); // 剩餘秒數

  // 每次檢查下一次更新秒數是否為 0 或小於 0，並重新生成驗證碼
  if (timeDiff <= 0) {
    token = otplib.authenticator.generate(secret);
    nextUpdateTime = getNextUpdateTime();
  }

  box.setContent(`當前驗證碼:\n\n{bold}{yellow-fg}${token}{/yellow-fg}{/bold}\n\n` +
                 `系統時間: {bold}${currentTime.toLocaleTimeString()}{/bold}\n` +
                 `下一次更新: {bold}${nextUpdateTime.toLocaleTimeString()}{/bold}\n` +
                 `距離下一次更新: {bold}${timeDiff} 秒{/bold}`);
  screen.render();
};

// 每秒更新一次系統時間和顯示內容
setInterval(updateDisplay, 1000);

// 初次顯示驗證碼和時間
updateDisplay();

// 退出程式的按鍵綁定
screen.key(['escape', 'q', 'C-c'], (ch, key) => {
  return process.exit(0);
});

screen.render();

