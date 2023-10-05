(()=>{"use strict";var n={33:function(e,t,r){var n=this&&this.__awaiter||function(e,a,l,s){return new(l=l||Promise)(function(r,t){function n(e){try{i(s.next(e))}catch(e){t(e)}}function o(e){try{i(s.throw(e))}catch(e){t(e)}}function i(e){var t;e.done?r(e.value):((t=e.value)instanceof l?t:new l(function(e){e(t)})).then(n,o)}i((s=s.apply(e,a||[])).next())})};Object.defineProperty(t,"__esModule",{value:!0}),t.initializeControls=t.updateControls=void 0;const o=r(276),i=r(414);function a(e){return document.getElementById(e)}function l(){document.querySelector("#play-pause > img").setAttribute("src",`icons/${o.running?"pause":"play"}.svg`),a("speed").innerText=o.speed+"x",a("clear").disabled=(0,o.isUniverseEmpty)()}t.updateControls=l,t.initializeControls=function(){l(),"true"!==localStorage.getItem("/life/help-dismissed")&&(a("help").style.display="flex",a("show-help").disabled=!0),a("help-dismiss").addEventListener("click",()=>{a("dismiss-forever").checked&&localStorage.setItem("/life/help-dismissed","true"),a("help").style.display="none",a("show-help").disabled=!1}),a("help-close").addEventListener("click",()=>{a("help").style.display="none",a("show-help").disabled=!1}),a("show-help").addEventListener("click",()=>{"flex"===a("help").style.display?a("help").style.display="none":(a("dismiss-forever-container").style.display="none",a("help").style.display="flex",a("info").style.display="none")}),a("info-dismiss").addEventListener("click",()=>{a("info").style.display="none"}),a("info-close").addEventListener("click",()=>{a("info").style.display="none"}),a("show-info").addEventListener("click",()=>{"flex"===a("info").style.display?a("info").style.display="none":(a("dismiss-forever-container").style.display="none",a("info").style.display="flex",a("help").style.display="none",a("show-help").disabled=!1)}),a("play-pause").addEventListener("click",()=>{(0,o.toggleRunning)(),l()}),a("speed-decrease").addEventListener("click",()=>{(0,o.setSpeed)(o.speed/2),l()}),a("speed-increase").addEventListener("click",()=>{(0,o.setSpeed)(2*o.speed),l()}),a("step").addEventListener("click",()=>{(0,o.manualStep)(),l()}),a("clear").addEventListener("click",()=>{(0,o.clearUniverse)(),(0,i.displayPatternInfo)(void 0),l()}),a("refresh").addEventListener("click",()=>n(this,void 0,void 0,function*(){(0,o.clearUniverse)();var e=yield(0,i.loadRandomPattern)();(0,i.displayPatternInfo)(e),(0,o.loadObject)(-e.offsetX-Math.floor(e.width/2),-e.offsetY-Math.floor(e.height/2),e.data),l()}))}},607:function(e,t,r){var n=this&&this.__awaiter||function(e,a,l,s){return new(l=l||Promise)(function(r,t){function n(e){try{i(s.next(e))}catch(e){t(e)}}function o(e){try{i(s.throw(e))}catch(e){t(e)}}function i(e){var t;e.done?r(e.value):((t=e.value)instanceof l?t:new l(function(e){e(t)})).then(n,o)}i((s=s.apply(e,a||[])).next())})};Object.defineProperty(t,"__esModule",{value:!0});const o=r(33),i=r(276),a=r(414);n(void 0,void 0,void 0,function*(){(0,i.initializeLife)(),(0,o.initializeControls)();var e=yield(0,a.loadPatternByName)(location.hash.substring(1));(0,a.displayPatternInfo)(e),(0,i.loadObject)(-e.offsetX-Math.floor(e.width/2),-e.offsetY-Math.floor(e.height/2),e.data),(0,o.updateControls)(),(0,i.render)()}),addEventListener("hashchange",()=>n(void 0,void 0,void 0,function*(){(0,i.clearUniverse)();var e=yield(0,a.loadPatternByName)(location.hash.substring(1));(0,a.displayPatternInfo)(e),(0,i.loadObject)(-e.offsetX-Math.floor(e.width/2),-e.offsetY-Math.floor(e.height/2),e.data),(0,o.updateControls)()})),addEventListener("contextmenu",e=>{e.preventDefault()})},276:(e,u)=>{Object.defineProperty(u,"__esModule",{value:!0}),u.render=u.toggleRunning=u.setSpeed=u.running=u.speed=u.clearUniverse=u.isUniverseEmpty=u.manualStep=u.loadObject=u.initializeLife=void 0;const f=document.getElementById("canvas");let v,s,m,E,g,y=new Map,R=new Map;const T=96,b=128,x=16;if(T%x!=0)throw 0;function A(e,t){return 67108864*(e+33554432)+(t+33554432)}function F(e){return(e/67108864|0)-33554432}function w(e){return e%67108864-33554432}function r(e){var t=[];const r=g.createProgram();if(!r)throw new Error("could not create shader program");for(const i of e){var n=g.createShader(i.type);if(!n)throw new Error("could not create shader");if(t.push(n),g.shaderSource(n,i.source),g.compileShader(n),!g.getShaderParameter(n,g.COMPILE_STATUS))throw new Error("An error occurred while compiling: "+(null!=(n=g.getShaderInfoLog(n))?n:"<null>"))}for(const a of t)g.attachShader(r,a);if(g.linkProgram(r),!g.getProgramParameter(r,g.LINK_STATUS))throw new Error("An error occurred while linking: "+(null!=(e=g.getProgramInfoLog(r))?e:"<null>"));const o=new Map;return{program:r,getUniformLocation(e){var t;return o.has(e)?o.get(e):(t=g.getUniformLocation(r,e),o.set(e,t),t)}}}const n=[];function M(e,t=!1){t&&(g.bindFramebuffer(g.FRAMEBUFFER,e.fbo),g.clearColor(0,0,0,0),g.clear(g.COLOR_BUFFER_BIT),g.bindFramebuffer(g.FRAMEBUFFER,null)),n.push(e)}function o(e,t){var r=g.createTexture();if(r){g.bindTexture(g.TEXTURE_2D,r),g.pixelStorei(g.UNPACK_ALIGNMENT,1),g.texImage2D(g.TEXTURE_2D,0,g.R8,e,t,0,g.RED,g.UNSIGNED_BYTE,new Uint8Array(e*t)),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.NEAREST),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR),g.bindTexture(g.TEXTURE_2D,null);e=g.createFramebuffer();if(e)return g.bindFramebuffer(g.FRAMEBUFFER,e),g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,r,0),g.bindFramebuffer(g.FRAMEBUFFER,null),{texture:r,fbo:e}}throw 0}function _(){return 0<n.length?n.pop():o(T,T)}u.initializeLife=function(){var e=f.getContext("webgl2",{antialias:!1,depth:!1});if(e){g=e,v=r([{type:g.VERTEX_SHADER,source:`#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},{type:g.FRAGMENT_SHADER,source:`#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D curr;

			out vec4 fragColor;

			void main() {
				fragColor = vec4(vec3(texture(curr, uv).r), 1.0);
			}
		`}]),s=r([{type:g.VERTEX_SHADER,source:`#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},{type:g.FRAGMENT_SHADER,source:`#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D prev, curr;
			uniform float interpolation;

			out vec4 fragColor;

			void main() {
				fragColor = vec4(vec3(mix(texture(prev, uv).r, texture(curr, uv).r, interpolation)), 1.0);
			}
		`}]),m=r([{type:g.VERTEX_SHADER,source:`#version 300 es
			precision highp float;

			layout(location = 0) in vec2 pos;
			layout(location = 1) in vec2 uvInput;

			out vec2 uv;

			void main() {
				gl_Position = vec4(pos, 0.0, 1.0);
				uv = uvInput;
			}
		`},{type:g.FRAGMENT_SHADER,source:`#version 300 es
			precision highp float;

			in vec2 uv;

			uniform sampler2D[9] images;
			uniform vec2 viewportSize;

			out vec4 fragColor;

			bool getSample(vec2 point) {
				int x = point.x < 0.0 ? -1 : point.x >= 1.0 ? 1 : 0;
				int y = point.y < 0.0 ? -1 : point.y >= 1.0 ? 1 : 0;
				int idx = (x + 1) * 3 + (y + 1);
				point.x -= float(x);
				point.y -= float(y);
				switch (idx) {
					case 0: return texture(images[0], point).r != 0.0;
					case 1: return texture(images[1], point).r != 0.0;
					case 2: return texture(images[2], point).r != 0.0;
					case 3: return texture(images[3], point).r != 0.0;
					case 4: return texture(images[4], point).r != 0.0;
					case 5: return texture(images[5], point).r != 0.0;
					case 6: return texture(images[6], point).r != 0.0;
					case 7: return texture(images[7], point).r != 0.0;
					case 8: return texture(images[8], point).r != 0.0;
				}
			}

			void main() {
				int countNeighbors = 0;
				for (float dx = -1.0; dx <= 1.0; ++dx) {
					for (float dy = -1.0; dy <= 1.0; ++dy) {
						if (dx == 0.0 && dy == 0.0)
							continue;
						if (getSample(uv + vec2(dx, dy) / viewportSize))
							countNeighbors += 1;
					}
				}
				bool alive = texture(images[4], uv).r != 0.0;
				bool nextAlive = alive && countNeighbors == 2 || countNeighbors == 3;
				fragColor = nextAlive ? vec4(1.0) : vec4(0.0, 0.0, 0.0, 1.0);
			}
		`}]);e=g.createVertexArray();if(!e)throw 0;g.bindVertexArray(e);e=g.createBuffer();if(!e)throw 0;var t=new Float32Array([-1,-1,0,0,1,-1,1,0,1,1,1,1,-1,1,0,1]);g.bindBuffer(g.ARRAY_BUFFER,e),g.bufferData(g.ARRAY_BUFFER,t,g.STATIC_DRAW),g.vertexAttribPointer(0,2,g.FLOAT,!1,16,0),g.enableVertexAttribArray(0),g.vertexAttribPointer(1,2,g.FLOAT,!1,16,8),g.enableVertexAttribArray(1);for(let e=0;e<1024;++e)n.push(_());E=o(T/x,T/x*b)}},u.loadObject=function(n,o,i){if(0!==i.length){var a=i[0].length,l=i.length,r=Math.floor(n/T),s=Math.floor(o/T),e=Math.ceil((n+a)/T)-r,c=Math.ceil((o+l)/T)-s;for(let t=0;t<e;++t)for(let e=0;e<c;++e){var u=r+t,f=s+e,d=A(u,f),p=_(),h=(y.set(d,_()),R.set(d,p),new Uint8Array(T*T));for(let t=0,r=0;r<T;++r)for(let e=0;e<T;++e,++t){var v=u*T+e-n,m=f*T+r-o;0<=v&&0<=m&&v<a&&m<l&&i[m][v]&&(h[t]=255)}g.bindTexture(g.TEXTURE_2D,p.texture),g.texImage2D(g.TEXTURE_2D,0,g.R8,T,T,0,g.RED,g.UNSIGNED_BYTE,h),g.bindTexture(g.TEXTURE_2D,null)}}};let U=0;const I=new Set,L=new Set,S=new Uint8Array(T*T/(x*x)*b*4);function d(){g.viewport(0,0,T,T),g.useProgram(m.program),g.uniform2f(m.getUniformLocation("viewportSize"),T,T);for(let e=0;e<9;++e)g.uniform1i(m.getUniformLocation(`images[${e}]`),e)}function k(){document.getElementById("generation").innerText="Gen: "+U}function O(r,n){for(let t=-1;t<=1;++t)for(let e=-1;e<=1;++e){var o=3*(t+1)+(e+1),i=y.get(A(r+t,n+e));g.activeTexture(g.TEXTURE0+o),g.bindTexture(g.TEXTURE_2D,i?i.texture:null)}}function Y(){var e=y;y=R,R=e,U%T==0&&I.clear(),U%T==0&&L.clear();for(const f of y.keys()){var t=F(f),r=w(f),n=R.get(f);g.bindFramebuffer(g.FRAMEBUFFER,n.fbo),O(t,r),g.drawArrays(g.TRIANGLE_FAN,0,4)}if(U%T==0){var o=[];for(const d of y.keys())o.push(d);var i=o.map(e=>R.get(e));for(let t=0;t<i.length;t+=b){var a=function(t){var r=[];g.bindFramebuffer(g.FRAMEBUFFER,E.fbo),g.useProgram(v.program),g.uniform1i(v.getUniformLocation("curr"),0),g.activeTexture(g.TEXTURE0);for(let e=0;e<t.length;++e){var n=t[e];g.bindTexture(g.TEXTURE_2D,n.texture),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR_MIPMAP_LINEAR),g.generateMipmap(g.TEXTURE_2D),g.viewport(0,T*e/x,T/x,T/x),g.drawArrays(g.TRIANGLE_FAN,0,4),g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR)}var o=T*T/(x*x);g.readPixels(0,0,T/x,T/x*b,g.RGBA,g.UNSIGNED_BYTE,S),g.bindFramebuffer(g.FRAMEBUFFER,null);let i=0;for(let e=0;e<t.length;++e){let t=!1;for(let e=0;e<o;++e)if(0!==S[i+4*e]){t=!0;break}r.push(t),i+=4*o}return r}(i.slice(t,Math.min(i.length,t+b)));for(let e=0;e<a.length;++e)a[e]&&I.add(o[t+e])}g.viewport(0,0,T,T),g.useProgram(m.program);for(const p of I){var l=F(p),s=w(p);for(let t=-1;t<=1;++t)for(let e=-1;e<=1;++e){var c,u=A(l+t,s+e);L.add(u),y.has(u)||(c=_(),y.set(u,_()),R.set(u,c),g.bindFramebuffer(g.FRAMEBUFFER,c.fbo),O(l+t,s+e),g.drawArrays(g.TRIANGLE_FAN,0,4))}}for(const h of R.keys())L.has(h)||(M(R.get(h)),M(y.get(h)),R.delete(h),y.delete(h))}U+=1}u.manualStep=function(){d(),Y(),k()},u.isUniverseEmpty=function(){return 0===R.size},u.clearUniverse=function(){for(const e of R.values())M(e,!0);R.clear();for(const t of y.values())M(t,!0);y.clear(),U=0,u.running=!1,N=P=0,X=B=0,h=p=2},u.speed=1,u.running=!1;let p=2,h=2,P=0,B=0,N=0,X=0,D=void 0,G=performance.now(),C=0;function c(e,t,r){var t=Math.floor((t-P-Math.floor(f.width/2))/p),r=Math.floor((r-B-Math.floor(f.height/2))/p),n=Math.floor(t/T),o=Math.floor(r/T),t=t-n*T,r=r-o*T,n=A(n,o);let i=R.get(n);i||(i=_(),y.set(n,_()),R.set(n,i)),g.enable(g.SCISSOR_TEST),g.bindFramebuffer(g.FRAMEBUFFER,i.fbo),g.viewport(0,0,T,T),g.scissor(t,r,1,1);o=e?1:0;g.clearColor(o,o,o,o),g.clear(g.COLOR_BUFFER_BIT),g.bindFramebuffer(g.FRAMEBUFFER,null),g.disable(g.SCISSOR_TEST)}u.setSpeed=function(e){u.speed=e,C=0},u.toggleRunning=function(){u.running=!u.running,C=0},u.render=function e(){var t=u.running?30*u.speed:0,r=(requestAnimationFrame(e),performance.now()),n=(r-(D=void 0===D?r:D))/1e3,o=(D=r,C+=n,p+=(h-p)*(1-Math.exp(20*-n)),P+=(N-P)*(1-Math.exp(20*-n)),B+=(X-B)*(1-Math.exp(20*-n)),f.width=f.offsetWidth,f.height=f.offsetHeight,d(),C*t|0);C%=1/t;for(let e=0;e<Math.min(o,128);++e)G=r,Y();k(),g.bindFramebuffer(g.FRAMEBUFFER,null),g.clearColor(0,0,0,1),g.clear(g.COLOR_BUFFER_BIT),g.useProgram(v.program),g.uniform1i(v.getUniformLocation("curr"),1);for(const c of R.keys()){var i=F(c),a=w(c),l=y.get(c),s=R.get(c);g.viewport(Math.round(i*T*p)+P+Math.floor(f.width/2),Math.round(a*T*p)+B+Math.floor(f.height/2),Math.round((i+1)*T*p)-Math.round(i*T*p),Math.round((a+1)*T*p)-Math.round(a*T*p)),g.activeTexture(g.TEXTURE0),g.bindTexture(g.TEXTURE_2D,l.texture),g.activeTexture(g.TEXTURE1),g.bindTexture(g.TEXTURE_2D,s.texture),g.drawArrays(g.TRIANGLE_FAN,0,4)}};let t=0,i=0,a=!1,l=void 0;f.addEventListener("mousedown",e=>{0===e.button||1===e.button?(t=e.clientX,i=e.clientY,a=!0):2===e.button&&c(l=!function(e,t){var e=Math.floor((e-P-Math.floor(f.width/2))/p),t=Math.floor((t-B-Math.floor(f.height/2))/p),r=Math.floor(e/T),n=Math.floor(t/T),e=e-r*T,t=t-n*T,r=A(r,n);if(n=R.get(r))return g.bindFramebuffer(g.FRAMEBUFFER,n.fbo),r=new Uint8Array(4),g.readPixels(e,t,1,1,g.RGBA,g.UNSIGNED_BYTE,r),g.bindFramebuffer(g.FRAMEBUFFER,null),0!==r[0]}(e.clientX,e.clientY),e.clientX,e.clientY)}),document.addEventListener("mousemove",e=>{void 0!==l&&c(l,e.clientX,e.clientY),a&&(P+=e.clientX-t,B+=e.clientY-i,N+=e.clientX-t,X+=e.clientY-i,t=e.clientX,i=e.clientY)}),document.addEventListener("mouseup",e=>{2===e.button?l=void 0:0!==e.button&&1!==e.button||(a=!1)}),f.addEventListener("wheel",e=>{var t,r;e.preventDefault(),e.shiftKey?(N-=e.deltaX,X-=e.deltaY):(t=h,h=Math.min(Math.max(h*1.25**(-e.deltaY/120),.01),128),r=e.clientX-Math.floor(f.width/2),e=e.clientY-Math.floor(f.height/2),N=-(r-N)/t*h+r,X=-(e-X)/t*h+e)})},414:function(e,t){var n=this&&this.__awaiter||function(e,a,l,s){return new(l=l||Promise)(function(r,t){function n(e){try{i(s.next(e))}catch(e){t(e)}}function o(e){try{i(s.throw(e))}catch(e){t(e)}}function i(e){var t;e.done?r(e.value):((t=e.value)instanceof l?t:new l(function(e){e(t)})).then(n,o)}i((s=s.apply(e,a||[])).next())})};Object.defineProperty(t,"__esModule",{value:!0}),t.loadPatternByName=t.loadRandomPattern=t.displayPatternInfo=t.patterns=void 0;const f=1e6;function s(e,t){const r={filename:e,description:[],width:0,height:0,offsetX:0,offsetY:0,data:[]};let n=0,o=0;for(const c of t.split("\n")){var i,a=c.trim();if(i=a.match(/^x\s*=\s*(\d+),\s*y\s*=\s*(\d+)(|, .*)$/)){if(r.width=parseInt(i[1]),r.height=parseInt(i[2]),r.width*r.height>f)return;r.data=Array(r.height).fill(0).map(()=>Array(r.width).fill(!1))}else if(i=a.match(/^#\s*(N|n)\s*(.*)$/))r.name=i[2];else if(i=a.match(/^#\s*(O|o)\s*(.*)$/))r.author=i[2];else if(i=a.match(/^#\s*(C|c)\s*(.*)$/))r.description.push(i[2]);else if(i=a.match(/^#\s*(R|r|P|p)\s*(.*)\s*(.*)$/))r.offsetX=parseInt(i[2]),r.offsetY=parseInt(i[3]);else for(const u of a.matchAll(/(\d*)([bo\$!])/g)){var l=""===u[1]?1:parseInt(u[1]),s=u[2];if("b"===s)n+=l;else if("o"===s){if(o>=r.data.length)return;for(let e=0;e<l;++e,++n)r.data[o][n]=!0}else if("$"===s)o+=l,n=0;else if("!"===s)break}}return r}t.patterns=[];const c=new TextDecoder;t.displayPatternInfo=function(e){var t;e?(history.replaceState(void 0,"","#"+encodeURIComponent(e.filename)),document.getElementById("pattern-info").style.display="block",document.getElementById("pattern-name").innerText=null!=(t=e.name)?t:"Untitled",document.getElementById("author").innerText="by "+(null!=(t=e.author)?t:"unknown author"),document.getElementById("description").innerHTML=e.description.map(e=>e.replace(/&/g,"&amp;")).map(e=>e.replace(/</g,"&lt;")).map(e=>e.replace(/>/g,"&gt;")).map(e=>e.replace(/"/g,"&quot;")).map(e=>e.replace(/'/g,"&apos;")).map(e=>e.match(/^(http(s|):\/\/|)[a-z\-\.]+\.com\/[\S]+$/g)?`<a href="${e.startsWith("http")?e:"https://"+e}">${e}</a><br>`:`<span>${e}</span><br>`).join("")):(history.replaceState(void 0,"",location.pathname),document.getElementById("pattern-info").style.display="none")},document.getElementById("pattern-close").addEventListener("click",()=>{document.getElementById("pattern-info").style.display="none"});const u=new Map;let r;function d(){return r=r||n(this,void 0,void 0,function*(){var e=yield fetch("patterns.tar").then(e=>e.arrayBuffer()),o=new Uint8Array(e),i=u;for(let n=0;0!==o[n+257];){if("ustar"!==c.decode(o.subarray(n+257,n+262)))throw new Error("malformed tar");let e=n;for(;0!==o[e];)e+=1;let t=c.decode(o.subarray(n,e)),r=0;for(let e=n+124;;e+=1){var a=o[e];if(!(48<=a))break;r=8*r+a-48}(t=t.startsWith("./")?t.substring(2):t).endsWith(".rle")&&(t=t.substring(0,t.length-4)),i.set(t,o.subarray(n+512,n+512+r)),n+=512*(1+(r+511)/512|0)}})}function o(){return n(this,void 0,void 0,function*(){if(yield d(),0==u.size)throw 0;var e,t,r=[...u.entries()];let n=0;for([e,t]of r)n+=t.length;let o;for(;void 0===o||void 0===o.author;){var i,a,l=Math.random()*n;let e=0;for([i,a]of r)if(l<(e+=a.length)){o=s(i,c.decode(a));break}}return o})}t.loadRandomPattern=o,t.loadPatternByName=function(r){return n(this,void 0,void 0,function*(){if(yield d(),0!=u.size&&""!==r)for(var[e,t]of u.entries())if(e===r)return s(e,c.decode(t))||(yield o());return yield o()})}}},o={};(function e(t){var r=o[t];return void 0===r&&(r=o[t]={exports:{}},n[t].call(r.exports,r,r.exports,e)),r.exports})(607)})();