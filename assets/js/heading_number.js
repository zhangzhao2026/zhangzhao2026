// 如果当前访问的路径中包含 'tags'，在 body 标签上打上标记
if (window.location.pathname.includes('/tags/')) {
  document.body.classList.add('no-heading-numbers');
}