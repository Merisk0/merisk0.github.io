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
      lightbox.setAttribute('role','dialog');
      lightbox.setAttribute('aria-modal','true');
      lightbox.setAttribute('aria-label','图片预览');
      lightbox.innerHTML='<button class="lightbox-close" type="button" aria-label="关闭图片预览">×</button><img alt="">';
      document.body.append(lightbox);
      const lightboxImage=lightbox.querySelector('img');
      const closeButton=lightbox.querySelector('.lightbox-close');
      let lastFocused=null;
      const closeLightbox=()=>{
        lightbox.classList.remove('is-open');
        if(lastFocused)lastFocused.focus();
      };
      articleImages.forEach(image=>image.addEventListener('click',()=>{
        lastFocused=document.activeElement;
        lightboxImage.src=image.currentSrc||image.src;
        lightboxImage.alt=image.alt||'';
        lightbox.classList.add('is-open');
        closeButton.focus();
      }));
      lightbox.addEventListener('click',event=>{
        if(event.target===lightbox||event.target.classList.contains('lightbox-close'))closeLightbox();
      });
      lightbox.addEventListener('keydown',event=>{
        if(event.key==='Tab'){event.preventDefault();closeButton.focus();}
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

    const searchOverlay=document.createElement('div');
    searchOverlay.className='search-overlay';
    searchOverlay.hidden=true;
    searchOverlay.innerHTML='<div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="site-search-title"><div class="search-head"><h2 id="site-search-title">搜索文章</h2><button class="search-close" type="button" data-search-close aria-label="关闭搜索">×</button></div><input id="site-search-input" type="search" placeholder="搜索标题、摘要或标签…" autocomplete="off"><div class="search-results" id="site-search-results" aria-live="polite"></div></div>';
    document.body.append(searchOverlay);

    const searchInput=searchOverlay.querySelector('#site-search-input');
    const searchResults=searchOverlay.querySelector('#site-search-results');
    let searchDataPromise=null;
    const getSearchData=()=>{
      if(!searchDataPromise)searchDataPromise=fetch('/search.json').then(response=>response.json()).catch(()=>[]);
      return searchDataPromise;
    };
    const escapeSearchValue=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const renderSearchResults=()=>{
      const query=searchInput.value.trim().toLowerCase();
      if(!query){
        searchResults.innerHTML='<div class="search-hint">输入标题、摘要或标签开始搜索</div>';
        return;
      }
      getSearchData().then(posts=>{
        const matches=posts.filter(post=>{
          const haystack=[post.title,post.summary,(post.tags||[]).join(' ')].join(' ').toLowerCase();
          return haystack.includes(query);
        }).slice(0,8);
        if(!matches.length){
          searchResults.innerHTML='<div class="search-hint">没有找到匹配的文章</div>';
          return;
        }
        searchResults.innerHTML=matches.map(post=>'<a class="search-result" href="'+escapeSearchValue(post.url)+'"><strong>'+escapeSearchValue(post.title)+'</strong><small>'+escapeSearchValue(post.date)+'</small><p>'+escapeSearchValue(post.summary)+'</p><span class="search-result-tags">'+(post.tags||[]).map(tag=>'<span>#'+escapeSearchValue(tag)+'</span>').join('')+'</span></a>').join('');
      });
    };
    const openSearch=()=>{
      searchOverlay.hidden=false;
      document.body.classList.add('search-open');
      searchInput.focus();
      renderSearchResults();
    };
    const closeSearch=()=>{
      searchOverlay.hidden=true;
      document.body.classList.remove('search-open');
    };

    const navLinks=document.querySelector('.navlinks');
    if(navLinks&&!navLinks.querySelector('[data-search-open]')){
      const searchButton=document.createElement('button');
      searchButton.className='nav-search';
      searchButton.type='button';
      searchButton.dataset.searchOpen='';
      searchButton.textContent='搜索';
      searchButton.addEventListener('click',openSearch);
      const themeButton=navLinks.querySelector('[data-theme-toggle]');
      navLinks.insertBefore(searchButton,themeButton||null);
    }
    searchOverlay.addEventListener('click',event=>{
      if(event.target===searchOverlay||event.target.closest('[data-search-close]'))closeSearch();
    });
    searchInput.addEventListener('input',renderSearchResults);
    document.addEventListener('keydown',event=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        searchOverlay.hidden?openSearch():closeSearch();
      }
      if(event.key==='Escape'&&!searchOverlay.hidden)closeSearch();
    });

    if('serviceWorker' in navigator){
      const isLocal=['localhost','127.0.0.1'].includes(location.hostname);
      if(isLocal){
        navigator.serviceWorker.getRegistrations().then(registrations=>registrations.forEach(registration=>registration.unregister()));
      }else{
        window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js',{updateViaCache:'none'}).catch(()=>{}));
        let refreshing=false;
        navigator.serviceWorker.addEventListener('controllerchange',()=>{
          if(refreshing)return;
          refreshing=true;
          window.location.reload();
        });
      }
    }

    const readingProgress=document.getElementById('reading-progress-bar');
    if(readingProgress){
      const updateReadingProgress=()=>{
        const max=document.documentElement.scrollHeight-window.innerHeight;
        const percent=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;
        readingProgress.style.width=percent+'%';
      };
      window.addEventListener('scroll',updateReadingProgress,{passive:true});
      window.addEventListener('resize',updateReadingProgress);
      updateReadingProgress();
    }

    document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=>{
      const url=window.location.href;
      const title=document.title;
      const type=button.dataset.share;
      if(type==='copy'){
        try{await navigator.clipboard.writeText(url);button.textContent='已复制';setTimeout(()=>button.textContent='复制链接',1400);}catch{}
      }else if(type==='native'&&navigator.share){
        try{await navigator.share({title,url});}catch{}
      }else if(type==='native'){
        try{await navigator.clipboard.writeText(url);button.textContent='已复制';setTimeout(()=>button.textContent='分享',1400);}catch{}
      }else if(type==='qq'){
        window.open('https://connect.qq.com/widget/shareqq/index.html?url='+encodeURIComponent(url)+'&title='+encodeURIComponent(title),'_blank','noopener');
      }
    }));

    const githubStars=document.querySelector('[data-github-stars]');
    if(githubStars){
      const repo='Merisk0/merisk0.github.io';
      fetch('https://api.github.com/repos/'+repo).then(response=>response.json()).then(data=>{
        const set=(name,value)=>{const node=document.querySelector('[data-github-'+name+']');if(node)node.textContent=value;};
        if(typeof data.stargazers_count==='number')set('stars',data.stargazers_count);
        if(typeof data.forks_count==='number')set('forks',data.forks_count);
        if(typeof data.open_issues_count==='number')set('issues',data.open_issues_count);
      }).catch(()=>{});
      fetch('https://api.github.com/repos/'+repo+'/commits?per_page=1').then(response=>{
        const link=response.headers.get('link')||'';
        const match=link.match(/[?&]page=(\d+)>; rel="last"/);
        const node=document.querySelector('[data-github-commits]');
        if(node)node.textContent=match?match[1]:'1';
      }).catch(()=>{});
      fetch('https://api.github.com/repos/'+repo+'/commits/main').then(response=>response.json()).then(data=>{
        const node=document.querySelector('[data-github-commit]');
        if(node&&data.commit&&data.commit.committer&&data.commit.committer.date){
          node.textContent=new Date(data.commit.committer.date).toLocaleDateString('zh-CN');
        }
      }).catch(()=>{});
    }

    const tagSearch=document.getElementById('tag-search');
    if(tagSearch){
      const chips=Array.from(document.querySelectorAll('.tag-chip'));
      const sections=Array.from(document.querySelectorAll('.tag-section'));
      const updateTags=()=>{
        const query=tagSearch.value.trim().toLowerCase();
        chips.forEach(chip=>{chip.hidden=query&&!(chip.dataset.tagName||'').toLowerCase().includes(query)});
        sections.forEach(section=>{section.hidden=query&&!(section.dataset.tagName||'').toLowerCase().includes(query)});
      };
      tagSearch.addEventListener('input',updateTags);
    }
  });
})();
