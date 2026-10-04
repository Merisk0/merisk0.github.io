(function(){
  const key='merisk-theme-v2';
  const root=document.documentElement;
  const saved=localStorage.getItem(key);
  if(saved!=='light') root.classList.add('dark-mode');
  function sync(){
    const dark=root.classList.contains('dark-mode');
    localStorage.setItem(key,dark?'dark':'light');
    document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.textContent=dark?'☀':'☾';b.setAttribute('aria-label',dark?'切换到浅色模式':'切换到深色模式')});
  }
  function syncGiscusTheme(){
    const frame=document.querySelector('iframe.giscus-frame');
    if(!frame)return;
    frame.contentWindow.postMessage({giscus:{setConfig:{theme:root.classList.contains('dark-mode')?'dark':'light'}}},'https://giscus.app');
  }
  window.toggleTheme=function(){root.classList.toggle('dark-mode');sync();syncGiscusTheme()};
  document.addEventListener('DOMContentLoaded',()=>{
    sync();
    syncGiscusTheme();

    window.addEventListener('message',event=>{
      if(event.origin==='https://giscus.app'&&event.data&&event.data.giscus)syncGiscusTheme();
    });

    const backStateKey='merisk-back-state-v2';
    const restoreStateKey='merisk-restore-state-v2';

    function pageUrl(value){
      try{return new URL(value,window.location.href).href}catch{return ''}
    }

    function readState(key){
      try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}
    }

    function restoreBackState(){
      const state=readState(restoreStateKey);
      if(!state||pageUrl(state.url)!==pageUrl(window.location.href))return;
      localStorage.removeItem(restoreStateKey);
      const y=Number(state.scrollY)||0;
      const restore=()=>window.scrollTo({top:y,left:0,behavior:'auto'});
      requestAnimationFrame(()=>requestAnimationFrame(restore));
      window.addEventListener('load',()=>window.setTimeout(restore,0),{once:true});
    }

    restoreBackState();

    document.addEventListener('click',event=>{
      const link=event.target.closest?event.target.closest('a[href]'):null;
      if(!link||link.hasAttribute('data-back'))return;
      const target=new URL(link.href,window.location.href);
      const sameDocument=target.pathname===window.location.pathname&&target.search===window.location.search;
      if(target.origin===window.location.origin&&!sameDocument){
        localStorage.setItem(backStateKey,JSON.stringify({url:window.location.href,scrollY:Math.round(window.scrollY)}));
      }
    });

    document.querySelectorAll('[data-back]').forEach(link=>{
      link.addEventListener('click',event=>{
        const fallback=link.dataset.fallback||link.href;
        const stored=readState(backStateKey);
        const referrer=document.referrer;

        if(stored&&pageUrl(stored.url)!==pageUrl(window.location.href)){
          event.preventDefault();
          localStorage.setItem(restoreStateKey,JSON.stringify(stored));
          window.location.href=stored.url;
        }else if(window.history.length>1){
          event.preventDefault();
          window.history.back();
        }else if(referrer){
          event.preventDefault();
          window.location.href=referrer;
        }else{
          window.location.href=fallback;
        }
      });
    });

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
