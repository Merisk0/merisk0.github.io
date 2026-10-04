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

    const articleContent=document.querySelector('.article-content');
    if(articleContent){
      const headings=Array.from(articleContent.querySelectorAll('h2,h3,h4'));
      if(headings.length>1){
        const toc=document.createElement('div');
        toc.className='article-toc';
        toc.innerHTML='<div class="article-toc-title">目录</div><ol></ol>';
        articleContent.parentNode.insertBefore(toc,articleContent);
        const list=toc.querySelector('ol');
        headings.forEach((heading,index)=>{
          if(!heading.id)heading.id='section-'+(index+1);
          const item=document.createElement('li');
          item.className='toc-level-'+heading.tagName.slice(1);
          const link=document.createElement('a');
          link.href='#'+heading.id;
          link.textContent=heading.textContent;
          item.append(link);
          list.append(item);
        });
      }
    }


    document.querySelectorAll('.article-content pre').forEach(pre=>{
      if(pre.querySelector('.code-copy'))return;
      const button=document.createElement('button');
      button.className='code-copy';
      button.type='button';
      button.textContent='复制';
      button.addEventListener('click',async()=>{
        const code=pre.querySelector('code');
        const text=code?code.innerText:pre.innerText;
        try{
          await navigator.clipboard.writeText(text);
          button.textContent='已复制';
          window.setTimeout(()=>button.textContent='复制',1400);
        }catch{
          button.textContent='复制失败';
          window.setTimeout(()=>button.textContent='复制',1400);
        }
      });
      pre.append(button);
    });

    const articleImages=Array.from(document.querySelectorAll('.article-content img'));
    if(articleImages.length){
      const lightbox=document.createElement('div');
      lightbox.className='lightbox';
      lightbox.innerHTML='<button class="lightbox-close" type="button" aria-label="关闭图片预览">×</button><img alt="">';
      document.body.append(lightbox);
      const lightboxImage=lightbox.querySelector('img');
      const closeLightbox=()=>lightbox.classList.remove('is-open');
      articleImages.forEach(image=>image.addEventListener('click',()=>{
        lightboxImage.src=image.currentSrc||image.src;
        lightboxImage.alt=image.alt||'';
        lightbox.classList.add('is-open');
      }));
      lightbox.addEventListener('click',event=>{
        if(event.target===lightbox||event.target.classList.contains('lightbox-close'))closeLightbox();
      });
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape')closeLightbox();
      });
    }

    const archiveSearch=document.getElementById('archive-search');
    if(archiveSearch){
      const items=Array.from(document.querySelectorAll('.archive-item'));
      const years=Array.from(document.querySelectorAll('.archive-year'));
      const yearButtons=Array.from(document.querySelectorAll('.year-filter'));
      const count=document.getElementById('archive-count');
      const empty=document.getElementById('archive-empty');
      const reset=document.getElementById('archive-reset');
      const total=items.length;
      let activeYear='all';

      const updateArchive=()=>{
        const query=archiveSearch.value.trim().toLowerCase();
        let visible=0;
        items.forEach(item=>{
          const yearMatches=activeYear==='all'||item.dataset.year===activeYear;
          const queryMatches=!query||(item.dataset.search||'').includes(query);
          const match=yearMatches&&queryMatches;
          item.hidden=!match;
          if(match)visible++;
        });
        years.forEach(year=>{
          year.hidden=!year.querySelector('.archive-item:not([hidden])');
        });
        const filtered=query||activeYear!=='all';
        if(count)count.textContent=filtered?visible+' / '+total+' 篇文章':total+' 篇文章';
        if(empty)empty.hidden=visible!==0;
      };

      yearButtons.forEach(button=>button.addEventListener('click',()=>{
        activeYear=button.dataset.year;
        yearButtons.forEach(item=>item.classList.toggle('active',item===button));
        updateArchive();
      }));

      archiveSearch.addEventListener('input',updateArchive);
      if(reset)reset.addEventListener('click',()=>{
        archiveSearch.value='';
        activeYear='all';
        yearButtons.forEach(item=>item.classList.toggle('active',item.dataset.year==='all'));
        updateArchive();
        archiveSearch.focus();
      });
      document.addEventListener('keydown',event=>{
        if(event.key==='/'&&document.activeElement!==archiveSearch&&!event.metaKey&&!event.ctrlKey){
          event.preventDefault();
          archiveSearch.focus();
        }
      });
    }
  });
})();
