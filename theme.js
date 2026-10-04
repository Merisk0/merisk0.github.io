(function(){
  const key='merisk-theme';
  const root=document.documentElement;
  const saved=localStorage.getItem(key);
  if(saved==='dark') root.classList.add('dark-mode');
  function sync(){
    const dark=root.classList.contains('dark-mode');
    localStorage.setItem(key,dark?'dark':'light');
    document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.textContent=dark?'☀':'☾';b.setAttribute('aria-label',dark?'切换到浅色模式':'切换到深色模式')});
  }
  window.toggleTheme=function(){root.classList.toggle('dark-mode');sync()};
  document.addEventListener('DOMContentLoaded',()=>{
    sync();

    const backToTop=document.createElement('button');
    backToTop.className='back-to-top';
    backToTop.type='button';
    backToTop.setAttribute('aria-label','回到页面顶部');
    backToTop.title='回到顶部';
    backToTop.innerHTML='<span aria-hidden="true">↑</span>';

    const updateBackToTop=()=>{
      backToTop.classList.toggle('is-visible',window.scrollY>360);
    };

    backToTop.addEventListener('click',()=>{
      window.scrollTo({
        top:0,
        behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'
      });
    });
    window.addEventListener('scroll',updateBackToTop,{passive:true});
    document.body.append(backToTop);
    updateBackToTop();
  });
})();
