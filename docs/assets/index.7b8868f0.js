import{d as T,r as p,w as b,E as q,a as J,b as Q,c as W,e as X,f as ee,o as _,g as y,h as v,i as c,j as m,F as C,u as f,k as te,s as oe,l as ae,m as O,p as ne,n as le,q as R,t as x,v as A,x as se,y as ie,z as re,A as B,B as D,C as ue,D as ce}from"./vendor.7f093729.js";const de=function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))g(n);new MutationObserver(n=>{for(const t of n)if(t.type==="childList")for(const u of t.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&g(u)}).observe(document,{childList:!0,subtree:!0});function r(n){const t={};return n.integrity&&(t.integrity=n.integrity),n.referrerpolicy&&(t.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?t.credentials="include":n.crossorigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function g(n){if(n.ep)return;n.ep=!0;const t=r(n);fetch(n.href,t)}};de();const pe=20,N=[10,20,30,40,50];function h(a,l){window.localStorage.setItem(a,JSON.stringify(l))}function P(a){const l=window.localStorage.getItem(a);return l&&JSON.parse(l)}function ve(a){return a?a<1024?`${a}KB`:1024<=a&&a<1048576?`${(a/1024).toFixed(2)}MB`:`${(a/1048576).toFixed(2)}GB`:"??"}var ge=(a,l)=>{for(const[r,g]of l)a[r]=g;return a};const fe=a=>(ne("data-v-f10ec7c8"),a=a(),le(),a),_e={class:"folder-line"},me=B("\u9009\u62E9\u6587\u4EF6\u5939"),Ee=B(" \u91CD\u65B0\u540C\u6B65 "),ye=fe(()=>v("span",{class:"order-explain"},"\u6839\u636E",-1)),we={class:"pagination-line"},Fe={class:"pic-box"},Ce=["src","onClick","onContextmenu"],he=["title"],Pe={class:"pagination-line"},Se=T({setup(a){console.log(window.electron);const l=p(!1),r=p(P("SELECTED_PATH")||""),g=p([]),n=p(0),t=p(1),u=p(P("PAGE_SIZE")||pe),S=p([]),w=p(P("ORDER_BY")||"create_time"),E=p(P("ORDER_TYPE")||"DESC"),k=(e,o)=>`${r.value}/${e}/${o}`,j=e=>window.electron.getImg(k(e.project_folder,e.preview)),V=async e=>{for(const[o,s]of e.entries()){const d=await j(s);S.value.splice(o,1,d)}},U=e=>{window.electron.apis.openFile(k(e.project_folder,e.file))},G=e=>{window.electron.apis.openFileFolder(`${r.value}/${e.project_folder}`)},F=async(e,o)=>{!r.value||window.electron.apis.getProjectsByPage(r.value,w.value,E.value,e,o).then(s=>{console.log("getProjects res",s);const d=s.data.list;g.value=d,n.value=s.data.total,S.value=new Array(d.length).fill(void 0),V(d)})},I=async e=>{l.value=!0;const o=new Promise(d=>setTimeout(d,500)),s=await window.electron.apis.scanProjectsToDb(e);o.then(()=>{l.value=!1,console.log("scanRes",s),s.success?(R({showClose:!0,message:`\u6210\u529F\u540C\u6B65 ${s.data.length} \uFF0C\u65B0\u589E ${s.data.newCount} \uFF0C\u6E05\u9664 ${s.data.invalidCount} \u3002`,type:"success",duration:2500}),t.value===1&&F(1,u.value),t.value=1):(console.log(s.msg),R({showClose:!0,message:`\u53D1\u751F\u4E86\u9519\u8BEF\uFF1A ${s.msg}`,type:"error",duration:2500}))})},H=async()=>{const e=await window.electron.apis.selectFolder();e.success&&e.data&&(r.value=e.data,h("SELECTED_PATH",e.data),I(e.data))},K=()=>{E.value=E.value==="ASC"?"DESC":"ASC"};return document.addEventListener("keydown",e=>{["ArrowLeft","KeyA"].includes(e.code)?t.value>1&&(t.value-=1):["ArrowRight","KeyD"].includes(e.code)&&t.value<Math.ceil(n.value/u.value)&&(t.value+=1)}),b([t,u],([e,o],[,s])=>{if(o!==s&&(h("PAGE_SIZE",o),e!==1)){t.value=1;return}F(e,o)}),b([w,E],([e,o])=>{h("ORDER_BY",e),h("ORDER_TYPE",o),F(t.value,u.value)}),F(t.value,u.value),(e,o)=>{const s=q,d=J,M=Q,$=W,Y=X,z=ee;return _(),y(C,null,[v("div",_e,[c(M,{placement:"bottom",content:r.value,disabled:!r.value},{default:m(()=>[c(d,{onClick:H,loading:l.value},{default:m(()=>[x(c(s,{style:{"margin-right":"6px"}},{default:m(()=>[x(c(f(se),null,null,512),[[A,!r.value]]),x(c(f(ie),{color:"#67C23A"},null,512),[[A,r.value]])]),_:1},512),[[A,!l.value]]),re(e.$slots,"default",{},()=>[me],!0)]),_:3},8,["loading"])]),_:3},8,["content","disabled"]),r.value?(_(),y(C,{key:0},[c(d,{onClick:o[0]||(o[0]=()=>I(r.value)),icon:f(te),loading:l.value},{default:m(()=>[Ee]),_:1},8,["icon","loading"]),ye,c(Y,{modelValue:w.value,"onUpdate:modelValue":o[1]||(o[1]=i=>w.value=i),loading:l.value,style:{"margin-left":"12px",width:"120px"}},{default:m(()=>[c($,{label:"\u521B\u5EFA\u65F6\u95F4",value:"create_time"}),c($,{label:"\u6587\u4EF6\u5927\u5C0F",value:"file_size"})]),_:1},8,["modelValue","loading"]),c(d,{onClick:K,icon:f(oe),loading:l.value,style:{"margin-left":"12px"}},{default:m(()=>[B(D(E.value==="DESC"?"\u964D\u5E8F":"\u5347\u5E8F"),1)]),_:1},8,["icon","loading"])],64)):ae("",!0)]),v("div",we,[c(z,{currentPage:t.value,"onUpdate:currentPage":o[2]||(o[2]=i=>t.value=i),"page-size":u.value,"onUpdate:page-size":o[3]||(o[3]=i=>u.value=i),"page-sizes":f(N),total:n.value,background:"",layout:"prev, pager, next, total, sizes"},null,8,["currentPage","page-size","page-sizes","total"])]),v("div",Fe,[(_(!0),y(C,null,O(g.value,(i,L)=>(_(),y("div",{key:L,class:"pic-item"},[v("img",{class:"img",alt:"",src:S.value[L],onClick:Z=>U(i),onContextmenu:Z=>G(i)},null,40,Ce),v("p",{title:i.title}," ["+D(f(ve)(i.file_size))+"]\xA0"+D(i.title),9,he)]))),128)),(_(),y(C,null,O(10,i=>v("div",{key:i,class:"pic-item",style:{"margin-top":"0"}})),64))]),v("div",Pe,[c(z,{currentPage:t.value,"onUpdate:currentPage":o[4]||(o[4]=i=>t.value=i),"page-size":u.value,"onUpdate:page-size":o[5]||(o[5]=i=>u.value=i),"page-sizes":f(N),total:n.value,background:"",layout:"prev, pager, next, total, sizes"},null,8,["currentPage","page-size","page-sizes","total"])])],64)}}});var xe=ge(Se,[["__scopeId","data-v-f10ec7c8"]]);const Ae=T({setup(a){return(l,r)=>(_(),ue(xe))}});ce(Ae).mount("#app");