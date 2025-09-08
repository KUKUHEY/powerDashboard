(function flexible(window, document) {
  const designWidth = 1920;  // 设计稿宽度
  const designHeight = 1080; // 设计稿高度

  function setScale() {
    const docEl = document.documentElement;
    const clientWidth = docEl.clientWidth;
    const clientHeight = docEl.clientHeight;

    // 计算缩放比例，取宽高的最小值，保证等比
    const scaleX = clientWidth / designWidth;
    const scaleY = clientHeight / designHeight;
    const scale = Math.min(scaleX, scaleY);

    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
      dashboard.style.transform = `scale(${scale}) translate(-50%, -50%)`;
      dashboard.style.transformOrigin = 'top left';
      dashboard.style.position = 'absolute';
      dashboard.style.top = '50%';
      dashboard.style.left = '50%';
      dashboard.style.width = designWidth + 'px';
      dashboard.style.height = designHeight + 'px';
    }
  }

  window.addEventListener('resize', setScale);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) setScale();
  });

  // 初始化
  setScale();
})(window, document);
