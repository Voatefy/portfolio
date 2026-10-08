(function(){
  var body=document.body, intro=document.getElementById('intro');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen=false;
  try{seen=sessionStorage.getItem('intro-seen')==='1'}catch(e){}

  function reveal(){ body.classList.remove('locked'); body.classList.add('ready'); }
  function finish(){
    try{sessionStorage.setItem('intro-seen','1')}catch(e){}
    intro.classList.add('out');
    setTimeout(reveal,450);
  }

  // letter-level split (used by the intro)
  function split(root){
    var idx=0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(p){
            if(!p) return;
            if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return}
            var g=document.createElement('span'); g.className='g';
            p.split('').forEach(function(c){var l=document.createElement('span');l.className='l';l.style.setProperty('--i',idx++);l.textContent=c;g.appendChild(l)});
            frag.appendChild(g);
          });
          n.parentNode.replaceChild(frag,n);
        } else if(n.nodeType===1) walk(n);
      });
    })(root);
  }

  if(seen||reduce){ intro.style.display='none'; reveal(); }
  else{
    var words=[].slice.call(intro.querySelectorAll('.word')), verdict=intro.querySelector('.verdict'),
        ticks=intro.querySelectorAll('.ticks i'), wrap=intro.querySelector('.stage-wrap');
    words.forEach(split); split(verdict.querySelector('.mask'));
    var t=350;
    words.forEach(function(w,i){
      setTimeout(function(){ w.classList.add('in'); ticks[i].classList.add('on') },t);
      setTimeout(function(){ w.classList.add('out') },t+950);
      t+=1000;
    });
    t+=250;
    setTimeout(function(){ wrap.classList.add('fin'); verdict.classList.add('in') },t);
    setTimeout(finish,t+2300);
  }

  // Scroll: top bar after the hero, active menu link, light/dark cursor context
  var ids=['about','academics','projects','awards','impact','stack','contact'];
  var els=ids.map(function(i){return document.getElementById(i)});
  var tlinks=[].slice.call(document.querySelectorAll('.topbar .menu a')), ticking=false;
  function onScroll(){
    body.classList.toggle('past',scrollY>60);
    var y=scrollY+innerHeight*.5, cur='top';
    for(var i=0;i<els.length;i++){ if(y>=els[i].offsetTop) cur=ids[i]; }
    tlinks.forEach(function(a){a.classList.toggle('on',a.dataset.s===cur)});
    body.classList.toggle('on-light',els[els.length-1].getBoundingClientRect().top<innerHeight*.5);
    ticking=false;
  }
  addEventListener('scroll',function(){ if(!ticking){ticking=true;requestAnimationFrame(onScroll)} },{passive:true});
  onScroll();

  // Scroll reveal for the lower pages
  var srs=[].slice.call(document.querySelectorAll('.sr'));
  if(reduce||!('IntersectionObserver' in window)){ srs.forEach(function(e){e.classList.add('in')}); }
  else{
    var rio=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var el=e.target, i=srs.indexOf(el);
        el.style.transitionDelay=(i%4)*80+'ms';
        el.classList.add('in'); rio.unobserve(el);
        setTimeout(function(){el.style.transitionDelay=''},1400);   // keep hover effects instant afterwards
      });
    },{threshold:.12});
    srs.forEach(function(e){rio.observe(e)});
  }

  // About: dotted contour shape (two overlapping blobs, slowly morphing)
  var cv=document.getElementById('blob');
  if(cv){
    var ctx=cv.getContext('2d'), dpr=Math.min(window.devicePixelRatio||1,2), W=0,H=0, vis=true, px=0, py=0, tx=0, ty=0;
    var colsA=['#10B981','#10B981','#047857','#9CA3AF'], colsB=['#047857','#ECFDF5','#6B7280'];
    function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
    function shape(cx,cy,R,t,seed,cols,K,alpha){
      for(var k=1;k<=K;k++){
        var s=k/K, n=Math.round(34+s*108), rad=.8+s*1.2;
        for(var j=0;j<n;j++){
          var a=j/n*6.2832;
          var w=1+.26*Math.sin(3*a+t*.5+seed)+.16*Math.sin(5*a-t*.35+s*3+seed*2)+.1*Math.sin(2*a+t*.25-s*2);
          var r=R*s*w;
          ctx.fillStyle=cols[(Math.floor(a/6.2832*cols.length+s*2))%cols.length];
          ctx.globalAlpha=alpha*(.25+s*.6);
          ctx.beginPath();
          ctx.arc(cx+r*Math.cos(a)+(1-s)*18*Math.sin(t*.4+seed),cy+r*Math.sin(a)*.78+(1-s)*14*Math.cos(t*.35+seed),rad,0,6.2832);
          ctx.fill();
        }
      }
    }
    function draw(ms){
      var t=ms/1000, m=Math.min(W,H);
      px+=(tx-px)*.05; py+=(ty-py)*.05;
      ctx.clearRect(0,0,W,H);
      shape(W*.62+px*.6,H*.6+py*.6,m*.36,t+2,2.1,colsB,18,.45);
      shape(W*.38+px,H*.46+py,m*.44,t,0,colsA,20,1);
      ctx.globalAlpha=1;
    }
    size(); addEventListener('resize',size);
    if(reduce){ draw(2500) }
    else{
      if('IntersectionObserver' in window) new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(cv);
      addEventListener('mousemove',function(e){tx=(e.clientX/innerWidth-.5)*40;ty=(e.clientY/innerHeight-.5)*30},{passive:true});
      (function frame(ms){ if(vis) draw(ms); requestAnimationFrame(frame) })(0);
    }
  }

  // Name: split into letters for the hover wave
  var k=0;
  document.querySelectorAll('.nm>span').forEach(function(line){
    var txt=line.textContent; line.textContent=''; line.setAttribute('aria-hidden','true');
    txt.split('').forEach(function(c){var e=document.createElement('span');e.className='ch';e.style.setProperty('--i',k++);e.textContent=c;line.appendChild(e)});
  });

  // Round cursor: dot + trailing ring, changes on name and on buttons/links
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    var dot=document.querySelector('.cur-dot'), ring=document.querySelector('.cur-ring');
    var mx=-100,my=-100,rx=-100,ry=-100,fx=null,items=[];
    function clearFx(){
      if(!fx) return;
      fx.style.removeProperty('--mx'); fx.style.removeProperty('--my');
      items.forEach(function(el){el.style.removeProperty('--lx'); el.style.removeProperty('--ly')});
      fx=null; items=[];
    }
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;body.classList.add('has-cur')},{passive:true});
    document.documentElement.addEventListener('mouseleave',function(){body.classList.remove('has-cur');clearFx();delete body.dataset.state});
    document.addEventListener('mouseover',function(e){
      var t=e.target.closest&&e.target.closest('[data-cur],a');
      if(t) body.dataset.state=t.dataset.cur||'link'; else delete body.dataset.state;
      var f=e.target.closest&&e.target.closest('.fx');
      if(f!==fx){ clearFx(); if(f){fx=f;items=[].slice.call(f.querySelectorAll('.ink,.ch'))} }
    });
    (function loop(){
      rx+=(mx-rx)*.24; ry+=(my-ry)*.24;
      dot.style.transform='translate3d('+mx+'px,'+my+'px,0) translate(-50%,-50%)';
      ring.style.transform='translate3d('+rx+'px,'+ry+'px,0) translate(-50%,-50%)';
      if(fx){
        var r=fx.getBoundingClientRect(), rects=items.map(function(el){return el.getBoundingClientRect()});
        fx.style.setProperty('--mx',(rx-r.left)+'px'); fx.style.setProperty('--my',(ry-r.top)+'px');
        items.forEach(function(el,i){el.style.setProperty('--lx',(rx-rects[i].left)+'px'); el.style.setProperty('--ly',(ry-rects[i].top)+'px')});
      }
      requestAnimationFrame(loop);
    })();
  }

  // Impact: scrolling the page shows the cards one by one (the active card scales up and takes the centre)
  var is=document.querySelector('.ishow');
  if(is){
    var os=is.parentElement, tr=is.querySelector('.itrack'), cards=[].slice.call(tr.children), dts=[].slice.call(is.querySelectorAll('.hdots button')),
        cnt=is.querySelector('.hcount'), n=cards.length, idx=-1, step=1;
    is.classList.add('auto');
    var top0=function(){ return os.getBoundingClientRect().top+scrollY; };
    var measure=function(){ step=innerHeight*.8; os.style.height=(innerHeight+(n-1)*step)+'px'; };
    var go=function(k,instant){
      idx=k; var c=cards[idx];
      var x=is.clientWidth/2-(c.offsetLeft+c.offsetWidth/2);
      if(instant) tr.style.transition='none';
      tr.style.transform='translate3d('+x+'px,0,0)';
      if(instant){ void tr.offsetWidth; tr.style.transition=''; }
      cards.forEach(function(el,j){ el.classList.toggle('on',j===idx); });
      dts.forEach(function(d,j){ d.classList.toggle('on',j===idx); });
      cnt.textContent='0'+(idx+1)+' / 0'+n;
      var im=c.querySelector('.wimg'); is.style.setProperty('--ay',(tr.offsetTop+im.offsetTop+im.offsetHeight/2)+'px');   // arrows follow the image's vertical centre
    };
    var update=function(){
      var i=Math.min(n-1,Math.max(0,Math.round((scrollY-top0())/step)));
      if(i!==idx) go(i);
    };
    var toStep=function(j){ scrollTo({top:top0()+j*step,behavior:'smooth'}); };
    measure(); go(0,true);
    is.querySelector('.iprev').addEventListener('click',function(){ toStep(Math.max(0,idx-1)); });
    is.querySelector('.inext').addEventListener('click',function(){ toStep(Math.min(n-1,idx+1)); });
    dts.forEach(function(d,j){ d.addEventListener('click',function(){ toStep(j); }); });
    addEventListener('scroll',update,{passive:true});
    // If the visitor stops scrolling, the cards move on by themselves (one every 1.5 s) until the last one.
    var lastUser=0;
    ['wheel','touchstart','touchmove','keydown','mousedown'].forEach(function(t){ addEventListener(t,function(){ lastUser=Date.now(); },{passive:true}); });
    var inPin=function(){ var p=(scrollY-top0())/step; return p>=-.02 && p<n-1-.02; };
    if(!reduce) setInterval(function(){
      if(document.hidden || Date.now()-lastUser<1500 || !inPin()) return;
      toStep(Math.min(n-1,idx+1));
    },1500);

    // Auto-advance: if the visitor does nothing for 1.5 s, the next card comes by itself
    // (by scrolling the page one step, so the scroll position always stays in sync).
    var idleT=null, programmatic=false, AUTO=1500;
    var inView=function(){ var y=scrollY-top0(); return y>=-innerHeight*.1 && y<=(n-1)*step+innerHeight*.1; };
    var arm=function(){ clearTimeout(idleT); if(reduce||document.hidden||idx>=n-1) return; idleT=setTimeout(tick,AUTO); };
    var tick=function(){
      if(!inView()||idx>=n-1){ arm(); return; }
      programmatic=true; toStep(idx+1);
      setTimeout(function(){ programmatic=false; },900);
      idleT=setTimeout(tick,AUTO);
    };
    var userAct=function(){ programmatic=false; arm(); };
    ['wheel','touchstart','touchmove','keydown','pointerdown'].forEach(function(ev){ addEventListener(ev,userAct,{passive:true}); });
    addEventListener('scroll',function(){ if(!programmatic) arm(); },{passive:true});
    document.addEventListener('visibilitychange',arm);
    arm();
    var again=function(){ measure(); go(Math.max(0,idx),true); update(); };
    addEventListener('resize',again); addEventListener('load',again);
  }
})();