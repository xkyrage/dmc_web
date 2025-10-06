
/* ========== DMC Records — JS Enhancements ========== */
(function(){
  const qs = (s, el=document)=>el.querySelector(s);
  const qsa = (s, el=document)=>[...el.querySelectorAll(s)];

  // ---- 1) Mobile menu toggle (hamburger) ----
  const burger = qs('.fullscreen-nav');
  const mobileMenu = qs('.mobile-menu');
  if (burger && mobileMenu){
    burger.addEventListener('click', ()=> mobileMenu.classList.toggle('open'));
    mobileMenu.addEventListener('click', e=>{
      if(e.target.matches('.mobile-nav-link')) mobileMenu.classList.remove('open');
      if(e.target === mobileMenu) mobileMenu.classList.remove('open'); // click backdrop
    });
  }

  // ---- 2) Generic scroll-snap carousel helper (Releases & Talents) ----
  function enhanceSnapCarousel(containerSel, cardSel){
    const container = qs(containerSel);
    if(!container) return;

    // Only add arrows on small screens (snap mode)
    const isSnap = getComputedStyle(container).scrollSnapType.includes('x');
    if(isSnap){
      const wrap = document.createElement('div');
      wrap.className = 'carousel-arrows';
      const prev = document.createElement('button'); prev.className='carousel-btn'; prev.setAttribute('aria-label','Previous'); prev.innerHTML='&#10094;';
      const next = document.createElement('button'); next.className='carousel-btn'; next.setAttribute('aria-label','Next'); next.innerHTML='&#10095;';
      container.after(wrap); wrap.append(prev, next);

      const scrollByPage = (dir=1)=>{
        const amount = container.clientWidth * 0.9 * dir;
        container.scrollBy({left: amount, behavior:'smooth'});
      };
      prev.addEventListener('click', ()=>scrollByPage(-1));
      next.addEventListener('click', ()=>scrollByPage(1));
    }

    // drag to scroll (mouse + touch)
    let isDown=false, startX=0, scrollLeft=0;
    container.addEventListener('mousedown', e=>{ isDown=true; container.classList.add('grabbing'); startX=e.pageX; scrollLeft=container.scrollLeft; });
    container.addEventListener('mouseleave', ()=>{ isDown=false; container.classList.remove('grabbing'); });
    container.addEventListener('mouseup', ()=>{ isDown=false; container.classList.remove('grabbing'); });
    container.addEventListener('mousemove', e=>{
      if(!isDown) return;
      const dx = e.pageX - startX;
      container.scrollLeft = scrollLeft - dx;
    });

    let touchStartX=0, touchStartScroll=0;
    container.addEventListener('touchstart', e=>{ touchStartX = e.touches[0].pageX; touchStartScroll = container.scrollLeft; }, {passive:true});
    container.addEventListener('touchmove', e=>{
      const dx = e.touches[0].pageX - touchStartX;
      container.scrollLeft = touchStartScroll - dx;
    }, {passive:true});

    // keyboard support when focused
    container.setAttribute('tabindex','0');
    container.addEventListener('keydown', e=>{
      if(e.key === 'ArrowRight') container.scrollBy({left: container.clientWidth*0.9, behavior:'smooth'});
      if(e.key === 'ArrowLeft')  container.scrollBy({left:-container.clientWidth*0.9, behavior:'smooth'});
    });

    // add initial fade-up
    qsa(cardSel, container).forEach(el=>el.classList.add('fade-up'));
  }

  enhanceSnapCarousel('.releases-grid', '.release-item');
  enhanceSnapCarousel('.talent-grid', '.talent-card');

  // ---- 3) Videos slider + lightbox ----
  let currentSlide = 0;
  const slidesTrack = qs('.slides');
  const slideEls = qsa('.slide');
  const totalSlides = slideEls.length;

  function goToSlide(i){
    currentSlide = (i + totalSlides) % totalSlides;
    slidesTrack.style.transform = `translateX(${currentSlide * -100}%)`;
  }
  window.nextSlide = ()=>goToSlide(currentSlide+1);
  window.prevSlide = ()=>goToSlide(currentSlide-1);

  // Build thumbnails from data-video if needed (idempotent)
  slideEls.forEach(slide=>{
    const btn = qs('.play-btn', slide);
    const url = btn?.dataset?.video;
    const existingImg = slide.querySelector('img');
    if(url && !existingImg){
      const id = url.split('/').pop();
      const img = new Image();
      img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      img.alt = "Video Thumbnail";
      slide.prepend(img);
    }
  });

  // autoplay (pause on hover/focus)
  let timer = setInterval(()=>window.nextSlide(), 8000);
  const slider = qs('.slider');
  ['mouseenter','focusin','touchstart'].forEach(evt=> slider?.addEventListener(evt, ()=>{ clearInterval(timer); timer=null; }, {passive:true}));
  ['mouseleave','focusout','touchend'].forEach(evt=> slider?.addEventListener(evt, ()=>{ if(!timer) timer=setInterval(()=>window.nextSlide(),8000); }, {passive:true}));

  // swipe for videos track
  let sX=0, moving=false;
  slidesTrack?.addEventListener('touchstart', e=>{ sX = e.touches[0].clientX; moving=true; }, {passive:true});
  slidesTrack?.addEventListener('touchend', e=>{
    if(!moving) return; moving=false;
    const dx = (e.changedTouches?.[0]?.clientX ?? sX) - sX;
    if(Math.abs(dx) > 50) (dx<0 ? window.nextSlide() : window.prevSlide());
  });

  // Lightbox
  const lightbox = qs('#lightbox');
  const frame = qs('#videoFrame');
  qsa('.play-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const url = btn.getAttribute('data-video');
      frame.src = url + (url.includes('?') ? '&' : '?') + 'autoplay=1';
      lightbox.classList.add('open');
    });
  });
  window.closeLightbox = function(){
    lightbox.classList.remove('open');
    frame.src = '';
  };
  lightbox?.addEventListener('click', (e)=>{ if(e.target===lightbox) window.closeLightbox(); });

  // ---- 4) On-scroll reveal animations (IntersectionObserver) ----
  const reveal = qsa('.release-item, .talent-card, .upcoming-item, .section-title');
  reveal.forEach(el=> el.classList.add('fade-up'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); }
    });
  }, {threshold:.2});
  reveal.forEach(el=> io.observe(el));

  // ---- 5) Respect reduced motion ----
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced && timer){ clearInterval(timer); timer=null; }

})();

 

