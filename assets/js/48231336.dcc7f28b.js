(self.webpackChunkIOTA_Identity_X_Team=self.webpackChunkIOTA_Identity_X_Team||[]).push([[256],{3905:function(e,t,r){"use strict";r.r(t),r.d(t,{MDXContext:function(){return l},MDXProvider:function(){return p},mdx:function(){return b},useMDXComponents:function(){return d},withMDXComponents:function(){return s}});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(){return(a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function u(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var l=n.createContext({}),s=function(e){return function(t){var r=d(t.components);return n.createElement(e,a({},t,{components:r}))}},d=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):u(u({},t),e)),r},p=function(e){var t=d(e.components);return n.createElement(l.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,i=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),s=d(r),p=o,f=s["".concat(i,".").concat(p)]||s[p]||m[p]||a;return r?n.createElement(f,u(u({ref:t},l),{},{components:r})):n.createElement(f,u({ref:t},l))}));function b(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=f;var u={};for(var c in t)hasOwnProperty.call(t,c)&&(u[c]=t[c]);u.originalType=e,u.mdxType="string"==typeof e?e:o,i[1]=u;for(var l=2;l<a;l++)i[l]=r[l];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},3358:function(e,t,r){"use strict";r.r(t),r.d(t,{frontMatter:function(){return i},metadata:function(){return u},toc:function(){return c},default:function(){return s}});var n=r(2122),o=r(9756),a=(r(7294),r(3905)),i={sidebar_position:1},u={unversionedId:"contribute/create-a-tutorial",id:"contribute/create-a-tutorial",isDocsHomePage:!1,title:"Create a Tutorial",description:"Create your first Tutorial",source:"@site/docs/contribute/create-a-tutorial.md",sourceDirName:"contribute",slug:"/contribute/create-a-tutorial",permalink:"/docs/contribute/create-a-tutorial",editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/contribute/create-a-tutorial.md",version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Meetings and Notes",permalink:"/docs/meetings/your_meeting_nots"},next:{title:"Create a Blog Post",permalink:"/docs/contribute/create-a-blog-post"}},c=[{value:"Create your first Tutorial",id:"create-your-first-tutorial",children:[]},{value:"Configure the Sidebar",id:"configure-the-sidebar",children:[]}],l={toc:c};function s(e){var t=e.components,r=(0,o.default)(e,["components"]);return(0,a.mdx)("wrapper",(0,n.default)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,a.mdx)("h2",{id:"create-your-first-tutorial"},"Create your first Tutorial"),(0,a.mdx)("p",null,"Create a markdown file at ",(0,a.mdx)("inlineCode",{parentName:"p"},"docs/tutorials/your_tutorial_name.md"),":"),(0,a.mdx)("pre",null,(0,a.mdx)("code",{parentName:"pre",className:"language-md",metastring:'title="docs/tutorials/your_tutorial_name.md"',title:'"docs/tutorials/your_tutorial_name.md"'},"# Hello\n\nThis is my **first Tutorial**!\n")),(0,a.mdx)("p",null,"A new document is now available at ",(0,a.mdx)("inlineCode",{parentName:"p"},"http://localhost:3000/docs/tutorials/your_tutorial_name"),"."),(0,a.mdx)("h2",{id:"configure-the-sidebar"},"Configure the Sidebar"),(0,a.mdx)("p",null,"Add metadatas to customize the sidebar label and position:"),(0,a.mdx)("pre",null,(0,a.mdx)("code",{parentName:"pre",className:"language-diff",metastring:'title="docs/hello.md"',title:'"docs/hello.md"'},'+ ---\n+ sidebar_label: "My first Tutorial!"\n+ sidebar_position: 1\n+ ---\n')))}s.isMDXComponent=!0}}]);