var de=Object.defineProperty,pe=Object.defineProperties;var ve=Object.getOwnPropertyDescriptors;var q=Object.getOwnPropertySymbols;var ge=Object.prototype.hasOwnProperty,fe=Object.prototype.propertyIsEnumerable;var Y=(e,t,s)=>t in e?de(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s,Z=(e,t)=>{for(var s in t||(t={}))ge.call(t,s)&&Y(e,s,t[s]);if(q)for(var s of q(t))fe.call(t,s)&&Y(e,s,t[s]);return e},J=(e,t)=>pe(e,ve(t));import{s as Ee,E as _e,a as K,d as Q,r as p,w as W,b as me,c as Ce,e as Fe,f as ye,g as Ae,h as he,i as Pe,j as we,k as Se,o as E,l as F,m as g,n as c,p as _,F as B,u as f,q as Be,t as De,v as X,x as ee,y as te,z as ke,A as xe,B as $,C as O,D as be,G as Ie,H as Te,I as z,J as R,K as Ve,L as Le}from"./vendor.4a70112b.js";const $e=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))i(u);new MutationObserver(u=>{for(const n of u)if(n.type==="childList")for(const v of n.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&i(v)}).observe(document,{childList:!0,subtree:!0});function s(u){const n={};return u.integrity&&(n.integrity=u.integrity),u.referrerpolicy&&(n.referrerPolicy=u.referrerpolicy),u.crossorigin==="use-credentials"?n.credentials="include":u.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(u){if(u.ep)return;u.ep=!0;const n=s(u);fetch(u.href,n)}};$e();const Oe=20,oe=[10,20,30,40,50],se="1.3.0";function y(e,t){window.localStorage.setItem(e,JSON.stringify(t))}function A(e){const t=window.localStorage.getItem(e);return t&&JSON.parse(t)}function ze(e){return e?e<1024?`${e}KB`:1024<=e&&e<1048576?`${(e/1024).toFixed(2)}MB`:`${(e/1048576).toFixed(2)}GB`:"??"}const Re=["getAppVersion","selectFolder","openFileOrFolder","openDbFileFolder","scanProjectsToDb","getProjectsByPage","checkEverything"],D=window.electron,N=Boolean(D),ne=async()=>{if(!N)return;const e=(await D.apis.getAppVersion()).data;console.log("ELECTRON_VERSION:",e),e&&Ee.gt(se,e)&&_e({title:`\u6709\u65B0\u7684\u7248\u672C(${se})\u53EF\u7528\uFF0C\u5EFA\u8BAE\u66F4\u65B0`,dangerouslyUseHTMLString:!0,message:`\u5F53\u524D\u7248\u672C\uFF1A${e}`,position:"bottom-right",duration:0})};ne();const k=e=>{K({showClose:!0,message:e,type:"error",duration:0}),console.error(e||"\u51FA\u9519\u4E86")},Ne=async(e,...t)=>{if(!N)return k("\u5F53\u524D\u975E Electron \u73AF\u5883\uFF0C\u5E94\u7528\u65E0\u6CD5\u8C03\u7528\u63A5\u53E3"),{success:!1};const s=D.apis;return s[e]?(console.log(`request: ${e}`,t),s[e](...t).then(i=>(console.log("response:",i),i.success||(k(i.message),console.error(i.message)),i)).catch(i=>(k("\u63A5\u53E3\u51FA\u9519\u4E86"),console.error(i),{success:!1}))):(k(`Electron \u63A5\u53E3[${e}]\u4E0D\u5B58\u5728\uFF0C\u8BF7\u786E\u8BA4\u7248\u672C`),ne(),{success:!1})},x=Re.reduce((e,t)=>J(Z({},e),{[t]:(...s)=>Ne(t,...s)}),{}),je=async e=>N?D.getImg(e):"";var Ue=(e,t)=>{for(const[s,i]of t)e[s]=i;return e};const He=e=>(ke("data-v-4fcff994"),e=e(),xe(),e),Ge={class:"folder-line"},Me=z("\u9009\u62E9\u6587\u4EF6\u5939"),qe=z(" \u91CD\u65B0\u540C\u6B65 "),Ye=He(()=>g("span",{class:"order-explain"},"\u6839\u636E",-1)),Ze={class:"pagination-line"},Je={class:"pic-box"},Ke=["src","onClick","onContextmenu"],Qe=["title"],We={class:"pagination-line"},Xe=Q({setup(e){const t=p(!1),s=p(A("SELECTED_PATH")||""),i=p([]),u=p(0),n=p(1),v=p(A("PAGE_SIZE")||Oe),b=p([]),h=p(A("ORDER_BY")||"create_time"),m=p(A("ORDER_TYPE")||"DESC"),I=p(""),T=p(""),P=p(A("CHECK_REPEAT")||!1),j=(l,o)=>`${s.value}/${l}/${o}`,le=async l=>{for(const[o,{project_folder:r,preview:d}]of l.entries()){const C=await je(j(r,d));b.value.splice(o,1,C)}},w=async l=>{if(!s.value)return;window.scrollTo(0,0);const o=await x.getProjectsByPage({folderPath:s.value,orderBy:h.value,orderType:m.value,pageNo:l,pageSize:v.value,title:T.value,checkRepeat:P.value});if(o.success&&o.data){const r=o.data.list;i.value=r,u.value=o.data.total,b.value=new Array(r.length).fill(void 0),le(r)}},U=async l=>{t.value=!0;const o=new Promise(d=>setTimeout(d,500)),r=await x.scanProjectsToDb(l);o.then(()=>{if(t.value=!1,r.success&&r.data){const d=`\u6210\u529F\u540C\u6B65 ${r.data.length} \uFF0C\u65B0\u589E ${r.data.newCount} \uFF0C\u6E05\u9664 ${r.data.invalidCount} \u3002`;K({showClose:!0,message:d,type:"success",duration:3e3}),console.log(d),n.value===1&&w(1),n.value=1}})},ae=async()=>{t.value=!0;const l=await x.selectFolder();l.success&&l.data?(s.value=l.data,y("SELECTED_PATH",l.data),U(l.data)):t.value=!1},ue=()=>{m.value=m.value==="ASC"?"DESC":"ASC"},H=({project_folder:l,file:o},r)=>{x.openFileOrFolder(j(l,o),r)};return document.addEventListener("keydown",l=>{["ArrowLeft"].includes(l.code)?n.value>1&&(n.value-=1):["ArrowRight"].includes(l.code)&&n.value<Math.ceil(u.value/v.value)&&(n.value+=1)}),W([v,h,m,P,T],([l,o,r,d],[C,S,V,L])=>{if(l!==C&&y("PAGE_SIZE",l),o!==S&&y("ORDER_BY",o),r!==V&&y("ORDER_TYPE",r),d!==L&&y("CHECK_REPEAT",d),n.value!==1){n.value=1;return}w(n.value)}),W([n],([l])=>{w(l)}),w(n.value),(l,o)=>{const r=me,d=Ce,C=Fe,S=ye,V=Ae,L=he,re=Pe,G=we,ie=Se;return E(),F(B,null,[g("div",Ge,[c(C,{placement:"bottom",content:s.value,disabled:!s.value},{default:_(()=>[c(d,{onClick:ae,loading:t.value},{default:_(()=>[$(c(r,{style:{"margin-right":"6px"}},{default:_(()=>[$(c(f(be),null,null,512),[[O,!s.value]]),$(c(f(Ie),{color:"#67C23A"},null,512),[[O,s.value]])]),_:1},512),[[O,!t.value]]),Te(l.$slots,"default",{},()=>[Me],!0)]),_:3},8,["loading"])]),_:3},8,["content","disabled"]),s.value?(E(),F(B,{key:0},[c(d,{onClick:o[0]||(o[0]=()=>U(s.value)),icon:f(Be),loading:t.value},{default:_(()=>[qe]),_:1},8,["icon","loading"]),Ye,c(V,{modelValue:h.value,"onUpdate:modelValue":o[1]||(o[1]=a=>h.value=a),loading:t.value,style:{"margin-left":"12px",width:"120px"}},{default:_(()=>[c(S,{label:"\u521B\u5EFA\u65F6\u95F4",value:"create_time"}),c(S,{label:"\u6587\u4EF6\u5927\u5C0F",value:"file_size"})]),_:1},8,["modelValue","loading"]),c(d,{onClick:ue,icon:f(De),loading:t.value,style:{"margin-left":"12px"}},{default:_(()=>[z(R(m.value==="DESC"?"\u964D\u5E8F":"\u5347\u5E8F"),1)]),_:1},8,["icon","loading"]),c(L,{modelValue:I.value,"onUpdate:modelValue":o[3]||(o[3]=a=>I.value=a),placeholder:"\u8F93\u5165\u540D\u79F0\u641C\u7D22",style:{"margin-left":"12px",width:"200px"}},{append:_(()=>[c(d,{icon:f(Ve),onClick:o[2]||(o[2]=a=>T.value=I.value)},null,8,["icon"])]),_:1},8,["modelValue"]),c(re,{modelValue:P.value,"onUpdate:modelValue":o[4]||(o[4]=a=>P.value=a),label:"\u67E5\u91CD\u6A21\u5F0F",border:"",style:{"margin-left":"12px"}},null,8,["modelValue"])],64)):X("",!0)]),g("div",Ze,[c(G,{currentPage:n.value,"onUpdate:currentPage":o[5]||(o[5]=a=>n.value=a),"page-size":v.value,"onUpdate:page-size":o[6]||(o[6]=a=>v.value=a),"page-sizes":f(oe),total:u.value,background:"",layout:"total, sizes, prev, pager, next"},null,8,["currentPage","page-size","page-sizes","total"])]),i.value.length===0?(E(),ee(ie,{key:0,description:"\u4EC0\u4E48\u90FD\u6CA1\u6709~"})):X("",!0),g("div",Je,[(E(!0),F(B,null,te(i.value,(a,M)=>(E(),F("div",{key:M,class:"pic-item"},[g("img",{class:"img",alt:"",src:b.value[M],onClick:ce=>H(a),onContextmenu:ce=>H(a,!0)},null,40,Ke),g("p",{title:a.title}," ["+R(f(ze)(a.file_size))+"]\xA0"+R(a.title),9,Qe)]))),128)),(E(),F(B,null,te(10,a=>g("div",{key:a,class:"pic-item",style:{"margin-top":"0"}})),64))]),g("div",We,[c(G,{currentPage:n.value,"onUpdate:currentPage":o[7]||(o[7]=a=>n.value=a),"page-size":v.value,"onUpdate:page-size":o[8]||(o[8]=a=>v.value=a),"page-sizes":f(oe),total:u.value,background:"",layout:"total, sizes, prev, pager, next"},null,8,["currentPage","page-size","page-sizes","total"])])],64)}}});var et=Ue(Xe,[["__scopeId","data-v-4fcff994"]]);const tt=Q({setup(e){return(t,s)=>(E(),ee(et))}});console.log("APP_VERSION:","20220301a");Le(tt).mount("#app");
