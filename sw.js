if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let t={};const c=e=>i(e,o),l={module:{uri:o},exports:t,require:c};s[o]=Promise.all(n.map((e=>l[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-6475daa3"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-C-8HtUVX.js",revision:null},{url:"assets/index-DGqIVI-O.css",revision:null},{url:"assets/workbox-window.prod.es5-B9K5rw8f.js",revision:null},{url:"favicon.ico",revision:"d3e10941c94d80ef83c057f0720f1743"},{url:"icons/pwa.png",revision:"756622d7295c7af50c25f4cd255f65ee"},{url:"index.html",revision:"859b12d301e37a5a1764c12ba9ea3d17"},{url:"icons/pwa.png",revision:"756622d7295c7af50c25f4cd255f65ee"},{url:"manifest.webmanifest",revision:"d071b4034f9fa15a306cdba208988a12"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(/^https:\/\/api\./i,new e.NetworkOnly,"GET"),e.registerRoute(/\.(js|css|html|ico|png|svg)$/i,new e.StaleWhileRevalidate({cacheName:"static-resources",plugins:[new e.ExpirationPlugin({maxEntries:200,maxAgeSeconds:2592e3})]}),"GET")}));
