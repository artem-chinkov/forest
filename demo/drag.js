(function(root){'use strict';
  function attach(container,{drop}) {
    let drag=null,ghost=null,suppressUntil=0;
    const zone=()=>container.querySelector('[data-action="drop"]');
    function cleanup(){if(ghost)ghost.remove();ghost=null;container.querySelectorAll('.dragging,.drop-hover').forEach(el=>el.classList.remove('dragging','drop-hover'));drag=null;}
    function down(event){const button=event.target.closest('[data-pack]');if(!button||button.disabled||event.button!==0)return;
      const rect=button.getBoundingClientRect();drag={id:button.dataset.pack,pointer:event.pointerId,button,x:event.clientX,y:event.clientY,rect,moved:false};button.setPointerCapture(event.pointerId);
    }
    function move(event){if(!drag||event.pointerId!==drag.pointer)return;
      if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;
      event.preventDefault();
      if(!drag.moved){drag.moved=true;ghost=drag.button.cloneNode(true);ghost.removeAttribute('data-pack');ghost.removeAttribute('id');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.style.width=drag.rect.width+'px';ghost.style.height=drag.rect.height+'px';document.body.append(ghost);drag.button.classList.add('dragging');}
      ghost.style.left=event.clientX-drag.rect.width/2+'px';ghost.style.top=event.clientY-drag.rect.height/2+'px';
      const target=zone();if(target){const r=target.getBoundingClientRect();target.classList.toggle('drop-hover',!target.disabled&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom);}
    }
    function up(event){if(!drag||event.pointerId!==drag.pointer)return;const {id,moved}=drag;let accepted=false;
      if(moved){const target=zone();if(target&&!target.disabled){const r=target.getBoundingClientRect();accepted=event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}suppressUntil=performance.now()+500;}
      cleanup();if(moved&&accepted)drop(id);
    }
    function cancel(event){if(drag&&event.pointerId===drag.pointer)cleanup();}
    function click(event){if(event.detail&&performance.now()<suppressUntil&&event.target.closest('[data-pack]')){event.preventDefault();event.stopImmediatePropagation();}}
    container.addEventListener('pointerdown',down);container.addEventListener('pointermove',move);container.addEventListener('pointerup',up);container.addEventListener('pointercancel',cancel);container.addEventListener('click',click,true);
    return()=>{cleanup();container.removeEventListener('pointerdown',down);container.removeEventListener('pointermove',move);container.removeEventListener('pointerup',up);container.removeEventListener('pointercancel',cancel);container.removeEventListener('click',click,true);};
  }
  root.ForestDrag={attach};
})(window);
